<template>
  <div class="details-panel" v-if="signalement">
    <div class="details-header">
      <h3>Détails du signalement</h3>
      <ion-button fill="clear" size="small" @click="$emit('close')">
        <ion-icon :icon="closeOutline"></ion-icon>
      </ion-button>
    </div>

    <div class="details-content">
      <p><strong>Statut:</strong> {{ signalement.status }}</p>
      <p><strong>Description:</strong> {{ signalement.description }}</p>
      <p><strong>Entreprise:</strong> {{ signalement.entreprise ?? 'N/A' }}</p>
      <p><strong>Surface:</strong> {{ signalement.surface }} m²</p>
      <p><strong>Budget:</strong> {{ signalement.budget }} Ar</p>
      <p><strong>Date:</strong> {{ formatDate(signalement.date) }}</p>
    </div>

    <div class="photos-section">
      <h4>
        <ion-icon :icon="imagesOutline"></ion-icon>
        Photos ({{ photos.length }})
      </h4>

      <div v-if="loadingPhotos" class="loading-photos">
        <ion-spinner name="crescent"></ion-spinner>
        <span>Chargement des photos...</span>
      </div>

      <div v-else-if="photos.length === 0" class="no-photos">
        <ion-icon :icon="imageOutline"></ion-icon>
        <span>Aucune photo pour ce signalement</span>
      </div>

      <div v-else class="photos-grid">
        <div
          v-for="(photo, index) in photos"
          :key="photo.id || index"
          class="photo-item"
          @click="$emit('open-photo', photo)"
        >
          <img :src="photo.url" :alt="'Photo ' + (index + 1)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonSpinner } from '@ionic/vue';
import { closeOutline, imagesOutline, imageOutline } from 'ionicons/icons';

defineProps<{
  signalement: any | null;
  photos: any[];
  loadingPhotos: boolean;
  formatDate: (date: any) => string;
}>();
</script>

<style scoped>
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
</style>
