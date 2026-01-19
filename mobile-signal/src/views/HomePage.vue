<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Conteneur de la carte -->
      <div id="map"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/vue';

import L from 'leaflet';

onMounted(() => {
  // 📍 Coordonnées Antananarivo
  const lat = -18.879;
  const lng = 47.508;
  const zoom = 13;

  const map = L.map('map').setView([lat, lng], zoom);

  // 🗺️ Fond de carte OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
});
</script>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
</style>
