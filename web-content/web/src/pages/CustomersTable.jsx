import { useState, useEffect } from 'react';
import { blockUser, unblockUser } from '../services/authService';
import './CustomersTable.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CustomersTable = ({ userData }) => {
  const isManager = userData?.userType === 'manager';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/users`);
        const data = await response.json();
        
        if (data.success && data.users) {
          const formattedUsers = data.users.map((user, index) => ({
            id: index + 1,
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            status: user.disabled ? 'Bloqué' : 'Actif',
            provider: user.provider,
            joinDate: user.creationTime ? new Date(user.creationTime).toLocaleDateString('fr-FR') : 'N/A',
            lastLogin: user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString('fr-FR') : 'Jamais'
          }));
          setCustomers(formattedUsers);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setError('Impossible de charger les utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSelectAll = (e, pageCustomers) => {
    if (e.target.checked) {
      setSelectedRows(prev => Array.from(new Set([...prev, ...pageCustomers.map(c => c.id)])));
    } else {
      setSelectedRows(prev => prev.filter(id => !pageCustomers.some(customer => customer.id === id)));
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

  const refreshUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      
      if (data.success && data.users) {
        const formattedUsers = data.users.map((user, index) => ({
          id: index + 1,
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          status: user.disabled ? 'Bloqué' : 'Actif',
          provider: user.provider,
          joinDate: user.creationTime ? new Date(user.creationTime).toLocaleDateString('fr-FR') : 'N/A',
          lastLogin: user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString('fr-FR') : 'Jamais'
        }));
        setCustomers(formattedUsers);
        
        if (selectedCustomer) {
          const updated = formattedUsers.find(c => c.email === selectedCustomer.email);
          if (updated) setSelectedCustomer(updated);
        }
      }
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (email) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const result = await blockUser(email);
      if (result.success) {
        setActionMessage({ type: 'success', text: `✅ Utilisateur ${email} bloqué avec succès` });
        await refreshUsers();
      } else {
        setActionMessage({ type: 'error', text: `❌ Erreur: ${result.error}` });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `❌ Erreur: ${err.message}` });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleUnblockUser = async (email) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const result = await unblockUser(email);
      if (result.success) {
        setActionMessage({ type: 'success', text: `✅ Utilisateur ${email} débloqué avec succès` });
        await refreshUsers();
      } else {
        setActionMessage({ type: 'error', text: `❌ Erreur: ${result.error}` });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `❌ Erreur: ${err.message}` });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, customers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="customers-page">
      <div className="customers-container">
        {/* Action Message */}
        {actionMessage && (
          <div className={`action-message ${actionMessage.type}`}>
            {actionMessage.text}
          </div>
        )}

        {/* Header Section */}
        <div className="customers-header">
          <div className="header-left">
            <h1>Utilisateurs</h1>
            <p>Gérez les utilisateurs et leurs informations</p>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="filter-btn" onClick={() => window.location.reload()}>🔄</button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-label">Total Utilisateurs</div>
            <div className="stat-value">{customers.length}</div>
            <div className="stat-change positive">Firebase + PostgreSQL</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Utilisateurs Actifs</div>
            <div className="stat-value">{customers.filter(c => c.status === 'Actif').length}</div>
            <div className="stat-change positive">En ligne</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Utilisateurs Bloqués</div>
            <div className="stat-value">{customers.filter(c => c.status === 'Bloqué').length}</div>
            <div className="stat-change">{customers.filter(c => c.status === 'Bloqué').length > 0 ? 'À vérifier' : 'Aucun'}</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : (
            <table className="customers-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={paginatedCustomers.length > 0 && paginatedCustomers.every(customer => selectedRows.includes(customer.id))}
                    onChange={(e) => handleSelectAll(e, paginatedCustomers)}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Nom</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Provider</th>
                <th>Inscription</th>
                <th>Dernière connexion</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
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
                    <div className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                    <span>{customer.name}</span>
                  </td>
                  <td>{customer.email}</td>
                  <td>
                    <span className={`status-badge ${customer.status === 'Actif' ? 'active' : 'inactive'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <span className={`provider-badge ${customer.provider}`}>
                      {customer.provider === 'firebase' ? '🔥 Firebase' : '🐘 PostgreSQL'}
                    </span>
                  </td>
                  <td>{customer.joinDate}</td>
                  <td>{customer.lastLogin}</td>
                  <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn">⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedRows.length > 0 && (
          <div className="bulk-actions">
              <span className="selected-count">{selectedRows.length} selected</span>
              <button className="action-button delete-btn">Delete</button>
              <button className="action-button export-btn">Export</button>
            </div>
          )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              ← Previous
            </button>
            <div className="page-numbers">
              {pageNumbers.map(page => (
                <button
                  key={page}
                  className={`page-number ${safePage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Customer Details Panel */}
      {selectedCustomer && (
        <div className="customer-details-panel">
          <div className="panel-header">
            <h2>Détails Utilisateur</h2>
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
              <div className="large-avatar">{selectedCustomer.name.charAt(0).toUpperCase()}</div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`status-badge ${selectedCustomer.status === 'Actif' ? 'active' : 'inactive'}`}>
                {selectedCustomer.status}
              </span>
            </div>

            {/* Details */}
            <div className="details-group">
              <div className="detail-item">
                <label>📧 Email</label>
                <p>{selectedCustomer.email}</p>
              </div>
              <div className="detail-item">
                <label>🆔 UID</label>
                <p className="uid-text">{selectedCustomer.uid}</p>
              </div>
              <div className="detail-item">
                <label>🔐 Provider</label>
                <p>
                  <span className={`provider-badge ${selectedCustomer.provider}`}>
                    {selectedCustomer.provider === 'firebase' ? '🔥 Firebase' : '🐘 PostgreSQL'}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>📅 Date d'inscription</label>
                <p>{selectedCustomer.joinDate}</p>
              </div>
              <div className="detail-item">
                <label>🕐 Dernière connexion</label>
                <p>{selectedCustomer.lastLogin}</p>
              </div>
            </div>

            {/* Action Buttons - Manager only */}
            {isManager ? (
              <div className="panel-actions">
                {selectedCustomer.status === 'Bloqué' ? (
                  <button 
                    className="btn-primary btn-unblock"
                    onClick={() => handleUnblockUser(selectedCustomer.email)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Déblocage...' : '🔓 Débloquer'}
                  </button>
                ) : (
                  <button 
                    className="btn-secondary btn-danger"
                    onClick={() => handleBlockUser(selectedCustomer.email)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Blocage...' : '🔒 Bloquer'}
                  </button>
                )}
              </div>
            ) : (
              <div className="panel-actions">
                <p className="no-permission">🔒 Seuls les managers peuvent bloquer/débloquer les utilisateurs</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersTable;
