import { useState, useEffect, useMemo } from 'react';
import './Statistics.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Calcul de l'avancement selon le statut
const getProgressPercentage = (status) => {
  const statusLower = String(status || '').toLowerCase().trim();
  
  if (['nouveau', 'new', 'en_attente', 'pending', 'created'].includes(statusLower)) {
    return 0;
  }
  if (['en_cours', 'in_progress', 'ongoing', 'started', 'working', 'planifie'].includes(statusLower)) {
    return 50;
  }
  if (['termine', 'terminé', 'done', 'completed', 'resolved', 'closed', 'finished'].includes(statusLower)) {
    return 100;
  }
  
  return 0;
};

const getStatusLabel = (status) => {
  const statusLower = String(status || '').toLowerCase().trim();
  
  if (['nouveau', 'new', 'en_attente', 'pending', 'created'].includes(statusLower)) {
    return 'Nouveau (0%)';
  }
  if (['en_cours', 'in_progress', 'ongoing', 'started', 'working', 'planifie'].includes(statusLower)) {
    return 'En cours (50%)';
  }
  if (['termine', 'terminé', 'done', 'completed', 'resolved', 'closed', 'finished'].includes(statusLower)) {
    return 'Terminé (100%)';
  }
  
  return status || 'Inconnu';
};

const Statistics = ({ userData }) => {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isManager = userData?.userType === 'manager';

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/signalements`);
        const data = await response.json();
        
        if (data.success && data.signalements) {
          setSignalements(data.signalements);
        } else {
          setSignalements([]);
        }
      } catch (err) {
        console.error('Erreur chargement signalements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSignalements();
  }, []);

  // Calculs statistiques
  const statistics = useMemo(() => {
    if (signalements.length === 0) {
      return {
        total: 0,
        nouveau: { count: 0, percentage: 0 },
        enCours: { count: 0, percentage: 0 },
        termine: { count: 0, percentage: 0 },
        averageProgress: 0,
        averageProcessingDays: 0,
        byEntreprise: [],
        processingTimes: []
      };
    }

    let nouveauCount = 0;
    let enCoursCount = 0;
    let termineCount = 0;
    let totalProgress = 0;
    const entrepriseMap = new Map();
    const processingTimes = [];

    signalements.forEach(s => {
      const progress = getProgressPercentage(s.status);
      totalProgress += progress;

      if (progress === 0) nouveauCount++;
      else if (progress === 50) enCoursCount++;
      else if (progress === 100) termineCount++;

      const entreprise = s.entreprise || 'Non assigné';
      if (!entrepriseMap.has(entreprise)) {
        entrepriseMap.set(entreprise, { count: 0, totalProgress: 0, budget: 0 });
      }
      const entData = entrepriseMap.get(entreprise);
      entData.count++;
      entData.totalProgress += progress;
      entData.budget += Number(s.budget) || 0;

      if (progress === 100 && s.date && s.date_fin) {
        const startDate = new Date(s.date);
        const endDate = new Date(s.date_fin);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (days > 0 && days < 365) {
          processingTimes.push({
            id: s.id,
            description: s.description,
            days,
            entreprise
          });
        }
      }
    });

    const total = signalements.length;
    const averageProcessingDays = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((sum, t) => sum + t.days, 0) / processingTimes.length)
      : 0;

    const byEntreprise = Array.from(entrepriseMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageProgress: Math.round(data.totalProgress / data.count),
        budget: data.budget
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      nouveau: { count: nouveauCount, percentage: Math.round((nouveauCount / total) * 100) },
      enCours: { count: enCoursCount, percentage: Math.round((enCoursCount / total) * 100) },
      termine: { count: termineCount, percentage: Math.round((termineCount / total) * 100) },
      averageProgress: Math.round(totalProgress / total),
      averageProcessingDays,
      byEntreprise,
      processingTimes: processingTimes.slice(0, 10)
    };
  }, [signalements]);

  // Tableau détaillé
  const detailedSignalements = useMemo(() => {
    return signalements.map(s => ({
      id: s.id,
      description: s.description || 'Sans description',
      status: getStatusLabel(s.status),
      progress: getProgressPercentage(s.status),
      entreprise: s.entreprise || 'Non assigné',
      budget: Number(s.budget) || 0,
      surface: Number(s.surface) || 0,
      dateCreation: s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '-',
      dateDebut: s.date_debut ? new Date(s.date_debut).toLocaleDateString('fr-FR') : '-',
      dateFin: s.date_fin ? new Date(s.date_fin).toLocaleDateString('fr-FR') : '-'
    }));
  }, [signalements]);

  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    maximumFractionDigits: 0
  }).format(value || 0);

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="error-state">
          <span>❌</span>
          <p>Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <h1>📊 Statistiques des Travaux Routiers</h1>
        <p>Vue d'ensemble de l'avancement des travaux à Antananarivo</p>
      </div>

      {/* KPIs */}
      <div className="stats-kpis">
        <div className="kpi-card progress-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <p className="kpi-label">Avancement Moyen</p>
            <p className="kpi-value">{statistics.averageProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${statistics.averageProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon nouveau">🆕</div>
          <div className="kpi-content">
            <p className="kpi-label">Nouveau (0%)</p>
            <p className="kpi-value">{statistics.nouveau.count}</p>
            <p className="kpi-percentage">{statistics.nouveau.percentage}% du total</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon en-cours">🔧</div>
          <div className="kpi-content">
            <p className="kpi-label">En cours (50%)</p>
            <p className="kpi-value">{statistics.enCours.count}</p>
            <p className="kpi-percentage">{statistics.enCours.percentage}% du total</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon termine">✅</div>
          <div className="kpi-content">
            <p className="kpi-label">Terminé (100%)</p>
            <p className="kpi-value">{statistics.termine.count}</p>
            <p className="kpi-percentage">{statistics.termine.percentage}% du total</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <p className="kpi-label">Traitement Moyen</p>
            <p className="kpi-value">{statistics.averageProcessingDays} jours</p>
            <p className="kpi-percentage">Durée moyenne des travaux</p>
          </div>
        </div>
      </div>

      {/* Graphique de répartition */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Répartition par Statut</h3>
          <div className="status-bars">
            <div className="status-bar-item">
              <div className="status-label">
                <span className="status-dot nouveau"></span>
                <span>Nouveau (0%)</span>
              </div>
              <div className="status-bar-bg">
                <div 
                  className="status-bar-fill nouveau" 
                  style={{ width: `${statistics.nouveau.percentage}%` }}
                ></div>
              </div>
              <span className="status-count">{statistics.nouveau.count}</span>
            </div>
            
            <div className="status-bar-item">
              <div className="status-label">
                <span className="status-dot en-cours"></span>
                <span>En cours (50%)</span>
              </div>
              <div className="status-bar-bg">
                <div 
                  className="status-bar-fill en-cours" 
                  style={{ width: `${statistics.enCours.percentage}%` }}
                ></div>
              </div>
              <span className="status-count">{statistics.enCours.count}</span>
            </div>
            
            <div className="status-bar-item">
              <div className="status-label">
                <span className="status-dot termine"></span>
                <span>Terminé (100%)</span>
              </div>
              <div className="status-bar-bg">
                <div 
                  className="status-bar-fill termine" 
                  style={{ width: `${statistics.termine.percentage}%` }}
                ></div>
              </div>
              <span className="status-count">{statistics.termine.count}</span>
            </div>
          </div>
        </div>

        {/* Par entreprise */}
        <div className="chart-card">
          <h3>Performance par Entreprise</h3>
          <div className="entreprise-table">
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Travaux</th>
                  <th>Avancement</th>
                  <th>Budget Total</th>
                </tr>
              </thead>
              <tbody>
                {statistics.byEntreprise.map((ent, index) => (
                  <tr key={index}>
                    <td>{ent.name}</td>
                    <td>{ent.count}</td>
                    <td>
                      <div className="mini-progress">
                        <div 
                          className="mini-progress-fill"
                          style={{ width: `${ent.averageProgress}%` }}
                        ></div>
                        <span>{ent.averageProgress}%</span>
                      </div>
                    </td>
                    <td>{formatCurrency(ent.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="detailed-section">
        <h2>📋 Tableau Détaillé des Travaux</h2>
        <div className="table-container">
          <table className="detailed-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Avancement</th>
                <th>Entreprise</th>
                <th>Surface (m²)</th>
                <th>Budget</th>
                <th>Date Création</th>
              </tr>
            </thead>
            <tbody>
              {detailedSignalements.map((s) => (
                <tr key={s.id}>
                  <td>{s.id !== undefined && s.id !== null ? String(s.id).slice(0, 8) : '-'}</td>
                  <td className="desc-cell" title={s.description}>
                    {s.description.length > 30 
                      ? s.description.substring(0, 30) + '...' 
                      : s.description}
                  </td>
                  <td>
                    <span className={`status-badge progress-${s.progress}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-progress">
                      <div className="cell-progress-bar">
                        <div 
                          className={`cell-progress-fill progress-${s.progress}`}
                          style={{ width: `${s.progress}%` }}
                        ></div>
                      </div>
                      <span>{s.progress}%</span>
                    </div>
                  </td>
                  <td>{s.entreprise}</td>
                  <td>{s.surface.toLocaleString('fr-FR')}</td>
                  <td>{formatCurrency(s.budget)}</td>
                  <td>{s.dateCreation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temps de traitement (Manager only) */}
      {isManager && statistics.processingTimes.length > 0 && (
        <div className="processing-section">
          <h2>⏱️ Temps de Traitement des Travaux Terminés</h2>
          <div className="processing-table">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Entreprise</th>
                  <th>Durée (jours)</th>
                </tr>
              </thead>
              <tbody>
                {statistics.processingTimes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.description}</td>
                    <td>{t.entreprise}</td>
                    <td>
                      <span className={`duration-badge ${t.days > 30 ? 'long' : t.days > 14 ? 'medium' : 'short'}`}>
                        {t.days} jours
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;