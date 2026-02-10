<template>
  <div class="map-container">
    <div id="map" ref="mapContainer"></div>
    
    <!-- Popup d'information au survol -->
    <div 
      v-if="hoveredPoint" 
      class="point-info-popup"
      :style="popupStyle"
    >
      <div class="popup-header">
        <span class="status-badge" :class="getStatusClass(hoveredPoint.status)">
          {{ getStatusLabel(hoveredPoint.status) }}
        </span>
        <span class="level-badge" :class="getLevelClass(hoveredPoint.repair_level)">
          Niveau {{ hoveredPoint.repair_level || 'N/A' }}
        </span>
      </div>
      
      <div class="popup-content">
        <div class="info-row">
          <span class="info-icon">📅</span>
          <span>{{ formatDate(hoveredPoint.created_at) }}</span>
        </div>
        
        <div class="info-row" v-if="hoveredPoint.surface_m2">
          <span class="info-icon">📐</span>
          <span>{{ hoveredPoint.surface_m2 }} m²</span>
        </div>
        
        <div class="info-row" v-if="hoveredPoint.calculated_budget">
          <span class="info-icon">💰</span>
          <span>{{ formatCurrency(hoveredPoint.calculated_budget) }}</span>
        </div>
        
        <div class="info-row" v-if="hoveredPoint.entreprise">
          <span class="info-icon">🏢</span>
          <span>{{ hoveredPoint.entreprise }}</span>
        </div>
        
        <div class="info-row" v-if="hoveredPoint.repair_level">
          <span class="info-icon">🔧</span>
          <span>{{ getRepairLevelName(hoveredPoint.repair_level) }}</span>
        </div>
        
        <a 
          v-if="hoveredPoint.photos && hoveredPoint.photos.length > 0"
          :href="`#/intervention/${hoveredPoint.id}/photos`"
          class="photos-link"
          @click.stop
        >
          <span class="info-icon">📸</span>
          Voir les photos ({{ hoveredPoint.photos.length }})
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, defineComponent, PropType } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Point {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  repair_level?: number;
  surface_m2?: number;
  calculated_budget?: number;
  latitude: number;
  longitude: number;
  entreprise?: string;
  photos?: Array<{ id: number; url: string; thumbnail?: string }>;
  created_at?: string;
}

export default defineComponent({
  name: 'MapView',
  props: {
    points: {
      type: Array as PropType<Point[]>,
      default: () => []
    },
    center: {
      type: Array as PropType<number[]>,
      default: () => [-18.8792, 47.5079] // Antananarivo par défaut
    },
    zoom: {
      type: Number,
      default: 13
    }
  },
  emits: ['point-click'],
  setup(props, { emit }) {
    const mapContainer = ref<HTMLElement | null>(null);
    const map = ref<L.Map | null>(null);
    const markers = ref<L.Marker[]>([]);
    const hoveredPoint = ref<Point | null>(null);
    const popupStyle = reactive({
      top: '0px',
      left: '0px'
    });

    // Niveaux de réparation
    const repairLevels: Record<number, { name: string; color: string }> = {
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

    const getRepairLevelName = (level: number | undefined): string => {
      if (!level) return 'Non défini';
      return repairLevels[level]?.name || 'Non défini';
    };

    const getRepairLevelColor = (level: number | undefined): string => {
      if (!level) return '#999';
      return repairLevels[level]?.color || '#999';
    };

    const getStatusLabel = (status: string | undefined): string => {
      const labels: Record<string, string> = {
        'nouveau': 'Nouveau',
        'new': 'Nouveau',
        'en_cours': 'En cours',
        'in_progress': 'En cours',
        'pending': 'En attente',
        'termine': 'Terminé',
        'completed': 'Terminé'
      };
      return labels[status || ''] || status || 'Inconnu';
    };

    const getStatusClass = (status: string | undefined): string => {
      const classes: Record<string, string> = {
        'nouveau': 'status-new',
        'new': 'status-new',
        'en_cours': 'status-progress',
        'in_progress': 'status-progress',
        'pending': 'status-pending',
        'termine': 'status-completed',
        'completed': 'status-completed'
      };
      return classes[status || ''] || 'status-unknown';
    };

    const getLevelClass = (level: number | undefined): string => {
      if (!level) return 'level-unknown';
      if (level <= 3) return 'level-low';
      if (level <= 6) return 'level-medium';
      return 'level-high';
    };

    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return 'Date inconnue';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const formatCurrency = (value: number | undefined): string => {
      if (!value) return 'Non calculé';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    };

    const createCustomIcon = (point: Point): L.DivIcon => {
      const level = point.repair_level || 5;
      const color = getRepairLevelColor(level);
      
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin" style="background-color: ${color}">
            <span class="marker-level">${level}</span>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
    };

    const initMap = (): void => {
      if (!mapContainer.value) return;

      map.value = L.map(mapContainer.value).setView(
        [props.center[0], props.center[1]], 
        props.zoom
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value as L.Map);

      addMarkers();
    };

    const addMarkers = (): void => {
      if (!map.value) return;

      // Supprimer les anciens marqueurs
      markers.value.forEach(marker => marker.remove());
      markers.value = [];

      // Ajouter les nouveaux marqueurs
      props.points.forEach(point => {
        if (point.latitude && point.longitude && map.value) {
          const marker = L.marker([point.latitude, point.longitude], {
            icon: createCustomIcon(point)
          }).addTo(map.value as L.Map);

          // Événements de survol
          marker.on('mouseover', (e: L.LeafletMouseEvent) => {
            hoveredPoint.value = point;
            if (map.value) {
              const containerPoint = map.value.latLngToContainerPoint(e.latlng);
              popupStyle.top = `${containerPoint.y - 10}px`;
              popupStyle.left = `${containerPoint.x + 20}px`;
            }
          });

          marker.on('mouseout', () => {
            hoveredPoint.value = null;
          });

          marker.on('click', () => {
            emit('point-click', point);
          });

          markers.value.push(marker);
        }
      });
    };

    onMounted(() => {
      initMap();
    });

    onUnmounted(() => {
      if (map.value) {
        map.value.remove();
      }
    });

    // Watcher pour les points
    watch(() => props.points, () => {
      if (map.value) {
        addMarkers();
      }
    }, { deep: true });

    return {
      mapContainer,
      hoveredPoint,
      popupStyle,
      getStatusLabel,
      getStatusClass,
      getLevelClass,
      getRepairLevelName,
      formatDate,
      formatCurrency
    };
  }
});
</script>

<style>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Popup d'information */
.point-info-popup {
  position: absolute;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 14px;
  min-width: 260px;
  max-width: 320px;
  pointer-events: auto;
  transform: translateY(-50%);
}

.point-info-popup::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: white;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-new {
  background: #e3f2fd;
  color: #1976d2;
}

.status-progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-pending {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-completed {
  background: #e8f5e9;
  color: #388e3c;
}

.status-unknown {
  background: #f5f5f5;
  color: #757575;
}

.level-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.level-low {
  background: #c8e6c9;
  color: #2e7d32;
}

.level-medium {
  background: #ffe0b2;
  color: #ef6c00;
}

.level-high {
  background: #ffcdd2;
  color: #c62828;
}

.level-unknown {
  background: #e0e0e0;
  color: #616161;
}

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #555;
}

.info-icon {
  font-size: 14px;
}

.photos-link {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 8px;
  color: #1976d2;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.photos-link:hover {
  background: #e3f2fd;
}

/* Marqueur personnalisé */
.custom-marker {
  background: transparent;
  border: none;
}

.marker-pin {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.marker-level {
  transform: rotate(45deg);
  color: white;
  font-weight: bold;
  font-size: 12px;
}
</style>
