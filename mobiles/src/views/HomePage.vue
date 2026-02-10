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
      <RecapPanel
        :show-recap="showRecap"
        :total-signalements="totalSignalements"
        :total-surface="totalSurface"
        :total-budget="totalBudget"
        :avancement="avancement"
        @signaler="activerSignalement"
        @toggle="toggleRecap"
      />

      <!-- Main container: Carte + Formulaire side-by-side -->
      <div class="container">
        <!--  Carte -->
        <div id="map" class="map-container">
          <MapOverlayControls :show-recap="showRecap" @toggle="toggleRecap" />
        </div>

        <!--  Formulaire à droite -->
        <SignalementFormPanel
          :show="showForm"
          :form="form"
          @update:form="updateForm"
          @update:photos="selectedFiles = $event"
          @submit="validerSignalement"
          @cancel="showForm = false"
        />

        <!-- Panel de détails du signalement sélectionné -->
        <SignalementDetailsPanel
          :signalement="selectedSignalement"
          :photos="signalementPhotos"
          :loading-photos="loadingPhotos"
          :format-date="formatDate"
          @close="closeDetails"
          @open-photo="openPhotoModal"
        />
      </div>

      <PhotoModal :is-open="showPhotoModal" :photo="selectedPhoto" @close="showPhotoModal = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonLabel, IonIcon, IonSegment, IonSegmentButton } from '@ionic/vue';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { getFirestore, collection, addDoc, Timestamp, GeoPoint, query, where, getDocs, Blob } from 'firebase/firestore';
import { useCollection, useCurrentUser } from 'vuefire';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseAuth } from 'vuefire';
import { locateOutline } from 'ionicons/icons';
import { logOutOutline, refreshOutline } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useRouter } from 'vue-router';
import RecapPanel from '../components/RecapPanel.vue';
import MapOverlayControls from '../components/MapOverlayControls.vue';
import SignalementFormPanel from '../components/SignalementFormPanel.vue';
import SignalementDetailsPanel from '../components/SignalementDetailsPanel.vue';
import PhotoModal from '../components/PhotoModal.vue';

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
const selectedFiles = ref<File[]>([]);
const photoObjectUrls = ref<string[]>([]);

// Fonction pour récupérer les photos d'un signalement
async function fetchPhotosForSignalement(signalementId: string) {
  loadingPhotos.value = true;
  signalementPhotos.value = [];
  photoObjectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoObjectUrls.value = [];
  
  try {
    // Requête pour récupérer les photos liées au signalement
    const photosQuery = query(
      collection(db, 'photos'),
      where('signalement_id', '==', signalementId)
    );
    
    const querySnapshot = await getDocs(photosQuery);
    
    signalementPhotos.value = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      const blobValue = data?.photo_blob;
      let url = null;
      if (blobValue) {
        const bytes = blobValue.toBytes ? blobValue.toBytes() : blobValue;
        const objectUrl = URL.createObjectURL(new window.Blob([bytes]));
        photoObjectUrls.value.push(objectUrl);
        url = objectUrl;
      }
      return { id: doc.id, ...data, url };
    });
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
  photoObjectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoObjectUrls.value = [];
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

function toggleRecap() {
  showRecap.value = !showRecap.value;
}

function updateForm(nextForm: typeof form.value) {
  form.value = nextForm;
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
    const signalementRef = await addDoc(collection(db, 'signalements'), {
      budget: form.value.budget,
      date: Timestamp.now(),
      description: form.value.description,
      entreprise: form.value.entreprise || null, // N/A si vide
      position: new GeoPoint(positionTemp.value.lat, positionTemp.value.lng),
      status: form.value.statut,
      surface: form.value.surface,
      user_id: currentUser.value.uid
    });

    if (selectedFiles.value.length > 0) {
      await uploadPhotosToFirestore(signalementRef.id, selectedFiles.value);
    }

    // reset
    showForm.value = false;
    form.value = { statut: 'nouveau', description: '', entreprise: '', surface: 0, budget: 0 };
    positionTemp.value = null;

    if (nouveauMarker) {
      map.removeLayer(nouveauMarker);
      nouveauMarker = null;
    }

    selectedFiles.value = [];
  } catch (error) {
    console.error('Erreur lors de l\'ajout du signalement:', error);
    alert('Erreur lors de l\'enregistrement');
  }
}

async function uploadPhotosToFirestore(signalementId: string, files: File[]) {
  const uploads = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const blob = Blob.fromBytes(new Uint8Array(arrayBuffer));
    return addDoc(collection(db, 'photos'), {
      signalement_id: signalementId,
      filename: file.name,
      content_type: file.type || 'image/jpeg',
      photo_blob: blob,
      created_at: Timestamp.now()
    });
  });
  await Promise.all(uploads);
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
  display: block;
}
</style>