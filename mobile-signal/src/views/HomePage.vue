<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Signalements</ion-title>

        <ion-buttons slot="end">
          <ion-button color="primary" @click="reloadPage">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button color="tertiary" @click="centrerSurMoi" :disabled="isLocating">
            <ion-icon slot="start" :icon="locateOutline"></ion-icon>
            <span>Me localiser</span>
          </ion-button>
          <ion-button color="danger" @click="handleLogout">
            Déconnexion
            <ion-icon slot="end" :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- UI Filtre : Tous / Mes signalements -->
      <ion-toolbar>
        <ion-segment v-model="filterMode">
          <ion-segment-button value="tous">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="moi">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!--  Récap -->
      <div class="recap" v-if="showRecap">
        <p><strong>Total :</strong> {{ totalSignalements }}</p>
        <p><strong>Surface :</strong> {{ totalSurface }} m²</p>
        <p><strong>Budget :</strong> {{ totalBudget }} Ar</p>
        <p><strong>Avancement :</strong> {{ avancement }} %</p>

        <ion-button expand="block" color="primary" @click="activerSignalement">
           Signaler
        </ion-button>

        <ion-button expand="block" color="light" @click="showRecap = !showRecap" title="Masquer récapitulatif" class="hide-recap-btn">
          <ion-icon slot="start" :icon="eyeOffOutline"></ion-icon>
          <span>Masquer recap</span>
        </ion-button>
      </div>

      <!-- Main container: Carte + Formulaire side-by-side -->
      <div class="container">
        <!--  Carte -->
        <div id="map" class="map-container">
          <!-- Légende visible par défaut -->
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

          <!-- Bouton Voir recap en bas à gauche -->
          <button class="see-recap-btn" @click="showRecap = !showRecap" :title="showRecap ? 'Masquer récapitulatif' : 'Afficher récapitulatif'">
            <ion-icon :icon="showRecap ? eyeOffOutline : eyeOutline"></ion-icon>
            <span>{{ showRecap ? 'Masquer recap' : 'Voir recap' }}</span>
          </button>
        </div>

        <!--  Formulaire à droite -->
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
            <ion-label position="floating">Entreprise concernée</ion-label>
            <ion-input v-model="form.entreprise" placeholder="Nom de l'entreprise"></ion-input>
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
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonSegment,
  IonSegmentButton
} from '@ionic/vue';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { getFirestore, collection, addDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { useCollection, useCurrentUser } from 'vuefire';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseAuth } from 'vuefire';
import { logOutOutline, eyeOutline, eyeOffOutline, refreshOutline, locateOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const auth = useFirebaseAuth();
const router = useRouter();
const showRecap = ref(true); // Affiche le recap par défaut

/* =========================
    Données
   ========================= */
const db = getFirestore();
const currentUser = useCurrentUser();

const filterMode = ref<string>('tous'); // 'tous' | 'moi'

//  Récupération réactive des signalements depuis Firebase
const signalements = useCollection(collection(db, 'signalements'));

const filteredSignalements = computed(() => {
  if (filterMode.value === 'moi') {
    // Si pas connecté et filtreMode='moi' => []
    if (!currentUser.value) return [];
    return (signalements.value || []).filter((s: any) => s.user_id === currentUser.value?.uid);
  }
  // mode 'tous'
  return signalements.value || [];
});

/* =========================
    Récap
   ========================= */
const totalSignalements = computed(() => filteredSignalements.value.length);

const totalSurface = computed(() =>
  filteredSignalements.value.reduce((s: number, x: any) => s + (x.surface || 0), 0)
);

const totalBudget = computed(() =>
  filteredSignalements.value.reduce((s: number, x: any) => s + (x.budget || 0), 0)
);

const avancement = computed(() => {
  if (filteredSignalements.value.length === 0) return 0;
  const t = filteredSignalements.value.filter((s: any) => s.status === 'termine').length;
  return Math.round((t / filteredSignalements.value.length) * 100);
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

function reloadPage() {
  window.location.reload();
}

/* =========================
    Carte & Formulaire
   ========================= */
let map: L.Map;
let nouveauMarker: L.Marker | null = null;
let userMarker: L.Marker | null = null;
const isLocating = ref(false);

const showForm = ref(false);
const positionTemp = ref<{ lat: number; lng: number } | null>(null);

const form = ref({
  statut: 'nouveau',
  description: '',
  entreprise: '',
  surface: 0,
  budget: 0
});

//  Icônes personnalisées par statut
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

function afficherFormulaireSignalement() {
  showForm.value = true;
}

async function validerSignalement() {
  if (!positionTemp.value || !currentUser.value) return;

  try {
    await addDoc(collection(db, 'signalements'), {
      budget: form.value.budget,
      date: Timestamp.now(),
      description: form.value.description,
      entreprise: form.value.entreprise || null, // N/A si vide
      position: new GeoPoint(positionTemp.value.lat, positionTemp.value.lng),
      status: form.value.statut,
      surface: form.value.surface,
      user_id: currentUser.value.uid
    });

    // reset
    showForm.value = false;
    form.value = { statut: 'nouveau', description: '', entreprise: '', surface: 0, budget: 0 };
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
    if (layer instanceof L.Marker && layer !== userMarker && layer !== nouveauMarker) map.removeLayer(layer);
  });

  // Ajouter les markers depuis Firebase avec couleur selon status
  if (filteredSignalements.value) {
    filteredSignalements.value.forEach((s: any) => {
      if (s.position && s.position.latitude && s.position.longitude) {
        const icon = markerIcons[s.status as keyof typeof markerIcons] || markerIcons.nouveau;
        const marker = L.marker([s.position.latitude, s.position.longitude], { icon });
        
        // Popup avec infos du signalement
        marker.bindPopup(`
          <b>Statut:</b> ${s.status}<br>
          <b>Surface:</b> ${s.surface} m²<br>
          <b>Entreprise:</b> ${s.entreprise || 'N/A'}<br>
          <b>Description:</b> ${s.description}<br>
          <b>Budget:</b> ${s.budget} Ar<br>
          <b>Date:</b> ${s.date?.toDate?.().toLocaleDateString() || 'N/A'}
        `);
        
        marker.addTo(map);
      }
    });
  }
}

async function centrerSurMoi() {
  if (!map) return;

  isLocating.value = true;
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Centre la carte sur l'utilisateur
    map.setView([lat, lng], 16);

    // Marker "Moi"
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Moi").openPopup();
  } catch (e) {
    console.error("Localisation impossible :", e);
    // Fallback : on ne casse rien, on laisse Antananarivo
  } finally {
    isLocating.value = false;
  }
}

onMounted(() => {
  // Limiter la carte à la région d'Antananarivo
  const anananarivo_bounds = L.latLngBounds(
    [-19.2, 47.3], // Sud-Ouest
    [-18.7, 47.8]  // Nord-Est
  );

  map = L.map('map', {
    maxBounds: anananarivo_bounds,
    maxBoundsViscosity: 1.0, // Empêche le déplacement en dehors des limites
    minZoom: 11, // Zoom minimum pour voir toute la région
    maxZoom: 17  // Zoom maximum permis
  }).setView([-18.879, 47.508], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Essayer de se centrer sur l'utilisateur
  centrerSurMoi();

  setTimeout(() => {
    map.invalidateSize();
  }, 400);

  afficherMarkers();

  map.on('click', (e: any) => {
    positionTemp.value = e.latlng;

    if (nouveauMarker) map.removeLayer(nouveauMarker);
    
    // Créer un marker avec un popup "Signale" cliquable
    nouveauMarker = L.marker(e.latlng).addTo(map);
    
    // Créer un popup personnalisé avec un lien cliquable
    const popupContent = document.createElement('div');
    popupContent.style.cursor = 'pointer';
    popupContent.style.padding = '8px 12px';
    popupContent.style.textAlign = 'center';
    popupContent.style.fontWeight = 'bold';
    popupContent.style.color = '#FF3838';
    popupContent.textContent = 'Signale';
    
    // Ajouter le popup au marker
    nouveauMarker.bindPopup(popupContent);
    nouveauMarker.openPopup();
    
    // Ajouter l'event listener pour afficher le formulaire au clic
    popupContent.addEventListener('click', afficherFormulaireSignalement);
  });
});

//  Mettre à jour les markers quand les données Firebase changent ou le filtre change
watch([signalements, filterMode], () => {
  if (map) afficherMarkers();
});
</script>

<style scoped>
/* Permet à ion-content de flex correctement */
:deep(ion-content) {
  --padding-bottom: 0;
  --padding-top: 0;
  display: flex;
  flex-direction: column;
}

.recap {
  padding: 8px 12px;
  background: linear-gradient(135deg, #eae366 0%, #e2af2f 100%);
  border-bottom: 2px solid #555;
  flex-shrink: 0;
  z-index: 10;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.recap p {
  margin: 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
}
:deep(ion-button[color="light"]) {
  --color: #FFD700 !important;
  --background: rgba(255, 215, 0, 0.15) !important;
  --border-radius: 8px !important;
  font-weight: 600 !important;
  --box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3) !important;
  border: 1px solid rgba(255, 215, 0, 0.4) !important;
}

:deep(ion-button[color="light"]) ion-icon {
  font-size: 24px !important;
  color: #FFD700 !important;
}

:deep(ion-button[color="danger"]) {
  background: white !important;
  --color: #FF3838 !important;
  --border-radius: 8px !important;
  font-weight: 600 !important;
  padding: 8px 12px !important;
  /* border: 1px solid rgba(255, 56, 56, 0.3) !important; */
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(ion-button[color="danger"]) ion-icon {
  color: #FF3838 !important;
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

/* Styles pour la légende de la carte */
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

/* Bouton Voir recap flottant */
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