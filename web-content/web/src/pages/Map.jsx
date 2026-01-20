import { useState, useEffect, useRef } from 'react';
import './Map.css';

const Map = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS and JS only once
    if (!window.L) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(leafletCSS);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      leafletScript.onload = () => {
        initializeMap();
      };
      document.body.appendChild(leafletScript);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    const L = window.L;
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) {
      return;
    }

    // Clear the container
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }

    const map = L.map(mapRef.current).setView([-18.879, 47.508], 13);
    mapInstanceRef.current = map;

    // Try Tile Server first, fall back to CartoDB if CORS issues
    const tileLayer = L.tileLayer('http://localhost:8081/tile/{z}/{x}/{y}.png', {
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
      // { id: 1, name: 'Tech Corp', lat: 48.8566, lng: 2.3522, city: 'Paris, France' },
      // { id: 2, name: 'Design Inc', lat: 51.5074, lng: -0.1278, city: 'London, UK' },
      // { id: 3, name: 'Creative Ltd', lat: 52.5200, lng: 13.4050, city: 'Berlin, Germany' },
      // { id: 4, name: 'Startup Co', lat: 48.2566, lng: 16.3522, city: 'Vienna, Austria' },
      // { id: 5, name: 'Enterprise Pro', lat: 45.4642, lng: 9.1900, city: 'Milan, Italy' },
      // { id: 6, name: 'Global Solutions', lat: 40.4168, lng: -3.7038, city: 'Madrid, Spain' },
    ];

    // Add markers
    locations.forEach((location) => {
      const marker = L.marker([location.lat, location.lng]).addTo(map);
      marker.bindPopup(`
        <div class="map-popup">
          <h4>${location.name}</h4>
          <p>${location.city}</p>
        </div>
      `);
      
      marker.on('click', () => {
        setSelectedLocation(location);
      });
    });

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
            <h1>Map</h1>
            <p>View all locations on the interactive map</p>
          </div>
          <div className="map-stats">
            <div className="map-stat">
              <span className="stat-number">6</span>
              <span className="stat-label">Locations</span>
            </div>
            <div className="map-stat">
              <span className="stat-number">5</span>
              <span className="stat-label">Countries</span>
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
                    <label>📍 City</label>
                    <p>{selectedLocation.city}</p>
                  </div>
                  <div className="info-item">
                    <label>🌐 Coordinates</label>
                    <p>{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
                  </div>
                  <div className="info-item">
                    <label>🏢 Company</label>
                    <p>{selectedLocation.name}</p>
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="btn-primary">View Details</button>
                  <button className="btn-secondary">Route</button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="map-legend">
            <h4>Legend</h4>
            <div className="legend-item">
              <span className="marker-icon">📍</span>
              <span>Company Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
