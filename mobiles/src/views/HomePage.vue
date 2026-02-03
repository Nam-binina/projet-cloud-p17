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

        <!-- Panel de détails du signalement sélectionné -->
        <div class="details-panel" v-if="selectedSignalement">
          <div class="details-header">
            <h3>Détails du signalement</h3>
            <ion-button fill="clear" size="small" @click="closeDetails">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </div>
          
          <div class="details-content">
            <p><strong>Statut:</strong> {{ selectedSignalement.status }}</p>
            <p><strong>Description:</strong> {{ selectedSignalement.description }}</p>
            <p><strong>Entreprise:</strong> {{ selectedSignalement.entreprise ?? 'N/A' }}</p>
            <p><strong>Surface:</strong> {{ selectedSignalement.surface }} m²</p>
            <p><strong>Budget:</strong> {{ selectedSignalement.budget }} Ar</p>
            <p><strong>Date:</strong> {{ formatDate(selectedSignalement.date) }}</p>
          </div>

          <!-- Section Photos -->
          <div class="photos-section">
            <h4>
              <ion-icon :icon="imagesOutline"></ion-icon>
              Photos ({{ signalementPhotos.length }})
            </h4>
            
            <div v-if="loadingPhotos" class="loading-photos">
              <ion-spinner name="crescent"></ion-spinner>
              <span>Chargement des photos...</span>
            </div>

            <div v-else-if="signalementPhotos.length === 0" class="no-photos">
              <ion-icon :icon="imageOutline"></ion-icon>
              <span>Aucune photo pour ce signalement</span>
            </div>

            <div v-else class="photos-grid">
              <div 
                v-for="(photo, index) in signalementPhotos" 
                :key="photo.id || index" 
                class="photo-item"
                @click="openPhotoModal(photo)"
              >
                <img :src="photo.url" :alt="'Photo ' + (index + 1)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal pour afficher la photo en grand -->
      <ion-modal :is-open="showPhotoModal" @didDismiss="showPhotoModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Photo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showPhotoModal = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="photo-modal-content">
          <img v-if="selectedPhoto" :src="selectedPhoto.url" class="full-photo" />
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon, IonSegment, IonSegmentButton, IonModal, IonSpinner } from '@ionic/vue';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { getFirestore, collection, addDoc, Timestamp, GeoPoint, query, where, getDocs } from 'firebase/firestore';
import { useCollection, useCurrentUser } from 'vuefire';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseAuth } from 'vuefire';
import { locateOutline, closeOutline, imagesOutline, imageOutline } from 'ionicons/icons';
import { logOutOutline, eyeOutline, eyeOffOutline, refreshOutline } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useRouter } from 'vue-router';

const auth = useFirebaseAuth();
const router = useRouter();
const showRecap = ref(true); // Affiche le recap par défaut
const notificationPermissionGranted = ref(false);
const lastStatuses = ref<Record<string, string>>({});

/* =========================
    Données
   ========================= */
const db = getFirestore();
const currentUser = useCurrentUser();

type FilterMode = 'tous' | 'moi';
const filterMode = ref<FilterMode>('tous');

//  Récupération réactive des signalements depuis Firebase
const signalements = useCollection(collection(db, 'signalements'));

const filteredSignalements = computed(() => {
  const list = signalements.value || [];
  if (filterMode.value === 'tous') return list;
  const uid = currentUser.value?.uid;
  if (!uid) return [];
  return list.filter((s: any) => s.user_id === uid);
});

/* =========================
    Signalement sélectionné et photos
   ========================= */
const selectedSignalement = ref<any>(null);
const signalementPhotos = ref<any[]>([]);
const loadingPhotos = ref(false);
const showPhotoModal = ref(false);
const selectedPhoto = ref<any>(null);

// Fonction pour récupérer les photos d'un signalement
async function fetchPhotosForSignalement(signalementId: string) {
  loadingPhotos.value = true;
  signalementPhotos.value = [];
  
  try {
    // Requête pour récupérer les photos liées au signalement
    const photosQuery = query(
      collection(db, 'photos'),
      where('signalement_id', '==', signalementId)
    );
    
    const querySnapshot = await getDocs(photosQuery);
    
    signalementPhotos.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    signalementPhotos.value = [];
  } finally {
    loadingPhotos.value = false;
  }
}

// Fonction pour sélectionner un signalement
function selectSignalement(signalement: any) {
  selectedSignalement.value = signalement;
  // Récupérer les photos associées
  if (signalement.id) {
    fetchPhotosForSignalement(signalement.id);
  }
}

// Fonction pour fermer les détails
function closeDetails() {
  selectedSignalement.value = null;
  signalementPhotos.value = [];
}

// Fonction pour ouvrir le modal photo
function openPhotoModal(photo: any) {
  selectedPhoto.value = photo;
  showPhotoModal.value = true;
}

// Fonction pour formater la date
function formatDate(date: any): string {
  if (!date) return 'N/A';
  if (date.toDate) {
    return date.toDate().toLocaleDateString('fr-FR');
  }
  return 'N/A';
}

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

const statusLabels: Record<string, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  termine: 'Terminé'
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
        
        // Popup avec infos du signalement et bouton pour voir les détails
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <b>Statut:</b> ${s.status}<br>
          <b>Surface:</b> ${s.surface} m²<br>
          <b>Entreprise:</b> ${s.entreprise ?? 'N/A'}<br>
          <b>Description:</b> ${s.description}<br>
          <b>Budget:</b> ${s.budget} Ar<br>
          <b>Date:</b> ${s.date?.toDate?.().toLocaleDateString() || 'N/A'}
        `;
        
        const detailsBtn = document.createElement('button');
        detailsBtn.textContent = '📷 Voir détails & photos';
        detailsBtn.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: #3880ff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;';
        detailsBtn.addEventListener('click', () => {
          selectSignalement(s);
        });
        
        popupContent.appendChild(detailsBtn);
        marker.bindPopup(popupContent);
        
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

    map.setView([lat, lng], 16);

    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Moi");
  } catch (e) {
    console.error("Localisation impossible:", e);
    // fallback : ne rien casser, garder Antananarivo
  } finally {
    isLocating.value = false;
  }
}

function formatStatusLabel(status: string) {
  return statusLabels[status as keyof typeof statusLabels] || status;
}

async function initLocalNotifications() {
  try {
    const existingPermission = await LocalNotifications.checkPermissions();
    if (existingPermission.display === 'granted') {
      notificationPermissionGranted.value = true;
      return;
    }

    const requestedPermission = await LocalNotifications.requestPermissions();
    notificationPermissionGranted.value = requestedPermission.display === 'granted';
  } catch (error) {
    console.warn('Impossible de vérifier les permissions de notification locale:', error);
    notificationPermissionGranted.value = false;
  }
}

async function handleStatusChangeNotifications(newSignalements: any[]) {
  const updatedStatuses: Record<string, string> = {};
  if (!Array.isArray(newSignalements)) {
    lastStatuses.value = updatedStatuses;
    return;
  }

  const notificationsPayload: Array<{ id: number; title: string; body: string }> = [];

  newSignalements.forEach((signalement: any) => {
    const signalementId = signalement?.id || signalement?.__id || signalement?.docId || signalement?.uid;
    const currentStatus = signalement?.status;

    if (!signalementId || !currentStatus) return;

    updatedStatuses[signalementId] = currentStatus;

    if (!currentUser.value || signalement.user_id !== currentUser.value.uid) return;

    const previousStatus = lastStatuses.value[signalementId];
    if (previousStatus && previousStatus !== currentStatus) {
      const label = signalement.description ? `"${signalement.description}"` : 'Un signalement';
      notificationsPayload.push({
        id: Date.now() + notificationsPayload.length,
        title: 'Statut mis à jour',
        body: `${label} : ${formatStatusLabel(previousStatus)} → ${formatStatusLabel(currentStatus)}`
      });
    }
  });

  lastStatuses.value = updatedStatuses;

  if (!notificationPermissionGranted.value || notificationsPayload.length === 0) return;

  try {
    await LocalNotifications.schedule({
      notifications: notificationsPayload.map((notif) => ({
        id: notif.id,
        title: notif.title,
        body: notif.body,
        schedule: { allowWhileIdle: true }
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la planification de la notification locale:', error);
  }
}

onMounted(() => {
  initLocalNotifications();
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
watch([signalements, filterMode], () => afficherMarkers(), { deep: true });

watch(signalements, (newVal) => {
  handleStatusChangeNotifications(newVal || []);
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

/* Panel de détails du signalement */
.details-panel {
  width: 380px;
  flex-shrink: 0;
  background: #ffffff;
  border-left: 1px solid #ddd;
  padding: 16px;
  overflow-y: auto;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.details-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.details-content {
  margin-bottom: 20px;
}

.details-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

/* Section Photos */
.photos-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.photos-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.photos-section h4 ion-icon {
  font-size: 20px;
  color: #3880ff;
}

.loading-photos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #666;
}

.no-photos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #999;
  text-align: center;
}

.no-photos ion-icon {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #eee;
  transition: all 0.2s ease;
}

.photo-item:hover {
  border-color: #3880ff;
  transform: scale(1.02);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Modal photo */
.photo-modal-content {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.full-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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