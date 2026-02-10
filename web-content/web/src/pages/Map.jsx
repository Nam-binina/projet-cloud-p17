import { useState, useEffect, useRef } from 'react';
import './Map.css';
import SignalementForm from '../components/SignalementForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Map = ({ userData }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [showSignalementForm, setShowSignalementForm] = useState(false);
  const [signalements, setSignalements] = useState([]);
  const [mySignalements, setMySignalements] = useState([]);
  const [showMySignalements, setShowMySignalements] = useState(false);
  const [loadingSignalements, setLoadingSignalements] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Load Leaflet CSS and JS only once
    if (!window.L) {
      console.log('Leaflet not found, loading...');
      
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      leafletCSS.onload = () => console.log('Leaflet CSS loaded');
      leafletCSS.onerror = () => console.error('Failed to load Leaflet CSS');
      document.head.appendChild(leafletCSS);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      leafletScript.onload = () => {
        console.log('Leaflet JS loaded successfully');
        // Small delay to ensure Leaflet is fully initialized
        setTimeout(() => {
          initializeMap();
          loadAllSignalements();
        }, 100);
      };
      leafletScript.onerror = () => console.error('Failed to load Leaflet JS');
      document.body.appendChild(leafletScript);
    } else {
      console.log('Leaflet already loaded');
      initializeMap();
      loadAllSignalements();
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        console.log('Cleaning up map');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    const L = window.L;
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) {
      console.log('Map already exists, skipping reinitialization');
      return;
    }

    // Clear the container
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }

    if (!mapRef.current) {
      console.error('Map container not found!');
      return;
    }

    console.log('Initializing map...');
    const map = L.map(mapRef.current).setView([-18.879, 47.508], 13);
    mapInstanceRef.current = map;
    console.log('Map initialized successfully');

    // Determine tile server URL based on environment
    const isBrowser = typeof window !== 'undefined';
    const isLocalDev = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // In local dev (npm run dev): use localhost:8081
    // In Docker/production: use tile-server:80 which gets proxied by nginx
    const tileServerUrl = isLocalDev 
      ? 'http://localhost:8081/tile/{z}/{x}/{y}.png'
      : '/tile-server/tile/{z}/{x}/{y}.png';
    
    console.log('Using tile server URL:', tileServerUrl, '(isLocalDev:', isLocalDev, ')');

    // Try Tile Server first, fall back to CartoDB if CORS issues
    const tileLayer = L.tileLayer(tileServerUrl, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
      minZoom: 0,
      crossOrigin: 'anonymous',
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });

    // Fallback to CartoDB if Tile Server fails
    const fallbackLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 20,
      minZoom: 0,
      subdomains: 'abcd'
    });

    // Try Tile Server, switch to CartoDB on error
    tileLayer.on('tileerror', () => {
      console.warn('Tile Server unavailable, switching to CartoDB');
      tileLayer.remove();
      fallbackLayer.addTo(map);
    });

    tileLayer.addTo(map);

    const locations = [
      // { 
      //   id: 1, 
      //   name: 'Terrain Centre-Ville', 
      //   lat: -18.8792, 
      //   lng: 47.5079, 
      //   company: 'TechBuild Corp',
      //   date: '2025-01-15',
      //   status: 'En cours',
      //   surface: 5240,
      //   budget: 125000
      // },
      // { 
      //   id: 2, 
      //   name: 'Zone Industrielle Nord', 
      //   lat: -18.8650, 
      //   lng: 47.5200, 
      //   company: 'ConstructPro Ltd',
      //   date: '2025-02-10',
      //   status: 'Planifié',
      //   surface: 8500,
      //   budget: 250000
      // },
      // { 
      //   id: 3, 
      //   name: 'Quartier Résidentiel Est', 
      //   lat: -18.8900, 
      //   lng: 47.5350, 
      //   company: 'BuildCare Solutions',
      //   date: '2024-12-20',
      //   status: 'Complété',
      //   surface: 3200,
      //   budget: 85000
      // },
      // { 
      //   id: 4, 
      //   name: 'Centre Commercial Ouest', 
      //   lat: -18.8750, 
      //   lng: 47.4950, 
      //   company: 'Commerce Dev Inc',
      //   date: '2025-03-05',
      //   status: 'En cours',
      //   surface: 12000,
      //   budget: 450000
      // },
      // { 
      //   id: 5, 
      //   name: 'Parc Technologique Sud', 
      //   lat: -18.8950, 
      //   lng: 47.5150, 
      //   company: 'TechPark Builders',
      //   date: '2025-01-22',
      //   status: 'En attente',
      //   surface: 15000,
      //   budget: 620000
      // },
      // { 
      //   id: 6, 
      //   name: 'Zone d\'Expansion Urbaine', 
      //   lat: -18.8650, 
      //   lng: 47.4850, 
      //   company: 'Urban Development Co',
      //   date: '2025-04-01',
      //   status: 'Planifié',
      //   surface: 20000,
      //   budget: 800000
      // },
    ];

    // Add markers
    console.log('Adding markers:', locations.length);
    locations.forEach((location, index) => {
      const statusColors = {
        'En cours': '#F2A444',
        'Planifié': '#401511',
        'Complété': '#4CAF50',
        'En attente': '#FF9800'
      };

      try {
        const marker = L.marker([location.lat, location.lng], {
          title: location.name
        }).addTo(map);
        console.log(`Marker ${index + 1} added:`, location.name, `[${location.lat}, ${location.lng}]`);
        
        marker.bindPopup(`
          <div class="map-popup">
            <h4>${location.name}</h4>
            <div class="popup-grid">
              <div class="popup-item">
                <span class="popup-label">Date:</span>
                <span class="popup-value">${new Date(location.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Statut:</span>
                <span class="popup-value" style="color: ${statusColors[location.status]}">${location.status}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Surface:</span>
                <span class="popup-value">${location.surface.toLocaleString()} m²</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Budget:</span>
                <span class="popup-value">${location.budget.toLocaleString()} MGA</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Entreprise:</span>
                <span class="popup-value">${location.company}</span>
              </div>
            </div>
          </div>
        `);
        
        marker.on('click', () => {
          console.log('Marker clicked:', location.name);
          setSelectedLocation(location);
        });
      } catch (error) {
        console.error(`Error adding marker ${index + 1}:`, error);
      }
    });
    console.log('All markers added successfully');

    // Custom map controls
    const controlContainer = L.DomUtil.create('div', 'map-controls');
    const zoomIn = L.DomUtil.create('button', 'map-control-btn', controlContainer);
    zoomIn.textContent = '+';
    zoomIn.onclick = () => map.zoomIn();

    const zoomOut = L.DomUtil.create('button', 'map-control-btn', controlContainer);
    zoomOut.textContent = '−';
    zoomOut.onclick = () => map.zoomOut();

    const resetBtn = L.DomUtil.create('button', 'map-control-btn reset', controlContainer);
    resetBtn.textContent = '🔄';
    resetBtn.onclick = () => map.setView([20, 0], 2);

    map.getContainer().appendChild(controlContainer);

    // Ajouter un événement clic sur la carte pour capturer les clics en dehors des marqueurs
    map.on('click', (e) => {
      // Fermer le panel de détails et afficher le panel d'action rapide
      setSelectedLocation(null);
      setSelectedSignalement(null);
      setClickedLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        name: `Localisation (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
      });
    });
  };

  // Charger tous les signalements
  const loadAllSignalements = async () => {
    try {
      setLoadingSignalements(true);
      const response = await fetch(`${API_URL}/api/signalements`);
      const data = await response.json();

      if (data.success && data.signalements) {
        setSignalements(data.signalements);
        displaySignalements(data.signalements);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
    } finally {
      setLoadingSignalements(false);
    }
  };

  // Charger les signalements de l'utilisateur
  const loadMySignalements = async () => {
    try {
      setLoadingSignalements(true);
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const userId = authData.uid;

      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const response = await fetch(`${API_URL}/api/signalements/user/${userId}`);
      const data = await response.json();

      if (data.success && data.signalements) {
        setMySignalements(data.signalements);
        setShowMySignalements(true);
        displaySignalements(data.signalements);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
    } finally {
      setLoadingSignalements(false);
    }
  };

  // Afficher les signalements sur la carte
  // Fonction pour parser la position - supporte 4 formats: GeoPoint {latitude, longitude}, array [lat, lng], string avec degrés, et objet {lat, lng}
  const parsePosition = (position) => {
    if (!position) {
      return null;
    }
    
    // Format GeoPoint Firebase {latitude, longitude}
    if (typeof position === 'object' && 
        (position.latitude !== undefined && position.longitude !== undefined)) {
      const lat = parseFloat(position.latitude);
      const lng = parseFloat(position.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Format objet ancien {lat, lng}
    if (typeof position === 'object' && position.lat !== undefined && position.lng !== undefined) {
      return { lat: position.lat, lng: position.lng };
    }
    
    // Format array [lat, lng] - nombres
    if (Array.isArray(position) && position.length === 2) {
      const lat = parseFloat(position[0]);
      const lng = parseFloat(position[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Format string "[18.87° S, 47.53° E]" ou "18.87° S, 47.53° E"
    if (typeof position === 'string') {
      // Essayer d'abord le format avec crochets
      let regex = /\[(-?\d+\.?\d*?)° ([NS]),\s*(-?\d+\.?\d*?)° ([EW])\]/;
      let match = position.match(regex);
      
      // Si pas de crochets, essayer sans
      if (!match) {
        regex = /(-?\d+\.?\d*?)° ([NS]),\s*(-?\d+\.?\d*?)° ([EW])/;
        match = position.match(regex);
      }
      
      if (!match) {
        console.warn('Position string format non valide:', position);
        return null;
      }
      
      let lat = parseFloat(match[1]);
      const latDir = match[2];
      let lng = parseFloat(match[3]);
      const lngDir = match[4];
      
      // Appliquer les directions
      if (latDir === 'S') lat = -lat;
      if (lngDir === 'W') lng = -lng;
      
      return { lat, lng };
    }
    
    return null;
  };

  const displaySignalements = (signalementList) => {
    const L = window.L;
    
    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const statusColors = {
      'Nouveau': '#FFA500',
      'En cours': '#32CD32',
      'Termine': '#228B22'
    };

    // Fonction pour créer une icône personnalisée
    const createCustomIcon = (color) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
          ">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    };

    signalementList.forEach((signalement) => {
      try {
        // Parser la position - supporte les 2 formats
        const parsed = parsePosition(signalement.position);
        if (!parsed) return;
        
        const lat = parsed.lat;
        const lng = parsed.lng;

        const color = statusColors[signalement.status] || '#FF6347';
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(color),
          title: signalement.descriptiotn || signalement.description
        }).addTo(map);

        markersRef.current.push(marker);

        marker.bindPopup(`
          <div class="map-popup">
            <h4>${signalement.descriptiotn || signalement.description}</h4>
            <div class="popup-grid">
              <div class="popup-item">
                <span class="popup-label">Date:</span>
                <span class="popup-value">${new Date(signalement.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Statut:</span>
                <span class="popup-value" style="color: ${color}">${signalement.status}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Surface:</span>
                <span class="popup-value">${signalement.surface.toLocaleString()} m²</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Budget:</span>
                <span class="popup-value">${signalement.budget.toLocaleString()} MGA</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">Entreprise:</span>
                <span class="popup-value">${signalement.entreprise}</span>
              </div>
            </div>
          </div>
        `);

        // Ouvrir le panneau latéral lors du clic
        marker.on('click', () => {
          setSelectedSignalement({
            ...signalement,
            lat: lat,
            lng: lng
          });
          setClickedLocation(null);
        });
      } catch (error) {
        console.error('Error adding signalement marker:', error);
      }
    });
  };

  const clearSignalements = () => {
    setShowMySignalements(false);
    setMySignalements([]);
    displaySignalements(signalements);
  };

  const updateSignalementStatus = async (signalementId, newStatus) => {
    try {
      setUpdatingStatus(true);
      setStatusMessage(null);

      const response = await fetch(`${API_URL}/api/signalements/${signalementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: '✅ Statut mis à jour avec succès' });
        
        // Mettre à jour le signalement sélectionné
        setSelectedSignalement(prev => ({ ...prev, status: newStatus }));
        
        // Recharger les signalements
        await loadAllSignalements();
        
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: `❌ Erreur: ${data.error}` });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setStatusMessage({ type: 'error', text: `❌ Erreur: ${error.message}` });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleViewPhotos = async () => {
    if (!selectedSignalement?.id) {
      return;
    }

    setPhotosLoading(true);
    setPhotosOpen(true);

    try {
      const response = await fetch(`${API_URL}/api/signalements/${selectedSignalement.id}/photos`);
      if (!response.ok) {
        throw new Error('Impossible de charger les photos');
      }
      const data = await response.json();
      const photoNames = Array.isArray(data.photos) ? data.photos : [];
      const photoItems = photoNames.map((name) => ({
        name,
        url: `${API_URL}/uploads/signalements/${selectedSignalement.id}/${name}`
      }));
      setPhotos(photoItems);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  return (
    <div className="map-page">
      <div className="map-container">
        {/* Header */}
        <div className="map-header">
          <div className="header-left">
            <h1>Carte des Projets</h1>
            <p>Visualisez tous les projets en cours d'Antananarivo</p>
          </div>
          <div className="map-stats">
            <div className="map-stat">
              <span className="stat-number">{showMySignalements ? mySignalements.length : signalements.length}</span>
              <span className="stat-label">{showMySignalements ? 'Mes projets' : 'Total projets'}</span>
            </div>
            <div className="map-stat">
              <span className="stat-number">63,940 m²</span>
              <span className="stat-label">Surface totale</span>
            </div>
            <div className="map-stat">
              <span className="stat-number">2.2M MGA</span>
              <span className="stat-label">Budget total</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className={`filter-btn ${showMySignalements ? 'active' : ''}`}
              onClick={showMySignalements ? clearSignalements : loadMySignalements}
              disabled={loadingSignalements}
            >
              {loadingSignalements ? '⏳' : showMySignalements ? '✓' : '👤'} {showMySignalements ? 'Voir tous' : 'Mes projets'}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="map-wrapper">
          <div ref={mapRef} className="leaflet-map"></div>
          
          {/* Quick Action Panel - appears when clicking on map (not on marker) */}
          {clickedLocation && !selectedLocation && !selectedSignalement && !showSignalementForm && (
            <div className="quick-action-panel">
              <div className="quick-action-content">
                <p className="quick-action-title">Localisation sélectionnée</p>
                <p className="quick-action-coords">
                  {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                </p>
                <button 
                  className="btn-signaler"
                  onClick={() => setShowSignalementForm(true)}
                >
                  ➕ Ajouter un projet
                </button>
                <button 
                  className="btn-close-quick"
                  onClick={() => setClickedLocation(null)}
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Signalement Details Panel - appears when clicking on a signalement marker */}
          {selectedSignalement && (
            <div className="signalement-panel">
              <div className="panel-header">
                <h3>📍 Détails du signalement</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setSelectedSignalement(null);
                    setStatusMessage(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="panel-content">
                {/* Status Message */}
                {statusMessage && (
                  <div className={`status-message ${statusMessage.type}`}>
                    {statusMessage.text}
                  </div>
                )}

                <div className="signalement-info">
                  <div className="info-item">
                    <label>📝 Description</label>
                    <p>{selectedSignalement.descriptiotn || selectedSignalement.description}</p>
                  </div>
                  <div className="info-item">
                    <label>📅 Date</label>
                    <p>{new Date(selectedSignalement.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="info-item">
                    <label>📊 Statut actuel</label>
                    <p className={`status-badge status-${selectedSignalement.status}`}>
                      {selectedSignalement.status === 'Nouveau' && '🆕 Nouveau'}
                      {selectedSignalement.status === 'En cours' && '🔄 En cours'}
                      {selectedSignalement.status === 'Termine' && '✅ Terminé'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>📐 Surface</label>
                    <p>{selectedSignalement.surface?.toLocaleString() || 'N/A'} m²</p>
                  </div>
                  <div className="info-item">
                    <label>💰 Budget</label>
                    <p>{selectedSignalement.budget?.toLocaleString() || 'N/A'} MGA</p>
                  </div>
                  <div className="info-item">
                    <label>🏢 Entreprise</label>
                    <p>{selectedSignalement.entreprise || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>📍 Coordonnées</label>
                    <p>{selectedSignalement.lat?.toFixed(4)}, {selectedSignalement.lng?.toFixed(4)}</p>
                  </div>
                </div>

                {/* Modifier le statut - visible pour manager et user */}
                {userData?.userType !== 'visitor' && (
                  <div className="status-modifier">
                    <label>🔄 Modifier le statut</label>
                    <div className="status-buttons">
                      <button
                        className={`status-btn Nouveau ${selectedSignalement.status === 'Nouveau' ? 'active' : ''}`}
                        onClick={() => updateSignalementStatus(selectedSignalement.id, 'Nouveau')}
                        disabled={updatingStatus || selectedSignalement.status === 'Nouveau'}
                      >
                        🆕 Nouveau
                      </button>
                      <button
                        className={`status-btn En cours ${selectedSignalement.status === 'En cours' ? 'active' : ''}`}
                        onClick={() => updateSignalementStatus(selectedSignalement.id, 'En cours')}
                        disabled={updatingStatus || selectedSignalement.status === 'En cours'}
                      >
                        🔄 En cours
                      </button>
                      <button
                        className={`status-btn Termine ${selectedSignalement.status === 'Termine' ? 'active' : ''}`}
                        onClick={() => updateSignalementStatus(selectedSignalement.id, 'Termine')}
                        disabled={updatingStatus || selectedSignalement.status === 'Termine'}
                      >
                        ✅ Terminé
                      </button>
                    </div>
                    {updatingStatus && <p className="updating-text">⏳ Mise à jour en cours...</p>}
                  </div>
                )}

                {userData?.userType === 'visitor' && (
                  <div className="visitor-notice">
                    🔒 Connectez-vous pour modifier le statut des signalements
                  </div>
                )}

                {/* Voir les photos button */}
                <div className="signalement-actions" style={{ marginTop: '16px' }}>
                  <button 
                    className="btn-view-photos"
                    onClick={handleViewPhotos}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: '#F2A444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    📷 Voir les photos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Signalement Form Modal */}
          {showSignalementForm && clickedLocation && (
            <SignalementForm 
              location={clickedLocation}
              onClose={() => {
                setShowSignalementForm(false);
                setClickedLocation(null);
              }}
              onSubmit={() => {
                // Optionnel: actualiser les données si nécessaire
              }}
            />
          )}
          
          {/* Location Details Panel */}
          {selectedLocation && (
            <div className="location-panel">
              <div className="panel-header">
                <h3>{selectedLocation.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedLocation(null)}
                >
                  ✕
                </button>
              </div>

              <div className="panel-content">
                <div className="location-info">
                  <div className="info-item">
                    <label>Date de report</label>
                    <p>{new Date(selectedLocation.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="info-item">
                    <label>Statut</label>
                    <p style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedLocation.status === 'En cours' ? '#F2A444' :
                                      selectedLocation.status === 'Planifié' ? '#401511' :
                                      selectedLocation.status === 'Complété' ? '#4CAF50' : '#FF9800',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {selectedLocation.status}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Surface</label>
                    <p>{selectedLocation.surface.toLocaleString()} m²</p>
                  </div>
                  <div className="info-item">
                    <label>Budget</label>
                    <p>{selectedLocation.budget.toLocaleString()} MGA</p>
                  </div>
                  <div className="info-item">
                    <label>Entreprise concernée</label>
                    <p>{selectedLocation.company}</p>
                  </div>
                  <div className="info-item">
                    <label>Coordonnées</label>
                    <p>{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="btn-primary">Voir les détails</button>
                  <button className="btn-secondary">Itinéraire</button>
                  <button 
                    className="btn-report"
                    onClick={() => {
                      setClickedLocation({
                        lat: selectedLocation.lat,
                        lng: selectedLocation.lng,
                        name: selectedLocation.name
                      });
                      setShowSignalementForm(true);
                    }}
                  >
                    ✏️ Éditer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="map-legend">
            <h4>Statuts des projets</h4>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#FFA500'}}></span>
              <span>Nouveau</span>
            </div>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#32CD32'}}></span>
              <span>En cours</span>
            </div>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#228B22'}}></span>
              <span>Terminé</span>
            </div>
          </div>

          {/* Photos Modal */}
          {photosOpen && (
            <div className="photo-modal-overlay" onClick={() => setPhotosOpen(false)}>
              <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                <div className="photo-modal-header">
                  <h3>Photos du signalement</h3>
                  <button className="close-btn" onClick={() => setPhotosOpen(false)}>✕</button>
                </div>
                <div className="photo-modal-content">
                  {photosLoading && <p>Chargement...</p>}
                  {!photosLoading && photos.length === 0 && <p>Aucune photo disponible</p>}
                  {!photosLoading && photos.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default Map;
