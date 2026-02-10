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
  apiKey: "AIzaSyBzSlcosNbw5tYECjQSxWZQwadapUTcofc",
  authDomain: "tp-cloud-558c7.firebaseapp.com",
  projectId: "tp-cloud-558c7",
  storageBucket: "tp-cloud-558c7.firebasestorage.app",
  messagingSenderId: "1094412939113",
  appId: "1:1094412939113:web:6bd86e5c3195d742d9d7f8",
  measurementId: "G-FSD7FCTLVS"
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