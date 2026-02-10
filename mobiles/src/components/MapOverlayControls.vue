<template>
  <div class="map-legend-overlay">
    <div class="legend-content">
      <p class="legend-title">Légende des statuts</p>
      <div class="legend-item">
        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" alt="Nouveau" class="legend-icon">
        <span>Nouveau</span>
      </div>
      <div class="legend-item">
        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png" alt="En cours" class="legend-icon">
        <span>En cours</span>
      </div>
      <div class="legend-item">
        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Terminé" class="legend-icon">
        <span>Terminé</span>
      </div>
    </div>
  </div>

  <button class="see-recap-btn" @click="$emit('toggle')" :title="showRecap ? 'Masquer récapitulatif' : 'Afficher récapitulatif'">
    <ion-icon :icon="showRecap ? eyeOffOutline : eyeOutline"></ion-icon>
    <span>{{ showRecap ? 'Masquer recap' : 'Voir recap' }}</span>
  </button>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

defineProps<{
  showRecap: boolean;
}>();
</script>

<style scoped>
.map-legend-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  max-width: 150px;
}

.legend-title {
  font-size: 12px;
  font-weight: bold;
  margin: 0 0 8px 0;
  text-align: center;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-icon {
  width: 16px;
  height: 25px;
  margin-right: 8px;
}

.legend-item span {
  font-size: 12px;
  color: #555;
}

.see-recap-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background: white;
  color: #333;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  font-weight: 600;
  cursor: pointer;
}

.see-recap-btn ion-icon {
  font-size: 18px;
}
</style>
