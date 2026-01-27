import { useState } from 'react';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([
    { id: 1, title: 'Suspicious Activity on Account', type: 'Fraud', severity: 'High', status: 'Open', reportedBy: 'John Anderson', reportDate: '2024-01-18', description: 'Unauthorized login attempts detected' },
    { id: 2, title: 'Inappropriate Content', type: 'Content', severity: 'Medium', status: 'In Review', reportedBy: 'Monica Sullivan', reportDate: '2024-01-17', description: 'User posted prohibited content' },
    { id: 3, title: 'Payment Issue', type: 'Payment', severity: 'High', status: 'Resolved', reportedBy: 'Alfredo Santiago', reportDate: '2024-01-16', description: 'Failed transaction and incorrect billing' },
    { id: 4, title: 'Poor Customer Service', type: 'Support', severity: 'Low', status: 'Open', reportedBy: 'Alfren Santagian', reportDate: '2024-01-15', description: 'Support agent was unhelpful' },
    { id: 5, title: 'Technical Bug', type: 'Bug', severity: 'Medium', status: 'In Review', reportedBy: 'Christopher Davis', reportDate: '2024-01-14', description: 'Application crashes on certain pages' },
    { id: 6, title: 'Account Compromise', type: 'Security', severity: 'Critical', status: 'Open', reportedBy: 'Christine Pierce', reportDate: '2024-01-13', description: 'Potential account takeover attempt' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(reports.map(r => r.id));
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

  const handleReportClick = (report) => {
    setSelectedReport(report);
  };

  const getReportTypeColor = (type) => {
    const colors = {
      'Fraud': '#A62C21',
      'Content': '#F27830',
      'Payment': '#F2A444',
      'Support': '#BE9086',
      'Bug': '#401511',
      'Security': '#A62C21'
    };
    return colors[type] || '#401511';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'Critical': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢'
    };
    return icons[severity] || '⚪';
  };

  let filteredReports = reports.filter(report =>
    (report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
     report.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || report.type === filterType)
  );

  const reportStats = {
    total: reports.length,
    open: reports.filter(r => r.status === 'Open').length,
    inReview: reports.filter(r => r.status === 'In Review').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    critical: reports.filter(r => r.severity === 'Critical').length
  };

  return (
    <div className="reports-page">
      <div className="reports-container">
        {/* Header Section */}
        <div className="reports-header">
          <div className="header-left">
            <h1>Reports & Signalements</h1>
            <p>Track and manage all reported issues</p>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="filter-btn">⚙️</button>
            <div className="user-profile">
              <div className="avatar">RP</div>
              <span className="user-name">Report Manager</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">{reportStats.total}</div>
            <div className="stat-change positive">↑ 5 this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Reports</div>
            <div className="stat-value">{reportStats.open}</div>
            <div className="stat-change negative">⚠️ Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical Issues</div>
            <div className="stat-value">{reportStats.critical}</div>
            <div className="stat-change critical">🔴 Urgent</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{reportStats.resolved}</div>
            <div className="stat-change positive">✓ Completed</div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <label className="filter-label">Filter by Type:</label>
          <div className="filter-buttons">
            {['all', 'Fraud', 'Content', 'Payment', 'Support', 'Bug', 'Security'].map(type => (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
                    onChange={handleSelectAll}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  className={`${selectedRows.includes(report.id) ? 'selected' : ''} ${selectedReport?.id === report.id ? 'highlighted' : ''}`}
                  onClick={() => handleReportClick(report)}
                >
                  <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(report.id)}
                      onChange={() => handleSelectRow(report.id)}
                      className="row-checkbox"
                    />
                  </td>
                  <td className="title-cell">{report.title}</td>
                  <td>
                    <span 
                      className="type-badge"
                      style={{ backgroundColor: getReportTypeColor(report.type) }}
                    >
                      {report.type}
                    </span>
                  </td>
                  <td>
                    <span className="severity-cell">
                      {getSeverityIcon(report.severity)} {report.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${report.status.toLowerCase().replace(' ', '-')}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{report.reportedBy}</td>
                  <td className="date-cell">{report.reportDate}</td>
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
              <button className="action-button resolve-btn">Mark as Resolved</button>
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
            <button className="page-number">5</button>
          </div>
          <button className="pagination-btn">Next →</button>
        </div>
      </div>

      {/* Report Details Panel */}
      {selectedReport && (
        <div className="report-details-panel">
          <div className="panel-header">
            <h2>Report Details</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedReport(null)}
            >
              ✕
            </button>
          </div>

          <div className="panel-content">
            {/* Title and Type */}
            <div className="report-profile">
              <div className="title-icon" style={{ backgroundColor: getReportTypeColor(selectedReport.type) }}>
                {selectedReport.type.charAt(0)}
              </div>
              <h3>{selectedReport.title}</h3>
              <span className={`status-badge ${selectedReport.status.toLowerCase().replace(' ', '-')}`}>
                {selectedReport.status}
              </span>
            </div>

            {/* Details */}
            <div className="details-group">
              <div className="detail-item">
                <label>Type</label>
                <p style={{ color: getReportTypeColor(selectedReport.type) }}>
                  {selectedReport.type}
                </p>
              </div>
              <div className="detail-item">
                <label>Severity</label>
                <p>
                  {getSeverityIcon(selectedReport.severity)} {selectedReport.severity}
                </p>
              </div>
              <div className="detail-item">
                <label>Reported By</label>
                <p>{selectedReport.reportedBy}</p>
              </div>
              <div className="detail-item">
                <label>Report Date</label>
                <p>{selectedReport.reportDate}</p>
              </div>
              <div className="detail-item">
                <label>Description</label>
                <p className="description">{selectedReport.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="panel-actions">
              <button className="btn-primary">Review</button>
              <button className="btn-secondary">Close Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
