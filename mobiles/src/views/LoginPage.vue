<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="center-container">
        <LoginCard
          :email="email"
          :password="password"
          :is-loading="isLoading"
          :error-message="errorMessage"
          @update:email="email = $event"
          @update:password="password = $event"
          @submit="onLogin"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useCurrentUser } from 'vuefire';
import { IonPage, IonContent } from '@ionic/vue';
import LoginCard from '../components/LoginCard.vue';

const MAX_FAILED_ATTEMPTS = 3;

const router = useRouter();
const currentUser = useCurrentUser();
const db = getFirestore();

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
  const trimmedEmail = email.value.trim();
  const attemptsRef = doc(db, 'login_attempts', trimmedEmail.toLowerCase());

  errorMessage.value = '';
  isLoading.value = true;

  let attemptData: any = null;

  try {
    const attemptsSnap = await getDoc(attemptsRef);
    attemptData = attemptsSnap.exists() ? attemptsSnap.data() : null;

    if (attemptData?.blockedUntil) {
      const blockedDate = new Date(attemptData.blockedUntil);
      if (!Number.isNaN(blockedDate.getTime())) {
        if (blockedDate > new Date()) {
          errorMessage.value = `Compte bloqué jusqu'au ${blockedDate.toLocaleString()}.`;
          return;
        }
      } else {
        errorMessage.value = 'Compte bloqué. Contactez un administrateur pour le débloquer.';
        return;
      }
    }

    await signInWithEmailAndPassword(auth, trimmedEmail, password.value);
    await resetLoginAttempts(attemptsRef, trimmedEmail);
    router.replace('/home');
  } catch (err: any) {
    const blockMessage = await recordFailedAttempt(attemptsRef, attemptData, trimmedEmail);
    errorMessage.value = blockMessage || 'Email ou mot de passe incorrect.';
  } finally {
    isLoading.value = false;
  }
}

async function resetLoginAttempts(refDoc: any, emailValue: string) {
  await setDoc(refDoc, {
    email: emailValue,
    failedAttempts: 0,
    blockedUntil: null,
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