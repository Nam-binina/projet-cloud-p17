<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Email</ion-label>
        <ion-input
          type="email"
          v-model="email"
          placeholder="exemple@email.com">
        </ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Mot de passe</ion-label>
        <ion-input
          type="password"
          v-model="password"
          placeholder="Mot de passe">
        </ion-input>
      </ion-item>

      <ion-button
        expand="block"
        class="ion-margin-top"
          :disabled="isLoading"
          @click="onLogin">
        Connexion
      </ion-button>

      <ion-text color="danger" v-if="errorMessage">
        <p class="ion-margin-top">{{ errorMessage }}</p>
      </ion-text>
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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText
} from '@ionic/vue';

// 🔀 Router Ionic
const router = useRouter();

// 📥 Champs du formulaire
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// 👤 Utilisateur courant (VueFire)
const currentUser = useCurrentUser();

// If already logged-in, skip login page
watch(currentUser, (u) => {
  if (u) router.replace('/home');
});

// 🔐 Connexion directe via Firebase Auth
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
    const code = err?.code || '';
    // Mapping des erreurs Firebase en messages FR
    switch (code) {
      case 'auth/invalid-email':
        errorMessage.value = "Email invalide.";
        break;
      case 'auth/user-disabled':
        errorMessage.value = "Compte désactivé.";
        break;
      case 'auth/user-not-found':
        errorMessage.value = "Utilisateur introuvable.";
        break;
      case 'auth/wrong-password':
        errorMessage.value = "Mot de passe incorrect.";
        break;
      case 'auth/too-many-requests':
        errorMessage.value = "Trop de tentatives. Réessayez plus tard.";
        break;
      default:
        errorMessage.value = "Échec de connexion. Vérifiez vos identifiants.";
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
p {
  text-align: center;
}
</style>
