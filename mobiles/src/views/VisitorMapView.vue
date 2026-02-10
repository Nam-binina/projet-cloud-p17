<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des interventions</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showFilters = !showFilters">
            <ion-icon :icon="filterOutline"></ion-icon>
          </ion-button>
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Filtres -->
      <div v-if="showFilters" class="filters-panel">
        <div class="filter-group">
          <label>Statut</label>
          <ion-select v-model="filters.status" placeholder="Tous">
            <ion-select-option value="">Tous</ion-select-option>
            <ion-select-option value="nouveau">Nouveau</ion-select-option>
            <ion-select-option value="en_cours">En cours</ion-select-option>
            <ion-select-option value="termine">Terminé</ion-select-option>
          </ion-select>
        </div>
        
        <div class="filter-group">
          <label>Niveau de réparation: {{ filters.minLevel }} - {{ filters.maxLevel }}</label>
          <ion-range 
            :dualKnobs="true"
            :min="1" 
            :max="10" 
            :pin="true"
            :value="{ lower: filters.minLevel, upper: filters.maxLevel }"
            @ionChange="onRangeChange"
          >
            <ion-label slot="start">1</ion-label>
            <ion-label slot="end">10</ion-label>
          </ion-range>
        </div>
        
        <ion-button expand="block" @click="applyFilters">
          Appliquer les filtres
        </ion-button>
      </div>

      <!-- Légende des niveaux -->
      <div class="legend-panel" :class="{ 'legend-collapsed': legendCollapsed }">
        <div class="legend-header" @click="legendCollapsed = !legendCollapsed">
          <span class="legend-title">Niveaux de réparation</span>
          <ion-icon :icon="legendCollapsed ? chevronDownOutline : chevronUpOutline"></ion-icon>
        </div>
        <div v-if="!legendCollapsed" class="legend-items">
          <div 
            v-for="(level, key) in repairLevels" 
            :key="key" 
            class="legend-item"
          >
            <span 
              class="legend-color" 
              :style="{ backgroundColor: level.color }"
            >{{ key }}</span>
            <span class="legend-label">{{ level.name }}</span>
          </div>
        </div>
      </div>

      <!-- Message de chargement -->
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des interventions...</p>
      </div>

      <!-- Carte -->
      <MapView
        v-if="!isLoading"
        ref="mapRef"
        :points="filteredPoints"
        :center="mapCenter"
        :zoom="mapZoom"
        @point-click="onPointClick"
      />

      <!-- Modal détail intervention -->
      <ion-modal :is-open="showDetailModal" @didDismiss="showDetailModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Détails de l'intervention</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDetailModal = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content v-if="selectedPoint" class="modal-content">
          <div class="detail-content">
            <div class="detail-header">
              <span class="status-badge" :class="getStatusClass(selectedPoint.status)">
                {{ getStatusLabel(selectedPoint.status) }}
              </span>
              <span class="level-indicator" :style="{ backgroundColor: getLevelColor(selectedPoint.repair_level) }">
                Niveau {{ selectedPoint.repair_level || 'N/A' }}
              </span>
            </div>

            <ion-list>
              <ion-item>
                <ion-label>
                  <h3>Date de création</h3>
                  <p>{{ formatDate(selectedPoint.created_at) }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-label>
                  <h3>Niveau de réparation</h3>
                  <p>{{ selectedPoint.repair_level }} - {{ getRepairLevelName(selectedPoint.repair_level) }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item v-if="selectedPoint.surface_m2">
                <ion-label>
                  <h3>Surface</h3>
                  <p>{{ selectedPoint.surface_m2 }} m²</p>
                </ion-label>
              </ion-item>
              
              <ion-item v-if="selectedPoint.calculated_budget">
                <ion-label>
                  <h3>Budget estimé</h3>
                  <p class="budget-value">{{ formatCurrency(selectedPoint.calculated_budget) }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item v-if="selectedPoint.entreprise">
                <ion-label>
                  <h3>Entreprise concernée</h3>
                  <p>{{ selectedPoint.entreprise }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item v-if="selectedPoint.description">
                <ion-label>
                  <h3>Description</h3>
                  <p>{{ selectedPoint.description }}</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <!-- Photos -->
            <div v-if="selectedPoint.photos && selectedPoint.photos.length > 0" class="photos-section">
              <h3>Photos ({{ selectedPoint.photos.length }})</h3>
              <div class="photos-grid">
                <div 
                  v-for="(photo, index) in selectedPoint.photos" 
                  :key="index"
                  class="photo-item"
                  @click="openPhoto(photo)"
                >
                  <img :src="photo.thumbnail || photo.url" :alt="`Photo ${index + 1}`" />
                </div>
              </div>
            </div>

            <!-- Formule de calcul du budget -->
            <div v-if="selectedPoint.repair_level && selectedPoint.surface_m2" class="budget-formula">
              <h4>Calcul du budget</h4>
              <p class="formula">
                {{ pricePerM2 }}€/m² × {{ selectedPoint.repair_level }} × {{ selectedPoint.surface_m2 }}m² 
                = <strong>{{ formatCurrency(selectedPoint.calculated_budget) }}</strong>
              </p>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { ref, reactive, computed, onMounted, defineComponent } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonModal, IonList, IonItem,
  IonLabel, IonSelect, IonSelectOption, IonRange, IonSpinner
} from '@ionic/vue';
import { filterOutline, refreshOutline, closeOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import MapView from '@/components/MapView.vue';

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
  name: 'VisitorMapView',
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonModal, IonList, IonItem,
    IonLabel, IonSelect, IonSelectOption, IonRange, IonSpinner,
    MapView
  },
  setup() {
    const mapRef = ref(null);
    const points = ref<Point[]>([]);
    const showFilters = ref(false);
    const showDetailModal = ref(false);
    const selectedPoint = ref<Point | null>(null);
    const pricePerM2 = ref(50);
    const mapCenter = ref([-18.8792, 47.5079]); // Antananarivo
    const mapZoom = ref(13);
    const isLoading = ref(true);
    const legendCollapsed = ref(true);

    const filters = reactive({
      status: '',
      minLevel: 1,
      maxLevel: 10
    });

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

    const filteredPoints = computed(() => {
      return points.value.filter(point => {
        if (filters.status && point.status !== filters.status) return false;
        if (point.repair_level) {
          if (point.repair_level < filters.minLevel) return false;
          if (point.repair_level > filters.maxLevel) return false;
        }
        return true;
      });
    });

    const getApiUrl = (): string => {
      // @ts-ignore
      if (import.meta.env.VITE_API_URL) {
        // @ts-ignore
        return import.meta.env.VITE_API_URL;
      }
      return 'http://localhost:3000';
    };

    const fetchPoints = async () => {
      isLoading.value = true;
      try {
        const response = await fetch(`${getApiUrl()}/api/interventions`);
        if (response.ok) {
          points.value = await response.json();
        }
      } catch (error) {
        console.error('Erreur chargement points:', error);
        // Données de démonstration si l'API n'est pas disponible
        points.value = [
          {
            id: 1,
            title: 'Réparation route principale',
            status: 'en_cours',
            repair_level: 7,
            surface_m2: 150,
            calculated_budget: 52500,
            latitude: -18.8792,
            longitude: 47.5079,
            entreprise: 'BTP Madagascar',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Nid de poule secteur A',
            status: 'nouveau',
            repair_level: 3,
            surface_m2: 25,
            calculated_budget: 3750,
            latitude: -18.8850,
            longitude: 47.5150,
            entreprise: 'Travaux Express',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Réfection complète avenue',
            status: 'termine',
            repair_level: 9,
            surface_m2: 500,
            calculated_budget: 225000,
            latitude: -18.8700,
            longitude: 47.5000,
            entreprise: 'Grands Travaux SA',
            created_at: new Date().toISOString()
          }
        ];
      } finally {
        isLoading.value = false;
      }
    };

    const fetchPricePerM2 = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/pricing/price-per-m2`);
        if (response.ok) {
          const data = await response.json();
          pricePerM2.value = data.price_per_m2;
        }
      } catch (error) {
        console.error('Erreur chargement prix m2:', error);
      }
    };

    const getRepairLevelName = (level: number | undefined): string => {
      if (!level) return 'Non défini';
      return repairLevels[level]?.name || 'Non défini';
    };

    const getLevelColor = (level: number | undefined): string => {
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

    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return 'Date inconnue';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (value: number | undefined): string => {
      if (!value) return 'Non calculé';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    };

    const onPointClick = (point: Point) => {
      selectedPoint.value = point;
      showDetailModal.value = true;
    };

    const openPhoto = (photo: { url: string }) => {
      window.open(photo.url, '_blank');
    };

    const applyFilters = () => {
      showFilters.value = false;
    };

    const refreshData = () => {
      fetchPoints();
    };

    const onRangeChange = (event: CustomEvent) => {
      const value = event.detail.value;
      if (value && typeof value === 'object') {
        filters.minLevel = value.lower;
        filters.maxLevel = value.upper;
      }
    };

    onMounted(() => {
      fetchPoints();
      fetchPricePerM2();
    });

    return {
      mapRef,
      points,
      filteredPoints,
      showFilters,
      showDetailModal,
      selectedPoint,
      pricePerM2,
      mapCenter,
      mapZoom,
      filters,
      repairLevels,
      isLoading,
      legendCollapsed,
      filterOutline,
      refreshOutline,
      closeOutline,
      chevronDownOutline,
      chevronUpOutline,
      getRepairLevelName,
      getLevelColor,
      getStatusLabel,
      getStatusClass,
      formatDate,
      formatCurrency,
      onPointClick,
      openPhoto,
      applyFilters,
      refreshData,
      onRangeChange
    };
  }
});
</script>

<style scoped>
ion-content {
  --background: #f5f5f5;
}

.filters-panel {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.legend-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  max-height: 350px;
  overflow-y: auto;
  min-width: 180px;
}

.legend-collapsed {
  padding: 8px 12px;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.legend-title {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 11px;
  flex-shrink: 0;
}

.legend-label {
  color: #666;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255,255,255,0.9);
  z-index: 999;
}

.loading-overlay p {
  margin-top: 16px;
  color: #666;
}

.modal-content {
  --background: #f5f5f5;
}

.detail-content {
  padding: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
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

.level-indicator {
  padding: 6px 14px;
  border-radius: 16px;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

ion-list {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
}

ion-item h3 {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

ion-item p {
  font-size: 15px;
  color: #333;
}

.budget-value {
  font-size: 18px !important;
  font-weight: 600;
  color: #2e7d32 !important;
}

.photos-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.photos-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.budget-formula {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #2e7d32;
}

.budget-formula h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.formula {
  font-size: 14px;
  color: #333;
}

.formula strong {
  color: #2e7d32;
  font-size: 16px;
}
</style>
