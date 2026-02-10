import { useState, useEffect } from 'react';
import '../styles/InterventionForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

/**
 * Formulaire de création d'intervention
 * Peut être pré-rempli depuis un signalement (carte ou reports)
 * 
 * @param {Object} props
 * @param {Object} props.signalement - Signalement source (optionnel)
 * @param {Function} props.onClose - Callback pour fermer le formulaire
 * @param {Function} props.onCreated - Callback après création réussie
 */
const InterventionForm = ({ signalement, onClose, onCreated }) => {
  const [pricePerM2, setPricePerM2] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repair_level: 5,
    surface_m2: 100,
    location: ''
  });

  // Pré-remplir depuis le signalement si fourni
  useEffect(() => {
    if (signalement) {
      const desc = signalement.descriptiotn || signalement.description || '';
      const surface = signalement.surface || signalement.surface_m2 || '';
      const level = signalement.repair_level || signalement.niveau || 5;
      
      // Construire la localisation depuis les coordonnées
      let location = signalement.location || '';
      if (!location && signalement.lat && signalement.lng) {
        location = `${signalement.lat.toFixed(4)}, ${signalement.lng.toFixed(4)}`;
      }
      if (!location && signalement.position) {
        if (typeof signalement.position === 'object') {
          const lat = signalement.position.latitude || signalement.position.lat;
          const lng = signalement.position.longitude || signalement.position.lng;
          if (lat && lng) location = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
        }
      }

      setFormData({
        title: desc ? `Intervention: ${desc.substring(0, 60)}` : '',
        description: desc,
        repair_level: parseInt(level) || 5,
        surface_m2: parseFloat(surface) || 100,
        location: location,
        signalement_id: signalement.id || null
      });
    }
  }, [signalement]);

  // Charger le prix au m² actuel
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pricing/price-per-m2`);
        if (response.ok) {
          const data = await response.json();
          setPricePerM2(parseFloat(data.price_per_m2));
        }
      } catch (err) {
        console.error('Erreur chargement prix:', err);
      }
    };
    fetchPrice();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['repair_level', 'surface_m2'].includes(name) 
        ? (parseFloat(value) || 0)
        : value
    }));
  };

  const estimatedBudget = pricePerM2 * formData.repair_level * formData.surface_m2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        if (onCreated) onCreated(data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Erreur création intervention:', err);
      setError('Erreur réseau, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intervention-modal-overlay" onClick={onClose}>
      <div className="intervention-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="intervention-modal-header">
          <h2>🔧 Créer une intervention</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Signalement source */}
        {signalement && (
          <div className="source-info">
            <span className="source-badge">📍 Depuis signalement #{signalement.id}</span>
            <span className="source-desc">
              {signalement.descriptiotn || signalement.description || 'Sans description'}
            </span>
          </div>
        )}

        {/* Messages */}
        {error && <div className="intervention-message error">{error}</div>}
        {success && <div className="intervention-message success">✅ Intervention créée avec succès!</div>}

        {/* Formulaire */}
        <form className="intervention-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Informations générales</h3>
            <div className="form-group">
              <label>Titre *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Titre de l'intervention"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description des travaux à réaliser..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Adresse ou coordonnées"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Paramètres de réparation</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Niveau de réparation</label>
                <select
                  name="repair_level"
                  value={formData.repair_level}
                  onChange={handleChange}
                >
                  {Object.entries(REPAIR_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>
                      {level} - {info.name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  {REPAIR_LEVELS[formData.repair_level]?.description}
                </small>
              </div>
              <div className="form-group">
                <label>Surface (m²)</label>
                <input
                  type="number"
                  name="surface_m2"
                  value={formData.surface_m2}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="Surface en m²"
                />
              </div>
            </div>
          </div>

          {/* Estimation budget */}
          <div className="budget-estimate">
            <div className="budget-formula">
              <span className="formula-label">Formule:</span>
              <span className="formula-detail">
                {pricePerM2}€/m² × Niv.{formData.repair_level} × {formData.surface_m2}m²
              </span>
            </div>
            <div className="budget-total">
              <span className="budget-label">Budget estimé:</span>
              <span className="budget-value">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(estimatedBudget)}
              </span>
            </div>
            <small className="budget-note">
              Le prix au m² ({pricePerM2}€) sera figé dans cette intervention
            </small>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-create" disabled={loading}>
              {loading ? '⏳ Création...' : '✅ Créer l\'intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionForm;
