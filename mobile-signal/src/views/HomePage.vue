<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- 📊 Récap -->
      <div class="recap">
        <p><strong>Total :</strong> {{ totalSignalements }}</p>
        <p><strong>Surface :</strong> {{ totalSurface }} m²</p>
        <p><strong>Budget :</strong> {{ totalBudget }} Ar</p>
        <p><strong>Avancement :</strong> {{ avancement }} %</p>

        <ion-button expand="block" color="primary" @click="activerSignalement">
          ➕ Signaler
        </ion-button>
      </div>

      <!-- 🗺️ Carte -->
      <div id="map"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton
} from '@ionic/vue';
import L from 'leaflet';

/* =========================
   📌 Données simulées
   ========================= */
const signalements = [
  { lat: -18.879, lng: 47.508, statut: 'nouveau', surface: 120, budget: 1500000 },
  { lat: -18.905, lng: 47.520, statut: 'en_cours', surface: 200, budget: 2500000 },
  { lat: -18.860, lng: 47.490, statut: 'termine', surface: 300, budget: 3500000 }
];

/* =========================
   📊 Récap
   ========================= */
const totalSignalements = computed(() => signalements.length);
const totalSurface = computed(() => signalements.reduce((s, x) => s + x.surface, 0));
const totalBudget = computed(() => signalements.reduce((s, x) => s + x.budget, 0));
const avancement = computed(() => {
  const t = signalements.filter(s => s.statut === 'termine').length;
  return Math.round((t / signalements.length) * 100);
});

/* =========================
   🗺️ Carte & signalement
   ========================= */
let map: L.Map;
let nouveauMarker: L.Marker | null = null;
const modeSignalement = ref(false);

function activerSignalement() {
  modeSignalement.value = true;
  alert('Cliquez sur la carte pour placer le signalement');
}

onMounted(() => {
  map = L.map('map').setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Markers existants
  signalements.forEach(s => {
    L.marker([s.lat, s.lng]).addTo(map);
  });

  // 🎯 Clic carte
  map.on('click', (e: any) => {
    if (!modeSignalement.value) return;

    if (nouveauMarker) {
      map.removeLayer(nouveauMarker);
    }

    nouveauMarker = L.marker(e.latlng)
      .addTo(map)
      .bindPopup(`
        <strong>Nouveau signalement</strong><br/>
        Latitude : ${e.latlng.lat.toFixed(5)}<br/>
        Longitude : ${e.latlng.lng.toFixed(5)}
      `)
      .openPopup();

    modeSignalement.value = false;
  });
});
</script>

<style scoped>
.recap {
  padding: 12px;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
}

#map {
  height: calc(100vh - 220px);
  width: 100%;
}
</style>
