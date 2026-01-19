<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Récapitulatif & Carte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- 📊 Récapitulatif -->
      <div class="recap">
        <p><strong>Total :</strong> {{ totalSignalements }}</p>
        <p><strong>Surface :</strong> {{ totalSurface }} m²</p>
        <p><strong>Budget :</strong> {{ totalBudget }} Ar</p>
        <p><strong>Avancement :</strong> {{ avancement }} %</p>
      </div>

      <!-- 🗺️ Carte -->
      <div id="map"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/vue';
import L from 'leaflet';

/* =========================
   📌 Données simulées
   ========================= */
const signalements = [
  {
    lat: -18.879,
    lng: 47.508,
    statut: 'nouveau',
    date: '2026-01-10',
    surface: 120,
    budget: 1500000
  },
  {
    lat: -18.905,
    lng: 47.520,
    statut: 'en_cours',
    date: '2026-01-12',
    surface: 200,
    budget: 2500000
  },
  {
    lat: -18.860,
    lng: 47.490,
    statut: 'termine',
    date: '2026-01-14',
    surface: 300,
    budget: 3500000
  }
];

/* =========================
   📊 Calculs récap
   ========================= */
const totalSignalements = computed(() => signalements.length);

const totalSurface = computed(() =>
  signalements.reduce((s, x) => s + x.surface, 0)
);

const totalBudget = computed(() =>
  signalements.reduce((s, x) => s + x.budget, 0)
);

const avancement = computed(() => {
  const termines = signalements.filter(s => s.statut === 'termine').length;
  return Math.round((termines / signalements.length) * 100);
});

/* =========================
   🎨 Icône marker par statut
   ========================= */
function getIcon(statut: string) {
  let color = 'red';
  if (statut === 'en_cours') color = 'orange';
  if (statut === 'termine') color = 'green';

  return L.divIcon({
    html: `<div class="marker ${color}"></div>`,
    iconSize: [16, 16],
    className: ''
  });
}

onMounted(() => {
  const map = L.map('map').setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // ➕ Markers
  signalements.forEach((s) => {
    L.marker([s.lat, s.lng], { icon: getIcon(s.statut) })
      .addTo(map)
      .bindPopup(`
        <strong>Date :</strong> ${s.date}<br/>
        <strong>Statut :</strong> ${s.statut}<br/>
        <strong>Surface :</strong> ${s.surface} m²<br/>
        <strong>Budget :</strong> ${s.budget} Ar
      `);
  });
});
</script>

<style scoped>
/* 📊 Récap */
.recap {
  padding: 12px;
  background: #f4f4f4;
  font-size: 15px;
  border-bottom: 1px solid #ddd;
}

/* 🗺️ Carte */
#map {
  height: calc(100vh - 160px);
  width: 100%;
}

/* 🎯 Markers */
.marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
}
.marker.red { background: red; }
.marker.orange { background: orange; }
.marker.green { background: green; }
</style>
