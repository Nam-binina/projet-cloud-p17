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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
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

// 🔐 Connexion simulée + redirection
function onLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.';
    return;
  }

  // ⚠️ Firebase sera branché plus tard (Personne B)
  errorMessage.value = '';

  // ✅ REDIRECTION APRÈS CONNEXION
  router.push('/home');
}
</script>

<style scoped>
p {
  text-align: center;
}
</style>
