<template>
  <div class="auth-shell">
    <div class="hero">
      <div class="logo-box">
        <ion-icon :icon="warningOutline" class="main-icon"></ion-icon>
      </div>
      <h1>Mobile Signal</h1>
      <p>Connectez-vous pour signaler et suivre vos interventions.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Connexion</h2>
        <p>Accédez à votre espace sécurisé</p>
      </div>

      <div class="input-group">
        <ion-label class="custom-label">Email</ion-label>
        <ion-item lines="none" class="field">
          <ion-icon slot="start" :icon="mailOutline"></ion-icon>
          <ion-input
            type="email"
            v-model="localEmail"
            placeholder="exemple@email.com"
            clear-input>
          </ion-input>
        </ion-item>
      </div>

      <div class="input-group">
        <ion-label class="custom-label">Mot de passe</ion-label>
        <ion-item lines="none" class="field">
          <ion-icon slot="start" :icon="lockClosedOutline"></ion-icon>
          <ion-input
            type="password"
            v-model="localPassword"
            placeholder="••••••••">
          </ion-input>
        </ion-item>
      </div>

      <ion-button
        expand="block"
        shape="round"
        class="cta"
        :disabled="isLoading"
        @click="$emit('submit')">
        <ion-spinner name="crescent" v-if="isLoading"></ion-spinner>
        <span v-else>Se connecter</span>
      </ion-button>

      <div v-if="errorMessage" class="error-box">
        <ion-icon :icon="alertCircleOutline"></ion-icon>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/vue';
import {
  mailOutline,
  lockClosedOutline,
  warningOutline,
  alertCircleOutline
} from 'ionicons/icons';

const props = defineProps<{
  email: string;
  password: string;
  isLoading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits(['update:email', 'update:password', 'submit']);

const localEmail = ref('');
const localPassword = ref('');

watch(() => props.email, (val) => {
  localEmail.value = val || '';
}, { immediate: true });

watch(() => props.password, (val) => {
  localPassword.value = val || '';
}, { immediate: true });

watch(localEmail, (val) => emit('update:email', val));
watch(localPassword, (val) => emit('update:password', val));

</script>

<style scoped>
.auth-shell {
  width: min(400px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.hero {
  color: #FFD700;
  text-align: center;
  margin-bottom: 10px;
}

.main-icon {
  font-size: 75px;
  color: #FFD700;
}

.hero h1 {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 10px 0 5px;
  font-size: 28px;
  color: #1a1a1a;
}

.hero p {
  margin: 0;
  font-weight: 600;
  opacity: 0.85;
  font-size: 14px;
  color: #555;
}

.card {
  background: #ffffff;
  border-radius: 24px;
  padding: 30px 25px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

.card-header h2 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 800;
}

.card-header p {
  margin: 0 0 20px 0;
  color: #555;
  font-size: 14px;
}

.input-group {
  margin-bottom: 14px;
}

.custom-label {
  font-weight: 700;
  margin-bottom: 6px;
  display: block;
}

.field {
  border: 1px solid #f0e6cc;
  border-radius: 12px;
  --padding-start: 8px;
  background: #fffdf6;
}

.cta {
  margin-top: 10px;
  --background: #FFD700;
  --color: #1a1a1a;
  box-shadow: 0 8px 15px rgba(255, 215, 0, 0.18);
}

.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(230, 57, 70, 0.1);
  color: #e63946;
  margin-top: 12px;
  font-size: 13px;
}
</style>
