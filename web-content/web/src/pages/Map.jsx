import { useState, useEffect, useRef } from 'react';
import './Map.css';

const Map = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

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
        setTimeout(() => initializeMap(), 100);
      };
      leafletScript.onerror = () => console.error('Failed to load Leaflet JS');
      document.body.appendChild(leafletScript);
    } else {
      console.log('Leaflet already loaded');
      initializeMap();
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
      { 
        id: 1, 
        name: 'Terrain Centre-Ville', 
        lat: -18.8792, 
        lng: 47.5079, 
        company: 'TechBuild Corp',
        date: '2025-01-15',
        status: 'En cours',
        surface: 5240,
        budget: 125000
      },
      { 
        id: 2, 
        name: 'Zone Industrielle Nord', 
        lat: -18.8650, 
        lng: 47.5200, 
        company: 'ConstructPro Ltd',
        date: '2025-02-10',
        status: 'Planifié',
        surface: 8500,
        budget: 250000
      },
      { 
        id: 3, 
        name: 'Quartier Résidentiel Est', 
        lat: -18.8900, 
        lng: 47.5350, 
        company: 'BuildCare Solutions',
        date: '2024-12-20',
        status: 'Complété',
        surface: 3200,
        budget: 85000
      },
      { 
        id: 4, 
        name: 'Centre Commercial Ouest', 
        lat: -18.8750, 
        lng: 47.4950, 
        company: 'Commerce Dev Inc',
        date: '2025-03-05',
        status: 'En cours',
        surface: 12000,
        budget: 450000
      },
      { 
        id: 5, 
        name: 'Parc Technologique Sud', 
        lat: -18.8950, 
        lng: 47.5150, 
        company: 'TechPark Builders',
        date: '2025-01-22',
        status: 'En attente',
        surface: 15000,
        budget: 620000
      },
      { 
        id: 6, 
        name: 'Zone d\'Expansion Urbaine', 
        lat: -18.8650, 
        lng: 47.4850, 
        company: 'Urban Development Co',
        date: '2025-04-01',
        status: 'Planifié',
        surface: 20000,
        budget: 800000
      },
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
                <span class="popup-label">📅 Date:</span>
                <span class="popup-value">${new Date(location.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">📊 Statut:</span>
                <span class="popup-value" style="color: ${statusColors[location.status]}">${location.status}</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">📐 Surface:</span>
                <span class="popup-value">${location.surface.toLocaleString()} m²</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">💰 Budget:</span>
                <span class="popup-value">${location.budget.toLocaleString()} MGA</span>
              </div>
              <div class="popup-item">
                <span class="popup-label">🏢 Entreprise:</span>
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
              <span className="stat-number">6</span>
              <span className="stat-label">Projets</span>
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
        </div>

        {/* Map Container */}
        <div className="map-wrapper">
          <div ref={mapRef} className="leaflet-map"></div>
          
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
                    <label>📅 Date de report</label>
                    <p>{new Date(selectedLocation.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="info-item">
                    <label>📊 Statut</label>
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
                    <label>📐 Surface</label>
                    <p>{selectedLocation.surface.toLocaleString()} m²</p>
                  </div>
                  <div className="info-item">
                    <label>💰 Budget</label>
                    <p>{selectedLocation.budget.toLocaleString()} MGA</p>
                  </div>
                  <div className="info-item">
                    <label>🏢 Entreprise concernée</label>
                    <p>{selectedLocation.company}</p>
                  </div>
                  <div className="info-item">
                    <label>🌐 Coordonnées</label>
                    <p>{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="btn-primary">Voir les détails</button>
                  <button className="btn-secondary">Itinéraire</button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="map-legend">
            <h4>Statuts des projets</h4>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#F2A444'}}></span>
              <span>En cours</span>
            </div>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#401511'}}></span>
              <span>Planifié</span>
            </div>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#4CAF50'}}></span>
              <span>Complété</span>
            </div>
            <div className="legend-item">
              <span className="marker-status" style={{backgroundColor: '#FF9800'}}></span>
              <span>En attente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
