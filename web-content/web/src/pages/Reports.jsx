import { useState, useEffect } from 'react';
import './Reports.css';
import InterventionForm from '../components/InterventionForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionReport, setInterventionReport] = useState(null);
  const pageSize = 10;

  // Fetch signalements from API
  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/signalements`);
        const data = await response.json();
        
        if (data.success && data.signalements) {
          // Transform API data to match table format
          const formattedReports = data.signalements.map((sig) => ({
            id: sig.id,
            title: sig.descriptiotn || sig.description || 'Sans titre',
            type: sig.status || 'nouveau',
            severity: sig.severity || 'Medium',
            status: sig.status || 'nouveau',
            reportedBy: sig.user_id || 'Anonymous',
            reportDate: sig.date ? new Date(sig.date).toLocaleDateString('fr-FR') : 'N/A',
            description: sig.descriptiotn || sig.description || ''
          }));
          setReports(formattedReports);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des signalements:', err);
        setError('Impossible de charger les signalements');
        // Fallback to test data if API fails
        setReports([
          { id: 1, title: 'Activité suspecte sur un compte', type: 'Fraud', severity: 'High', status: 'Open', reportedBy: 'John Anderson', reportDate: '18/01/2024', description: 'Tentatives de connexion non autorisées détectées' },
          { id: 2, title: 'Contenu inapproprié', type: 'Content', severity: 'Medium', status: 'In Review', reportedBy: 'Monica Sullivan', reportDate: '17/01/2024', description: 'L\'utilisateur a publié du contenu interdit' },
          { id: 3, title: 'Problème de paiement', type: 'Payment', severity: 'High', status: 'Resolved', reportedBy: 'Alfredo Santiago', reportDate: '16/01/2024', description: 'Transaction échouée et facturation incorrecte' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSignalements();
  }, []);

  const handleSelectAll = (e, pageReports) => {
    if (e.target.checked) {
      setSelectedRows(prev => Array.from(new Set([...prev, ...pageReports.map(r => r.id)])));
    } else {
      setSelectedRows(prev => prev.filter(id => !pageReports.some(report => report.id === id)));
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

  const handleViewPhotos = async () => {
    if (!selectedReport?.id) {
      return;
    }

    setPhotosLoading(true);
    setPhotosError(null);
    setPhotosOpen(true);

    try {
      const response = await fetch(`${API_URL}/api/signalements/${selectedReport.id}/photos`);
      if (!response.ok) {
        throw new Error('Impossible de charger les photos');
      }
      const data = await response.json();
      const photoNames = Array.isArray(data.photos) ? data.photos : [];
      const photoItems = photoNames.map((name) => ({
        name,
        url: `${API_URL}/uploads/signalements/${selectedReport.id}/${name}`
      }));
      setPhotos(photoItems);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
      setPhotos([]);
      setPhotosError('Aucune photo disponible');
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleViewPhotosForReport = async (report) => {
    if (!report?.id) return;

    setPhotosLoading(true);
    setPhotosError(null);
    setPhotosOpen(true);

    try {
      const response = await fetch(`${API_URL}/api/signalements/${report.id}/photos`);
      if (!response.ok) {
        throw new Error('Impossible de charger les photos');
      }
      const data = await response.json();
      const photoNames = Array.isArray(data.photos) ? data.photos : [];
      const photoItems = photoNames.map((name) => ({
        name,
        url: `${API_URL}/uploads/signalements/${report.id}/${name}`
      }));
      setPhotos(photoItems);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
      setPhotos([]);
      setPhotosError('Aucune photo disponible');
    } finally {
      setPhotosLoading(false);
    }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, reports.length]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

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
            <h1>Signalements</h1>
            <p>Gérez et suivez tous les signalements (Firestore)</p>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher un signalement..."
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
            {['all', 'Nouveau', 'En cours', 'Termine'].map(type => (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'Tous' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des signalements depuis Firestore...</p>
            </div>
          ) : (
            <table className="reports-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={paginatedReports.length > 0 && paginatedReports.every(report => selectedRows.includes(report.id))}
                    onChange={(e) => handleSelectAll(e, paginatedReports)}
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
              {paginatedReports.map((report) => (
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
                    <div className="action-buttons-group">
                      <button 
                        className="action-btn-icon" 
                        title="Voir les photos"
                        onClick={() => {
                          setSelectedReport(report);
                          handleViewPhotosForReport(report);
                        }}
                      >
                        📷
                      </button>
                      <button 
                        className="action-btn-icon intervention" 
                        title="Créer une intervention"
                        onClick={() => {
                          setInterventionReport(report);
                          setShowInterventionForm(true);
                        }}
                      >
                        🔧
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

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
              <button className="btn-secondary" onClick={handleViewPhotos}>Voir les photos</button>
              <button 
                className="btn-create-intervention"
                onClick={() => {
                  setInterventionReport(selectedReport);
                  setShowInterventionForm(true);
                }}
              >
                🔧 Créer une intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {photosOpen && (
        <div className="photo-modal-overlay" onClick={() => setPhotosOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="photo-modal-header">
              <h3>Photos du signalement</h3>
              <button className="close-btn" onClick={() => setPhotosOpen(false)}>✕</button>
            </div>
            <div className="photo-modal-content">
              {photosLoading && <p>Chargement...</p>}
              {!photosLoading && photosError && <p>{photosError}</p>}
              {!photosLoading && !photosError && photos.length === 0 && <p>Aucune photo disponible</p>}
              {!photosLoading && !photosError && photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((photo) => (
                    <div className="photo-item" key={photo.url}>
                      <img src={photo.url} alt={photo.name || 'photo'} />
                      <div className="photo-meta">
                        <span>{photo.name || 'photo'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Intervention Form Modal */}
      {showInterventionForm && (
        <InterventionForm
          signalement={interventionReport}
          onClose={() => {
            setShowInterventionForm(false);
            setInterventionReport(null);
          }}
          onCreated={() => {
            setShowInterventionForm(false);
            setInterventionReport(null);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
};

export default Reports;
