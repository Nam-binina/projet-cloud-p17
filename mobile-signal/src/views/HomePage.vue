<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
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
  const map = L.map('map').setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 🔴 nouveau
  L.marker([-18.879, 47.508]).addTo(map).bindPopup('Nouveau signalement');

  // 🟠 en cours
  L.marker([-18.905, 47.520]).addTo(map).bindPopup('Signalement en cours');

  // 🟢 terminé
  L.marker([-18.860, 47.490]).addTo(map).bindPopup('Signalement terminé');
});
</script>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
</style>
