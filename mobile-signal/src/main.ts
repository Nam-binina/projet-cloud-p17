import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 */
import { VueFire, VueFireAuth } from "vuefire";
import { initializeApp } from 'firebase/app';
// Changement ici : import pour la caméra PWA
import { defineCustomElements } from '@ionic/pwa-elements/loader'; 

const firebaseApp = initializeApp({
  apiKey: "AIzaSyAQCjw0jzH3z36_Px5knH9YWQOVIUOkvIA",
  authDomain: "firstprojectfirebase-5c25f.firebaseapp.com",
  projectId: "firstprojectfirebase-5c25f",
  storageBucket: "firstprojectfirebase-5c25f.firebasestorage.app",
  messagingSenderId: "958645113026",
  appId: "1:958645113026:web:99abe637d3243da83a2b5b",
  measurementId: "G-5DVS5168ZY"
});

// Ajout ici : Initialisation des éléments de la caméra
defineCustomElements(window);

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

import 'leaflet/dist/leaflet.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  // Ajout ici : Connexion de VueFire à l'application
  .use(VueFire, {
    firebaseApp,
    modules: [VueFireAuth()],
  });

router.isReady().then(() => {
  app.mount('#app');
});