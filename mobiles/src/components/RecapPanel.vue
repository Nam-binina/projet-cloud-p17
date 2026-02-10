<template>
  <div class="recap" v-if="showRecap">
    <p><strong>Total :</strong> {{ totalSignalements }}</p>
    <p><strong>Surface :</strong> {{ totalSurface }} m²</p>
    <p><strong>Budget :</strong> {{ totalBudget }} Ar</p>
    <p><strong>Avancement :</strong> {{ avancement }} %</p>

    <ion-button expand="block" color="primary" @click="$emit('signaler')">
      Signaler
    </ion-button>

    <ion-button expand="block" color="light" @click="$emit('toggle')" title="Masquer récapitulatif" class="hide-recap-btn">
      <ion-icon slot="start" :icon="eyeOffOutline"></ion-icon>
      <span>Masquer recap</span>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { eyeOffOutline } from 'ionicons/icons';

defineProps<{
  showRecap: boolean;
  totalSignalements: number;
  totalSurface: number;
  totalBudget: number;
  avancement: number;
}>();
</script>

<style scoped>
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
</style>
