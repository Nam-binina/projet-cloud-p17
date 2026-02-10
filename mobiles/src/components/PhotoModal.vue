<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Photo</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="photo-modal-content">
      <img v-if="photo" :src="photo.url" class="full-photo" />
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/vue';

defineProps<{
  isOpen: boolean;
  photo: any | null;
}>();
</script>

<style scoped>
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
</style>
