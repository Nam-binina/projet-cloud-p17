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

      <!-- 🧾 Formulaire -->
      <div class="form" v-if="showForm">
        <ion-item>
          <ion-label>Statut</ion-label>
          <ion-select v-model="form.statut">
            <ion-select-option value="nouveau">Nouveau</ion-select-option>
            <ion-select-option value="en_cours">En cours</ion-select-option>
            <ion-select-option value="termine">Terminé</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Surface (m²)</ion-label>
          <ion-input type="number" v-model.number="form.surface"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Budget (Ar)</ion-label>
          <ion-input type="number" v-model.number="form.budget"></ion-input>
        </ion-item>

        <ion-button expand="block" color="success" @click="validerSignalement">
          Valider le signalement
        </ion-button>
      </div>

      <!-- 🗺️ Carte -->
      <div id="map"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/vue';
import L from 'leaflet';

/* =========================
   📌 Données (locales)
   ========================= */
const signalements = ref<any[]>([]);

/* =========================
   💾 OFFLINE STORAGE
   ========================= */
function sauvegarderLocal() {
  localStorage.setItem('signalements', JSON.stringify(signalements.value));
}

function chargerLocal() {
  const data = localStorage.getItem('signalements');
  if (data) {
    signalements.value = JSON.parse(data);
  } else {
    // données par défaut (1er lancement)
    signalements.value = [
      { lat: -18.879, lng: 47.508, statut: 'nouveau', surface: 120, budget: 1500000 },
      { lat: -18.905, lng: 47.520, statut: 'en_cours', surface: 200, budget: 2500000 },
      { lat: -18.860, lng: 47.490, statut: 'termine', surface: 300, budget: 3500000 }
    ];
  }
}

/* =========================
   📊 Récap
   ========================= */
const totalSignalements = computed(() => signalements.value.length);

const totalSurface = computed(() =>
  signalements.value.reduce((s, x) => s + x.surface, 0)
);

const totalBudget = computed(() =>
  signalements.value.reduce((s, x) => s + x.budget, 0)
);

const avancement = computed(() => {
  if (signalements.value.length === 0) return 0;
  const t = signalements.value.filter(s => s.statut === 'termine').length;
  return Math.round((t / signalements.value.length) * 100);
});

/* =========================
   🗺️ Carte & Formulaire
   ========================= */
let map: L.Map;
let nouveauMarker: L.Marker | null = null;

const showForm = ref(false);
const positionTemp = ref<{ lat: number; lng: number } | null>(null);

const form = ref({
  statut: 'nouveau',
  surface: 0,
  budget: 0
});

function activerSignalement() {
  alert('Cliquez sur la carte pour choisir la position');
}

function validerSignalement() {
  if (!positionTemp.value) return;

  signalements.value.push({
    lat: positionTemp.value.lat,
    lng: positionTemp.value.lng,
    statut: form.value.statut,
    surface: form.value.surface,
    budget: form.value.budget
  });

  sauvegarderLocal();

  showForm.value = false;
  form.value = { statut: 'nouveau', surface: 0, budget: 0 };
  positionTemp.value = null;

  afficherMarkers();
}

function afficherMarkers() {
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });

  signalements.value.forEach(s => {
    L.marker([s.lat, s.lng]).addTo(map);
  });
}

onMounted(() => {
  chargerLocal();

  map = L.map('map').setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  afficherMarkers();

  map.on('click', (e: any) => {
    positionTemp.value = e.latlng;
    showForm.value = true;

    if (nouveauMarker) map.removeLayer(nouveauMarker);
    nouveauMarker = L.marker(e.latlng).addTo(map);
  });
});
</script>

<style scoped>
.recap {
  padding: 12px;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
}

.form {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

#map {
  height: calc(100vh - 360px);
  width: 100%;
}
</style>
