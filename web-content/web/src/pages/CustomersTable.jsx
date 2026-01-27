import { useState } from 'react';
import './CustomersTable.css';

const CustomersTable = () => {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'John Anderson', email: 'john@example.com', status: 'Active', amount: '48.00', phone: '+1-234-567-8900', company: 'Tech Corp', joinDate: '2023-01-15' },
    { id: 2, name: 'Monica Sullivan', email: 'monica@example.com', status: 'Active', amount: '35.00', phone: '+1-234-567-8901', company: 'Design Inc', joinDate: '2023-02-20' },
    { id: 3, name: 'Alfredo Santiago', email: 'alfredo@example.com', status: 'Active', amount: '80.00', phone: '+1-234-567-8902', company: 'Creative Ltd', joinDate: '2023-03-10' },
    { id: 4, name: 'Alfren Santagian', email: 'alfren@example.com', status: 'Inactive', amount: 'N/A', phone: '+1-234-567-8903', company: 'Startup Co', joinDate: '2023-04-05' },
    { id: 5, name: 'Christopher Davis', email: 'christopher@example.com', status: 'Active', amount: '45.00', phone: '+1-234-567-8904', company: 'Enterprise Pro', joinDate: '2023-05-12' },
    { id: 6, name: 'Christine Pierce', email: 'christine@example.com', status: 'Active', amount: '55.00', phone: '+1-234-567-8905', company: 'Global Solutions', joinDate: '2023-06-18' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(customers.map(c => c.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rid => rid !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-page">
      <div className="customers-container">
        {/* Header Section */}
        <div className="customers-header">
          <div className="header-left">
            <h1>Customers</h1>
            <p>Manage your customers and their information</p>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="filter-btn">⚙️</button>
            <div className="user-profile">
              <div className="avatar">ID</div>
              <span className="user-name">Isabella Donovan</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">1,234</div>
            <div className="stat-change positive">↑ 12% from last month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Customers</div>
            <div className="stat-value">987</div>
            <div className="stat-change positive">↑ 8% from last month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">$42,500</div>
            <div className="stat-change positive">↑ 15% from last month</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === customers.length && customers.length > 0}
                    onChange={handleSelectAll}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className={`${selectedRows.includes(customer.id) ? 'selected' : ''} ${selectedCustomer?.id === customer.id ? 'highlighted' : ''}`}
                  onClick={() => handleCustomerClick(customer)}
                >
                  <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(customer.id)}
                      onChange={() => handleSelectRow(customer.id)}
                      className="row-checkbox"
                    />
                  </td>
                  <td className="name-cell">
                    <div className="customer-avatar">{customer.name.charAt(0)}</div>
                    <span>{customer.name}</span>
                  </td>
                  <td>{customer.email}</td>
                  <td>
                    <span className={`status-badge ${customer.status.toLowerCase()}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="amount-cell">${customer.amount}</td>
                  <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn">⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bulk Actions Bar */}
          {selectedRows.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">{selectedRows.length} selected</span>
              <button className="action-button delete-btn">Delete</button>
              <button className="action-button export-btn">Export</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="pagination-btn">← Previous</button>
          <div className="page-numbers">
            <button className="page-number active">1</button>
            <button className="page-number">2</button>
            <button className="page-number">3</button>
            <span className="pagination-dots">...</span>
            <button className="page-number">10</button>
          </div>
          <button className="pagination-btn">Next →</button>
        </div>
      </div>

      {/* Customer Details Panel */}
      {selectedCustomer && (
        <div className="customer-details-panel">
          <div className="panel-header">
            <h2>Customer Details</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedCustomer(null)}
            >
              ✕
            </button>
          </div>

          <div className="panel-content">
            {/* Avatar and Name */}
            <div className="customer-profile">
              <div className="large-avatar">{selectedCustomer.name.charAt(0)}</div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`status-badge ${selectedCustomer.status.toLowerCase()}`}>
                {selectedCustomer.status}
              </span>
            </div>

            {/* Details */}
            <div className="details-group">
              <div className="detail-item">
                <label>Email</label>
                <p>{selectedCustomer.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p>{selectedCustomer.phone}</p>
              </div>
              <div className="detail-item">
                <label>Company</label>
                <p>{selectedCustomer.company}</p>
              </div>
              <div className="detail-item">
                <label>Join Date</label>
                <p>{selectedCustomer.joinDate}</p>
              </div>
              <div className="detail-item">
                <label>Total Amount</label>
                <p className="amount">${selectedCustomer.amount}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="panel-actions">
              <button className="btn-primary">Edit</button>
              <button className="btn-secondary">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersTable;
