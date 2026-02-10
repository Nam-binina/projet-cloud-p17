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

        <div v-if="filterMode === 'moi'" class="list-panel">
          <div class="list-header">Mes signalements ({{ mySignalements.length }})</div>

          <div v-if="mySignalements.length === 0" class="list-empty">
            Aucun signalement trouve.
          </div>

          <button
            v-else
            v-for="signalement in mySignalements"
            :key="getSignalementId(signalement)"
            class="list-item"
            @click="focusSignalement(signalement)"
          >
            <div class="list-title">{{ signalement.description || 'Signalement sans description' }}</div>
            <div class="list-meta">
              <span>{{ formatStatusLabel(signalement.status) }}</span>
              <span>•</span>
              <span>{{ formatDate(signalement.date) }}</span>
            </div>
          </button>
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
          :can-add-photos="canAddPhotos"
          :is-uploading="isUploadingPhotos"
          :upload-error="photoUploadError"
          @close="closeDetails"
          @open-photo="openPhotoModal"
          @add-photos="handleAddPhotos"
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
import { getFirestore, collection, addDoc, query, where, getDocs, Bytes } from 'firebase/firestore';
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
const MAX_PHOTO_SIZE_BYTES = 900 * 1024;

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

const mySignalements = computed(() => {
  const list = signalements.value || [];
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
const isUploadingPhotos = ref(false);
const photoUploadError = ref('');

const canAddPhotos = computed(() => {
  const uid = currentUser.value?.uid;
  const selected = selectedSignalement.value;
  return Boolean(uid && selected && selected.user_id === uid);
});

function getSignalementId(signalement: any) {
  return signalement?.id || signalement?.__id || signalement?.docId || signalement?.uid || null;
}

async function fetchPhotosForSignalement(signalementId: string) {
  loadingPhotos.value = true;
  signalementPhotos.value = [];
  photoObjectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoObjectUrls.value = [];
  
  try {
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
        const bytes = blobValue.toUint8Array ? blobValue.toUint8Array() : blobValue;
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

function selectSignalement(signalement: any) {
  selectedSignalement.value = signalement;
  const signalementId = getSignalementId(signalement);
  if (signalementId) {
    fetchPhotosForSignalement(signalementId);
  }
}

function closeDetails() {
  selectedSignalement.value = null;
  signalementPhotos.value = [];
  photoObjectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  photoObjectUrls.value = [];
  photoUploadError.value = '';
}

function openPhotoModal(photo: any) {
  selectedPhoto.value = photo;
  showPhotoModal.value = true;
}

async function handleAddPhotos(files: File[]) {
  if (!selectedSignalement.value || files.length === 0) return;
  const signalementId = getSignalementId(selectedSignalement.value);
  if (!signalementId) return;

  try {
    photoUploadError.value = '';
    isUploadingPhotos.value = true;
    await uploadPhotosToFirestore(signalementId, files);
    await fetchPhotosForSignalement(signalementId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout des photos. Veuillez reessayer.';
    console.error('Erreur lors de l\'ajout des photos:', error);
    photoUploadError.value = message;
  } finally {
    isUploadingPhotos.value = false;
  }
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  if (date.toDate) {
    return date.toDate().toLocaleDateString('fr-FR');
  }
  return 'N/A';
}

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

let map: L.Map;
let nouveauMarker: L.Marker | null = null;
let userMarker: L.Marker | null = null;
const mapMarkers = new Map<string, L.Marker>();
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
const markerIconBase = {
  red: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  orange: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  green: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

// Mapping statut → icône (supporte les deux formats : minuscule et majuscule)
const markerIcons: Record<string, L.Icon> = {
  nouveau: markerIconBase.red,
  'Nouveau': markerIconBase.red,
  en_cours: markerIconBase.orange,
  'En cours': markerIconBase.orange,
  termine: markerIconBase.green,
  'Terminé': markerIconBase.green
};

const statusLabels: Record<string, string> = {
  nouveau: 'Nouveau',
  'Nouveau': 'Nouveau',
  en_cours: 'En cours',
  'En cours': 'En cours',
  termine: 'Terminé',
  'Terminé': 'Terminé'
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
    // Format attendu par Firebase (map, pas GeoPoint)
    const statusMap: Record<string, string> = {
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      termine: 'Terminé'
    };

    const signalementRef = await addDoc(collection(db, 'signalements'), {
      budget: Number(form.value.budget),
      date: new Date().toISOString(),
      description: form.value.description,
      entreprise: form.value.entreprise || '',
      photos: [],
      position: {
        latitude: positionTemp.value.lat,
        longitude: positionTemp.value.lng
      },
      status: statusMap[form.value.statut] || 'Nouveau',
      surface: Number(form.value.surface),
      user_id: currentUser.value.uid
    });

    if (selectedFiles.value.length > 0) {
      await uploadPhotosToFirestore(signalementRef.id, selectedFiles.value);
    }

    showForm.value = false;
    form.value = { statut: 'nouveau', description: '', entreprise: '', surface: 0, budget: 0 };
    positionTemp.value = null;

    if (nouveauMarker) {
      map.removeLayer(nouveauMarker);
      nouveauMarker = null;
    }

    selectedFiles.value = [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement';
    console.error('Erreur lors de l\'ajout du signalement:', error);
    alert(message);
  }
}

async function uploadPhotosToFirestore(signalementId: string, files: File[]) {
  const oversizedFile = files.find((file) => file.size > MAX_PHOTO_SIZE_BYTES);
  if (oversizedFile) {
    throw new Error(`La photo "${oversizedFile.name}" depasse la taille limite de ${Math.round(MAX_PHOTO_SIZE_BYTES/1024)} KB.`);
  }

  const uploads = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const blob = Bytes.fromUint8Array(new Uint8Array(arrayBuffer));
    return addDoc(collection(db, 'photos'), {
      signalement_id: signalementId,
      filename: file.name,
      content_type: file.type || 'image/jpeg',
      photo_blob: blob,
      created_at: new Date().toISOString()
    });
  });
  await Promise.all(uploads);
}

function afficherMarkers() {
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker && layer !== userMarker && layer !== nouveauMarker) map.removeLayer(layer);
  });

  mapMarkers.clear();

  if (filteredSignalements.value) {
    filteredSignalements.value.forEach((s: any) => {
      if (s.position && s.position.latitude && s.position.longitude) {
        const icon = markerIcons[s.status] || markerIconBase.red;
        const marker = L.marker([s.position.latitude, s.position.longitude], { icon });
        
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <b>Statut:</b> ${s.status}<br>
          <b>Surface:</b> ${s.surface} m²<br>
          <b>Entreprise:</b> ${s.entreprise ?? 'N/A'}<br>
          <b>Description:</b> ${s.description}<br>
          <b>Budget:</b> ${s.budget} Ar<br>
          <b>Date:</b> ${s.date?.toDate ? s.date.toDate().toLocaleDateString() : (s.date ? new Date(s.date).toLocaleDateString() : 'N/A')}
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

        const signalementId = getSignalementId(s);
        if (signalementId) {
          mapMarkers.set(signalementId, marker);
        }
      }
    });
  }
}

function focusSignalement(signalement: any) {
  selectSignalement(signalement);
  const lat = signalement?.position?.latitude;
  const lng = signalement?.position?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number') {
    map.setView([lat, lng], 16);
  }

  const signalementId = getSignalementId(signalement);
  if (signalementId) {
    const marker = mapMarkers.get(signalementId);
    if (marker) marker.openPopup();
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
    const signalementId = getSignalementId(signalement);
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
  color: black;
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
  display: block;
}

.list-panel {
  width: 280px;
  flex-shrink: 0;
  background: #ffffff;
  border-left: 1px solid #ddd;
  padding: 12px;
  overflow-y: auto;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

.list-header {
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  font-size: 14px;
}

.list-empty {
  color: #888;
  font-size: 13px;
  padding: 10px 4px;
}

.list-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  text-align: left;
  background: #f7f7f7;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}

.list-item:hover {
  border-color: #3880ff;
  background: #f2f7ff;
}

.list-title {
  font-size: 13px;
  font-weight: 700;
  color: #222;
}

.list-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 6px;
}
</style>