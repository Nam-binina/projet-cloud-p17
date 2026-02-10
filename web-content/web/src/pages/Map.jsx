import { useState, useEffect, useRef } from 'react';
import './Map.css';
import SignalementForm from '../components/SignalementForm';
import InterventionForm from '../components/InterventionForm';

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
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionSignalement, setInterventionSignalement] = useState(null);
  const [photosError, setPhotosError] = useState(null);
  const [uploadPhotos, setUploadPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadPhotosError, setUploadPhotosError] = useState(null);
  const [uploadPhotosSuccess, setUploadPhotosSuccess] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
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
      if (mapInstanceRef.current) {
        console.log('Cleaning up map');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    const L = window.L;
    
    if (mapInstanceRef.current) {
      console.log('Map already exists, skipping reinitialization');
      return;
    }
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

    const isBrowser = typeof window !== 'undefined';
    const isLocalDev = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    

    const tileServerUrl = isLocalDev 
      ? 'http://localhost:8081/tile/{z}/{x}/{y}.png'
      : '/tile-server/tile/{z}/{x}/{y}.png';
    
    console.log('Using tile server URL:', tileServerUrl, '(isLocalDev:', isLocalDev, ')');

    const tileLayer = L.tileLayer(tileServerUrl, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
      minZoom: 0,
      crossOrigin: 'anonymous',
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });

    const fallbackLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 20,
      minZoom: 0,
      subdomains: 'abcd'
    });

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

    // Niveaux de réparation avec couleurs
    const repairLevels = {
      1: { name: 'Très mineur', color: '#4CAF50' },
      2: { name: 'Mineur', color: '#8BC34A' },
      3: { name: 'Léger', color: '#CDDC39' },
      4: { name: 'Modéré-Léger', color: '#FFEB3B' },
      5: { name: 'Modéré', color: '#FFC107' },
      6: { name: 'Modéré-Important', color: '#FF9800' },
      7: { name: 'Important', color: '#FF5722' },
      8: { name: 'Très important', color: '#F44336' },
      9: { name: 'Majeur', color: '#E91E63' },
      10: { name: 'Reconstruction', color: '#9C27B0' }
    };

    const getRepairLevelColor = (level) => {
      return repairLevels[level]?.color || '#999';
    };

    const getRepairLevelName = (level) => {
      return repairLevels[level]?.name || 'Non défini';
    };

    // Fonction pour créer une icône personnalisée avec le niveau de réparation
    const createCustomIcon = (color, repairLevel) => {
      const levelColor = repairLevel ? getRepairLevelColor(repairLevel) : color;
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${levelColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">${repairLevel || '?'}</span>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42]
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
        const repairLevel = signalement.repair_level || signalement.niveau;
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(color, repairLevel),
          title: signalement.descriptiotn || signalement.description
        }).addTo(map);

        markersRef.current.push(marker);

        // Calculer le budget si les données sont disponibles
        const calculatedBudget = signalement.calculated_budget || 
          (signalement.budget ? signalement.budget : 
            (repairLevel && signalement.surface ? repairLevel * signalement.surface * 50 : null));

        marker.bindPopup(`
          <div class="map-popup">
            <h4>${signalement.descriptiotn || signalement.description}</h4>
            <div class="popup-grid">
              <div class="popup-item">
                <span class="popup-label">📅 Date:</span>
                <span class="popup-value">${new Date(signalement.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">📊 Statut:</span>
                <span class="popup-value" style="color: ${color}; font-weight: bold;">${signalement.status}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">🔧 Niveau:</span>
                <span class="popup-value" style="color: ${getRepairLevelColor(repairLevel)}; font-weight: bold;">
                  ${repairLevel || 'N/A'} - ${getRepairLevelName(repairLevel)}
                </span>
              </div>
              <div class="popup-item">
                <span class="popup-label">📐 Surface:</span>
                <span class="popup-value">${signalement.surface ? signalement.surface.toLocaleString() : 'N/A'} m²</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">💰 Budget:</span>
                <span class="popup-value" style="color: #2e7d32; font-weight: bold;">
                  ${calculatedBudget ? calculatedBudget.toLocaleString() + ' €' : 'Non calculé'}
                </span>
              </div>
              <div class="popup-item">
                <span class="popup-label">🏢 Entreprise:</span>
                <span class="popup-value">${signalement.entreprise || 'Non assignée'}</span>
              </div>
              ${signalement.photos && signalement.photos.length > 0 ? `
                <div class="popup-item popup-photos-link">
                  <a href="#" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('openPhotos', {detail: '${signalement.id}'}));">
                    📸 Voir les photos (${signalement.photos.length})
                  </a>
                </div>
              ` : ''}
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

  const handleClosePhotos = () => {
    setPhotos([]);
    setPhotosError(null);
    setPhotosOpen(false);
  };

  const handleUploadPhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadPhotos(files);
    setUploadPhotosError(null);
    setUploadPhotosSuccess(null);
  };

  const handleUploadPhotos = async () => {
    if (!selectedSignalement?.id || uploadPhotos.length === 0) {
      return;
    }

    setUploadingPhotos(true);
    setUploadPhotosError(null);
    setUploadPhotosSuccess(null);

    try {
      const formData = new FormData();
      uploadPhotos.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch(`${API_URL}/api/signalements/${selectedSignalement.id}/photos`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Erreur lors de l\'upload des photos');
      }

      setUploadPhotosSuccess('✅ Photos ajoutées avec succès');
      setUploadPhotos([]);
      if (photosOpen) {
        await handleViewPhotos();
      }
    } catch (error) {
      console.error('Erreur upload photos:', error);
      setUploadPhotosError(error.message || 'Erreur lors de l\'upload des photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleViewPhotos = async () => {
    if (!selectedSignalement?.id) {
      return;
    }

    setPhotosLoading(true);
    setPhotosOpen(true);
    setPhotosError(null);

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
      if (photoItems.length === 0) {
        setPhotosError('Aucune photo disponible');
      }
    } catch (err) {
      console.error('Erreur chargement photos:', err);
      setPhotos([]);
      setPhotosError('Aucune photo disponible');
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
                  className="btn-create-intervention"
                  onClick={() => {
                    setInterventionSignalement({
                      lat: clickedLocation.lat,
                      lng: clickedLocation.lng,
                      description: clickedLocation.name
                    });
                    setShowInterventionForm(true);
                  }}
                >
                  🔧 Créer une intervention
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
                    <label>� Niveau de réparation</label>
                    <p className="repair-level-display" style={{
                      backgroundColor: (() => {
                        const repairLevels = {
                          1: '#4CAF50', 2: '#8BC34A', 3: '#CDDC39', 4: '#FFEB3B', 5: '#FFC107',
                          6: '#FF9800', 7: '#FF5722', 8: '#F44336', 9: '#E91E63', 10: '#9C27B0'
                        };
                        return repairLevels[selectedSignalement.repair_level || selectedSignalement.niveau] || '#999';
                      })(),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      display: 'inline-block',
                      fontWeight: 'bold'
                    }}>
                      Niveau {selectedSignalement.repair_level || selectedSignalement.niveau || 'N/A'} - {
                        {
                          1: 'Très mineur', 2: 'Mineur', 3: 'Léger', 4: 'Modéré-Léger', 5: 'Modéré',
                          6: 'Modéré-Important', 7: 'Important', 8: 'Très important', 9: 'Majeur', 10: 'Reconstruction'
                        }[selectedSignalement.repair_level || selectedSignalement.niveau] || 'Non défini'
                      }
                    </p>
                  </div>
                  <div className="info-item">
                    <label>📐 Surface</label>
                    <p>{selectedSignalement.surface?.toLocaleString() || 'N/A'} m²</p>
                  </div>
                  <div className="info-item">
                    <label>💰 Budget calculé</label>
                    <p style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.1em' }}>
                      {selectedSignalement.calculated_budget 
                        ? selectedSignalement.calculated_budget.toLocaleString() + ' €'
                        : selectedSignalement.budget 
                          ? selectedSignalement.budget.toLocaleString() + ' MGA'
                          : (selectedSignalement.repair_level && selectedSignalement.surface)
                            ? ((selectedSignalement.repair_level || 5) * (selectedSignalement.surface || 0) * 50).toLocaleString() + ' €'
                            : 'Non calculé'
                      }
                    </p>
                    {selectedSignalement.repair_level && selectedSignalement.surface && (
                      <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                        Formule: 50€/m² × {selectedSignalement.repair_level} × {selectedSignalement.surface}m²
                      </small>
                    )}
                  </div>
                  <div className="info-item">
                    <label>🏢 Entreprise</label>
                    <p>{selectedSignalement.entreprise || 'Non assignée'}</p>
                  </div>
                  <div className="info-item">
                    <label>📍 Coordonnées</label>
                    <p>{selectedSignalement.lat?.toFixed(4)}, {selectedSignalement.lng?.toFixed(4)}</p>
                  </div>
                  {/* Lien vers les photos */}
                  {/* <div className="info-item photos-link-item">
                    <button 
                      className="btn-view-photos"
                      onClick={handleViewPhotos}
                      style={{
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      📸 Voir les photos
                    </button>
                  </div> */}
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
                <div className="signalement-actions" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    Voir les photos
                  </button>
                  <button 
                    className="btn-create-intervention"
                    onClick={() => {
                      setInterventionSignalement(selectedSignalement);
                      setShowInterventionForm(true);
                    }}
                  >
                    Créer une intervention
                  </button>
                </div>

                {userData?.userType !== 'visitor' && (
                  <div className="signalement-actions" style={{ marginTop: '12px' }}>
                    <label htmlFor="upload-photos" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                      Ajouter des photos
                    </label>
                    <input
                      id="upload-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadPhotosChange}
                      disabled={uploadingPhotos}
                    />
                    <button
                      className="btn-view-photos"
                      onClick={handleUploadPhotos}
                      disabled={uploadingPhotos || uploadPhotos.length === 0}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: uploadPhotos.length === 0 ? '#c9c9c9' : '#401511',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: uploadPhotos.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '8px',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {uploadingPhotos ? 'Upload en cours...' : '📤 Ajouter les photos'}
                    </button>
                    {uploadPhotosError && (
                      <p style={{ color: '#b00020', marginTop: '8px' }}>{uploadPhotosError}</p>
                    )}
                    {uploadPhotosSuccess && (
                      <p style={{ color: '#1b5e20', marginTop: '8px' }}>{uploadPhotosSuccess}</p>
                    )}
                  </div>
                )}
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

          {/* Intervention Form Modal */}
          {showInterventionForm && (
            <InterventionForm
              signalement={interventionSignalement}
              onClose={() => {
                setShowInterventionForm(false);
                setInterventionSignalement(null);
              }}
              onCreated={() => {
                setShowInterventionForm(false);
                setInterventionSignalement(null);
                setSelectedSignalement(null);
              }}
            />
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
            <div className="photo-modal-overlay" onClick={handleClosePhotos}>
              <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                <div className="photo-modal-header">
                  <h3>Photos du signalement</h3>
                  <button className="close-btn" onClick={handleClosePhotos}>✕</button>
                </div>
                <div className="photo-modal-content">
                  {photosLoading && <p>Chargement...</p>}
                  {!photosLoading && photosError && <p>{photosError}</p>}
                  {!photosLoading && !photosError && photos.length === 0 && <p>Aucune photo disponible</p>}
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
