import { createApp, defineCustomElement } from 'vue'
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

import { useFirebaseApp, VueFire, VueFireAuth } from 'vuefire';
import { initializeApp } from 'firebase/app';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

defineCustomElements(window);

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

const firebaseApp = initializeApp({
  apiKey: "AIzaSyAQCjw0jzH3z36_Px5knH9YWQOVIUOkvIA",
  authDomain: "firstprojectfirebase-5c25f.firebaseapp.com",
  projectId: "firstprojectfirebase-5c25f",
  storageBucket: "firstprojectfirebase-5c25f.firebasestorage.app",
  messagingSenderId: "958645113026",
  appId: "1:958645113026:web:99abe637d3243da83a2b5b",
  measurementId: "G-5DVS5168ZY"
})

// FIREBASE_API_KEY=AIzaSyBzSlcosNbw5tYECjQSxWZQwadapUTcofc
// FIREBASE_AUTH_DOMAIN=tp-cloud-558c7.firebaseapp.com
// FIREBASE_PROJECT_ID=tp-cloud-558c7
// FIREBASE_STORAGE_BUCKET=tp-cloud-558c7.firebasestorage.app
// FIREBASE_MESSAGING_SENDER_ID=1094412939113
// FIREBASE_APP_ID=1:1094412939113:web:6bd86e5c3195d742d9d7f8

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(VueFire, {
    firebaseApp,
    modules: [
      VueFireAuth(),
    ],
  })

router.isReady().then(() => {
  app.mount('#app');
});
