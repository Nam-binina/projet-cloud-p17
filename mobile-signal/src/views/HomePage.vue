<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Signalements</ion-title>

        <ion-buttons slot="end">
          <ion-button color="danger" @click="handleLogout">
            Déconnexion
            <ion-icon slot="end" :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!--  R�cap -->
      <div class="recap">
        <p><strong>Total :</strong> {{ totalSignalements }}</p>
        <p><strong>Surface :</strong> {{ totalSurface }} m²</p>
        <p><strong>Budget :</strong> {{ totalBudget }} Ar</p>
        <p><strong>Avancement :</strong> {{ avancement }} %</p>

        <ion-button expand="block" color="primary" @click="activerSignalement">
           Signaler
        </ion-button>
      </div>

      <!-- Main container: Carte + Formulaire side-by-side -->
      <div class="container">
        <!--  Carte -->
        <div id="map" class="map-container"></div>

        <!--  Formulaire � droite -->
        <div class="form" v-if="showForm">
          <h3>Nouveau signalement</h3>
          <ion-item>
            <ion-label>Statut</ion-label>
            <ion-select v-model="form.statut">
              <ion-select-option value="nouveau">Nouveau</ion-select-option>
              <ion-select-option value="en_cours">En cours</ion-select-option>
              <ion-select-option value="termine">Termine</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Description</ion-label>
            <ion-input v-model="form.description" placeholder="Decrivez le probleme"></ion-input>
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
             Valider
          </ion-button>
          <ion-button expand="block" color="medium" @click="showForm = false">
             Annuler
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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
import { getFirestore, collection, addDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { useCollection, useCurrentUser } from 'vuefire';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseAuth } from 'vuefire';
import { logOutOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const auth = useFirebaseAuth();
const router = useRouter();

/* =========================
    Donn�es
   ========================= */
const db = getFirestore();
const currentUser = useCurrentUser();

//  R�cup�ration r�active des signalements depuis Firebase
const signalements = useCollection(collection(db, 'signalements'));

/* =========================
    R�cap
   ========================= */
const totalSignalements = computed(() => signalements.value?.length || 0);

const totalSurface = computed(() =>
  signalements.value?.reduce((s: number, x: any) => s + (x.surface || 0), 0) || 0
);

const totalBudget = computed(() =>
  signalements.value?.reduce((s: number, x: any) => s + (x.budget || 0), 0) || 0
);

const avancement = computed(() => {
  if (!signalements.value || signalements.value.length === 0) return 0;
  const t = signalements.value.filter((s: any) => s.status === 'termine').length;
  return Math.round((t / signalements.value.length) * 100);
});

async function handleLogout() {
  if (auth) {
    try {
      await signOut(auth);
      // Optionnel : Rediriger l'utilisateur vers la page de login après déconnexion
      router.push('/login'); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  }
}

/* =========================
    Carte & Formulaire
   ========================= */
let map: L.Map;
let nouveauMarker: L.Marker | null = null;

const showForm = ref(false);
const positionTemp = ref<{ lat: number; lng: number } | null>(null);

const form = ref({
  statut: 'nouveau',
  description: '',
  surface: 0,
  budget: 0
});

//  Ic�nes personnalis�es par statut
const markerIcons = {
  nouveau: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  en_cours: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  termine: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

function activerSignalement() {
  alert('Cliquez sur la carte pour choisir la position');
}

async function validerSignalement() {
  if (!positionTemp.value || !currentUser.value) return;

  try {
    await addDoc(collection(db, 'signalements'), {
      budget: form.value.budget,
      date: Timestamp.now(),
      descriptiotn: form.value.description,
      position: new GeoPoint(positionTemp.value.lat, positionTemp.value.lng),
      status: form.value.statut,
      surface: form.value.surface,
      user_id: currentUser.value.uid
    });

    // reset
    showForm.value = false;
    form.value = { statut: 'nouveau', description: '', surface: 0, budget: 0 };
    positionTemp.value = null;

    if (nouveauMarker) {
      map.removeLayer(nouveauMarker);
      nouveauMarker = null;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du signalement:', error);
    alert('Erreur lors de l\'enregistrement');
  }
}

function afficherMarkers() {
  // Supprimer tous les markers existants
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });

  // Ajouter les markers depuis Firebase avec couleur selon status
  if (signalements.value) {
    signalements.value.forEach((s: any) => {
      if (s.position && s.position.latitude && s.position.longitude) {
        const icon = markerIcons[s.status as keyof typeof markerIcons] || markerIcons.nouveau;
        const marker = L.marker([s.position.latitude, s.position.longitude], { icon });
        
        // Popup avec infos du signalement
        marker.bindPopup(`
          <b>Statut:</b> ${s.status}<br>
          <b>Surface:</b> ${s.surface} m²<br>
          <b>Budget:</b> ${s.budget} Ar<br>
          <b>Date:</b> ${s.date?.toDate?.().toLocaleDateString() || 'N/A'}
        `);
        
        marker.addTo(map);
      }
    });
  }
}

onMounted(() => {
  map = L.map('map').setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 400);

  afficherMarkers();

  map.on('click', (e: any) => {
    positionTemp.value = e.latlng;
    showForm.value = true;

    if (nouveauMarker) map.removeLayer(nouveauMarker);
    nouveauMarker = L.marker(e.latlng).addTo(map);
  });
});

//  Mettre � jour les markers quand les donn�es Firebase changent
watch(signalements, () => {
  if (map) afficherMarkers();
});
</script>

<style scoped>
/* Permet � ion-content de flex correctement */
:deep(ion-content) {
  --padding-bottom: 0;
  --padding-top: 0;
  display: flex;
  flex-direction: column;
}

.recap {
  padding: 12px;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
  z-index: 10;
}

.recap p {
  margin: 4px 0;
  font-size: 14px;
}

.container {
  display: flex;
  height: 100%; /* S'assure que le container prend toute la place */
  min-height: 500px;
  width: 100%;
}

.map-container {
  flex: 1;
  height: 100%; /* Obligatoire pour que la carte remplisse sa zone */
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  /* Empêche les bugs de débordement */
  display: block; 
}

.form {
  width: 350px;
  flex-shrink: 0;
  background: #ffffff;
  border-left: 1px solid #ddd;
  padding: 16px;
  overflow-y: auto;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.form h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.form ion-item {
  margin-bottom: 12px;
}

.form ion-button {
  margin-top: 8px;
}
</style>
