import { useState, useEffect } from 'react';
import './RepairPricing.css';

// Determine API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return `http://${window.location.hostname}:3000`;
};

const API_URL = getApiUrl();

const REPAIR_LEVELS = {
  1: { name: 'Très mineur', description: 'Retouches cosmétiques mineures' },
  2: { name: 'Mineur', description: 'Petites réparations superficielles' },
  3: { name: 'Léger', description: 'Réparations légères' },
  4: { name: 'Modéré-Léger', description: 'Travaux modérés légers' },
  5: { name: 'Modéré', description: 'Réparations moyennes' },
  6: { name: 'Modéré-Important', description: 'Travaux moyennement importants' },
  7: { name: 'Important', description: 'Réparations importantes' },
  8: { name: 'Très important', description: 'Travaux très importants' },
  9: { name: 'Majeur', description: 'Rénovation majeure' },
  10: { name: 'Reconstruction', description: 'Reconstruction complète' }
};

const RepairPricing = () => {
  const [pricePerM2, setPricePerM2] = useState(50);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Calculateur
  const [calculatorLevel, setCalculatorLevel] = useState(5);
  const [calculatorSurface, setCalculatorSurface] = useState(100);
  const [calculatedBudget, setCalculatedBudget] = useState(null);

  // Interventions
  const [interventions, setInterventions] = useState([]);
  const [showNewIntervention, setShowNewIntervention] = useState(false);
  const [newIntervention, setNewIntervention] = useState({
    title: '',
    description: '',
    repair_level: 5,
    surface_m2: 100,
    location: ''
  });

  // Charger le prix au m2
  useEffect(() => {
    fetchPricePerM2();
    fetchInterventions();
  }, []);

  const fetchPricePerM2 = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pricing/price-per-m2`);
      if (response.ok) {
        const data = await response.json();
        setPricePerM2(parseFloat(data.price_per_m2));
        setLastUpdated(data.updated_at);
      }
    } catch (error) {
      console.error('Erreur chargement prix:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterventions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/interventions`);
      if (response.ok) {
        const data = await response.json();
        setInterventions(data);
      }
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
    }
  };

  const updatePricePerM2 = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/pricing/price-per-m2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_m2: pricePerM2 })
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdated(new Date().toISOString());
        setMessage({ type: 'success', text: 'Prix mis à jour avec succès!' });
      } else {
        throw new Error('Erreur mise à jour');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du prix' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBudget = () => {
    const budget = pricePerM2 * calculatorLevel * calculatorSurface;
    setCalculatedBudget(budget);
  };

  const createIntervention = async () => {
    try {
      const response = await fetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntervention)
      });

      if (response.ok) {
        setShowNewIntervention(false);
        setNewIntervention({
          title: '',
          description: '',
          repair_level: 5,
          surface_m2: 100,
          location: ''
        });
        fetchInterventions();
        setMessage({ type: 'success', text: 'Intervention créée!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur création intervention' });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="repair-pricing loading">Chargement...</div>;
  }

  return (
    <div className="repair-pricing">
      <h1>Configuration des réparations - Manager</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Section Prix au m² */}
      <div className="config-section">
        <h2>Prix forfaitaire au m²</h2>
        <div className="price-config">
          <div className="price-input-group">
            <input
              type="number"
              value={pricePerM2}
              onChange={(e) => setPricePerM2(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
            <span className="currency">€/m²</span>
          </div>
          <button 
            className="btn-save" 
            onClick={updatePricePerM2}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
        {lastUpdated && (
          <p className="last-update">Dernière mise à jour: {formatDate(lastUpdated)}</p>
        )}
      </div>

      {/* Section Niveaux de réparation */}
      <div className="config-section">
        <h2>Niveaux de réparation (1-10)</h2>
        <table className="levels-table">
          <thead>
            <tr>
              <th>Niveau</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Multiplicateur</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(REPAIR_LEVELS).map(([level, info]) => (
              <tr key={level}>
                <td className="level-number">{level}</td>
                <td>{info.name}</td>
                <td>{info.description}</td>
                <td>×{level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculateur de budget */}
      <div className="config-section calculator">
        <h2>Calculateur de budget</h2>
        <p className="formula-info">
          Formule: <strong>Prix/m² × Niveau × Surface = Budget</strong>
        </p>
        <div className="calculator-form">
          <div className="form-group">
            <label>Niveau de réparation</label>
            <select 
              value={calculatorLevel} 
              onChange={(e) => setCalculatorLevel(parseInt(e.target.value))}
            >
              {Object.entries(REPAIR_LEVELS).map(([level, info]) => (
                <option key={level} value={level}>
                  {level} - {info.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Surface (m²)</label>
            <input
              type="number"
              value={calculatorSurface}
              onChange={(e) => setCalculatorSurface(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
            />
          </div>
          <button className="btn-calculate" onClick={calculateBudget}>
            Calculer
          </button>
        </div>

        {calculatedBudget !== null && (
          <div className="result">
            <div className="formula">
              {pricePerM2}€ × {calculatorLevel} × {calculatorSurface}m²
            </div>
            <div className="total">
              Budget estimé: <strong>{formatCurrency(calculatedBudget)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Liste des interventions */}
      <div className="config-section">
        <div className="section-header">
          <h2>Interventions</h2>
          <button 
            className="btn-new" 
            onClick={() => setShowNewIntervention(!showNewIntervention)}
          >
            {showNewIntervention ? 'Annuler' : '+ Nouvelle intervention'}
          </button>
        </div>

        {showNewIntervention && (
          <div className="new-intervention-form">
            <div className="form-row">
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={newIntervention.title}
                  onChange={(e) => setNewIntervention({...newIntervention, title: e.target.value})}
                  placeholder="Titre de l'intervention"
                />
              </div>
              <div className="form-group">
                <label>Localisation</label>
                <input
                  type="text"
                  value={newIntervention.location}
                  onChange={(e) => setNewIntervention({...newIntervention, location: e.target.value})}
                  placeholder="Adresse ou zone"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Niveau de réparation</label>
                <select
                  value={newIntervention.repair_level}
                  onChange={(e) => setNewIntervention({...newIntervention, repair_level: parseInt(e.target.value)})}
                >
                  {Object.entries(REPAIR_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>
                      {level} - {info.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Surface (m²)</label>
                <input
                  type="number"
                  value={newIntervention.surface_m2}
                  onChange={(e) => setNewIntervention({...newIntervention, surface_m2: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={newIntervention.description}
                onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                placeholder="Description des travaux..."
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button className="btn-create" onClick={createIntervention}>
                Créer l'intervention
              </button>
            </div>
          </div>
        )}

        <table className="interventions-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Niveau</th>
              <th>Surface</th>
              <th>Budget</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {interventions.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">Aucune intervention</td>
              </tr>
            ) : (
              interventions.map((intervention) => (
                <tr key={intervention.id}>
                  <td>{intervention.title}</td>
                  <td>
                    <span className="level-badge">
                      {intervention.repair_level} - {REPAIR_LEVELS[intervention.repair_level]?.name || '-'}
                    </span>
                  </td>
                  <td>{intervention.surface_m2 ? `${intervention.surface_m2} m²` : '-'}</td>
                  <td className="budget">{intervention.calculated_budget ? formatCurrency(intervention.calculated_budget) : '-'}</td>
                  <td>
                    <span className={`status-badge status-${intervention.status}`}>
                      {intervention.status || 'pending'}
                    </span>
                  </td>
                  <td>{formatDate(intervention.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepairPricing;
