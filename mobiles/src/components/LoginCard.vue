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
  width: min(420px, 92vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.hero {
  text-align: center;
  margin-bottom: 5px;
}

.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-icon {
  font-size: 80px;
  color: #1a1a1a;
}

.hero h1 {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 12px 0 6px;
  font-size: 28px;
  color: #1a1a1a;
}

.hero p {
  margin: 0;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px 28px;
  border: 2.5px solid #1a1a1a;
  box-shadow: none;
  width: 100%;
}

.card-header {
  text-align: center;
  margin-bottom: 22px;
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 800;
  color: #1a1a1a;
}

.card-header p {
  margin: 0;
  color: #4caf50;
  font-size: 13px;
  font-weight: 500;
}

.input-group {
  margin-bottom: 18px;
}

.custom-label {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
  color: #1a1a1a;
}

.field {
  border: 1.5px solid #ccc;
  border-radius: 12px;
  --padding-start: 8px;
  --background: #fff;
  background: #fff;
}

.field ion-icon {
  color: #555;
}

.cta {
  margin-top: 14px;
  --background: #e53935;
  --color: #ffffff;
  --background-hover: #c62828;
  --border-radius: 30px;
  font-weight: 800;
  font-size: 15px;
  height: 52px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
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
