import { useState } from 'react';
import '../styles/SignalementForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SignalementForm = ({ location, onClose, onSubmit }) => {
  // Get user_id from localStorage (from auth data)
  const authData = JSON.parse(localStorage.getItem('authData') || '{}');
  const userId = authData.uid || '';

  const [formData, setFormData] = useState({
    description: '',
    surface: '',
    budget: '',
    entreprise: '',
    position: {
      lat: location?.lat || 0,
      lng: location?.lng || 0
    },
    date: new Date().toISOString(),
    user_id: userId
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'surface' || name === 'budget') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    // Convertir la date en timestamp ISO
    if (value) {
      setFormData(prev => ({
        ...prev,
        date: new Date(value).toISOString()
      }));
    }
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Formater la position comme un GeoPoint Firebase
      const formatPosition = (lat, lng) => {
        return {
          latitude: parseFloat(lat.toFixed(14)),
          longitude: parseFloat(lng.toFixed(14))
        };
      };

      // Préparer les données au format attendu
      const payload = {
        descriptiotn: formData.description,
        surface: formData.surface,
        budget: formData.budget,
        entreprise: formData.entreprise,
        position: formatPosition(formData.position.lat, formData.position.lng),
        date: formData.date,
        user_id: formData.user_id
      };

      console.log('Envoi des données:', payload);

      // Envoyer à l'API
      const response = await fetch(`${API_URL}/api/signalements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const fieldErrors = Object.entries(errorData)
          .filter(([key, value]) => key !== 'error' && value)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        const errorMessage = fieldErrors ? `${errorData.error || 'Erreur lors de la création'} - ${fieldErrors}` : (errorData.error || 'Erreur lors de la création');
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Réponse du serveur:', result);

      const signalementId = result.signalement?.id;
      if (signalementId && photos.length > 0) {
        const formData = new FormData();
        photos.forEach((file) => {
          formData.append('photos', file);
        });

        const uploadResponse = await fetch(`${API_URL}/api/signalements/${signalementId}/photos`, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json().catch(() => ({}));
          throw new Error(uploadError.error || 'Erreur lors de l\'upload des photos');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSubmit) {
          onSubmit(payload);
        }
      }, 2000);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="signalement-modal-overlay" onClick={onClose}>
        <div className="signalement-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Projet créé avec succès</h3>
            <p>Les données ont été enregistrées dans la base de données.</p>
          </div>
        </div>
      </div>
    );
  }

  const dateValue = new Date(formData.date).toISOString().split('T')[0];

  return (
    <div className="signalement-modal-overlay" onClick={onClose}>
      <div className="signalement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un nouveau projet</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="signalement-form">
          {error && <div className="error-message">{error}</div>}

          {/* Position */}
          <div className="form-section">
            <h3>Position (Geopoint)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lat">Latitude (S)</label>
                <input
                  type="number"
                  id="lat"
                  value={formData.position.lat}
                  disabled
                  step="0.0001"
                  className="position-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lng">Longitude (E)</label>
                <input
                  type="number"
                  id="lng"
                  value={formData.position.lng}
                  disabled
                  step="0.0001"
                  className="position-input"
                />
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="form-section">
            <h3>Informations générales</h3>
            
            <div className="form-group">
              <label htmlFor="date">Date du projet (Timestamp)</label>
              <input
                type="date"
                id="date"
                value={dateValue}
                onChange={handleDateChange}
              />
              <small className="form-hint">Format: {new Date(formData.date).toLocaleString('fr-FR', { timeZone: 'Africa/Nairobi' })}</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (String) *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Fuite d'eau sur la route"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="entreprise">Entreprise (String) *</label>
              <input
                type="text"
                id="entreprise"
                name="entreprise"
                value={formData.entreprise}
                onChange={handleChange}
                placeholder="Ex: SARA & Cie"
                required
              />
            </div>
          </div>

          {/* Détails techniques et financiers */}
          <div className="form-section">
            <h3>Détails du projet</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="surface">Surface (Number, m²) *</label>
                <input
                  type="number"
                  id="surface"
                  name="surface"
                  value={formData.surface}
                  onChange={handleChange}
                  placeholder="Ex: 8"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="budget">Budget (Number, MGA) *</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Ex: 65400"
                  min="0"
                  required
                />
              </div>
            </div>

          </div>

          {/* Photos */}
          <div className="form-section">
            <h3>Photos</h3>
            <div className="form-group">
              <label htmlFor="photos">Ajouter des photos</label>
              <input
                type="file"
                id="photos"
                name="photos"
                accept="image/*"
                multiple
                onChange={handlePhotosChange}
              />
              {photos.length > 0 && (
                <small className="form-hint">{photos.length} photo(s) sélectionnée(s)</small>
              )}
            </div>
          </div>

          {/* Aperçu des données */}
          <div className="form-section">
            <h3>Aperçu des données à envoyer</h3>
            <pre className="data-preview">
{JSON.stringify({
  descriptiotn: formData.description || 'vide',
  surface: formData.surface || 'vide',
  budget: formData.budget || 'vide',
  entreprise: formData.entreprise || 'vide',
  position: {
    latitude: parseFloat(formData.position.lat.toFixed(14)),
    longitude: parseFloat(formData.position.lng.toFixed(14))
  },
  date: formData.date,
  user_id: formData.user_id || 'vide',
  photos: photos.length
}, null, 2)}
            </pre>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Création en cours...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignalementForm;
