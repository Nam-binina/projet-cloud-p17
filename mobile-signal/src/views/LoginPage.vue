<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="center-container">
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
                  v-model="email"
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
                  v-model="password"
                  placeholder="••••••••">
                </ion-input>
              </ion-item>
            </div>

            <ion-button
              expand="block"
              shape="round"
              class="cta"
              :disabled="isLoading"
              @click="onLogin">
              <ion-spinner name="crescent" v-if="isLoading"></ion-spinner>
              <span v-else>Se connecter</span>
            </ion-button>

            <div v-if="errorMessage" class="error-box">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              <span>{{ errorMessage }}</span>
            </div>
          </div>
          
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useCurrentUser } from 'vuefire';
import {
  IonPage,
  IonContent,
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

const router = useRouter();
const currentUser = useCurrentUser();

watch(currentUser, (u) => {
  if (u) router.replace('/home');
});

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function onLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.';
    return;
  }

  const auth = getAuth();
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    router.replace('/home');
  } catch (err: any) {
    errorMessage.value = "Erreur de connexion.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* COULEURS : Fond Jaune (#FFC107), Carte Blanche (#FFFFFF), Accents Noirs (#1a1a1a) et Rouges (#e63946) */

.login-content {
  /* Fond Jaune (style signalisation routière) */
  --background: #FFC107; 
}

.center-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
}

.auth-shell {
  width: min(400px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

/* Hero Section */
.hero {
  /* Texte noir sur fond jaune pour un contraste maximal */
  color: #1a1a1a; 
  text-align: center;
  margin-bottom: 10px;
}

.main-icon {
  font-size: 75px;
  /* L'icône en noir sur le fond jaune */
  color: #1a1a1a; 
}

.hero h1 {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 10px 0 5px;
  font-size: 28px;
}

.hero p {
  margin: 0;
  font-weight: 600;
  opacity: 0.8;
  font-size: 14px;
}

/* Card Design */
.card {
  background: #ffffff; /* Fond Blanc reste pur */
  border-radius: 24px;
  padding: 30px 25px;
  /* Ombre plus prononcée car le fond est clair */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  /* Optionnel : une petite bordure noire pour le style "panneau" */
  border: 2px solid #1a1a1a;
}

.card-header {
  text-align: center;
  margin-bottom: 25px;
}

.card-header h2 {
  color: #1a1a1a;
  font-weight: 800;
  font-size: 24px;
  margin: 0;
}

.card-header p {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}

/* Inputs */
.input-group {
  margin-bottom: 18px;
}

.custom-label {
  display: block;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.field {
  --background: #f8f9fa;
  --color: #1a1a1a;
  --placeholder-color: #adb5bd;
  --border-radius: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
}

.field ion-icon {
  color: #1a1a1a;
}

/* Button CTA - Rouge pour l'action et le rappel du danger */
.cta {
  margin-top: 15px;
  --background: #e63946; 
  --color: #ffffff;
  font-weight: 800;
  height: 58px;
  font-size: 16px;
  text-transform: uppercase;
  box-shadow: 0 8px 15px rgba(230, 57, 70, 0.3);
}

/* Error Message */
.error-box {
  margin-top: 20px;
  background: #fff5f5;
  color: #e63946;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid #ffe3e3;
}
</style>