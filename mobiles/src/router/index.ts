import { createRouter, createWebHistory } from '@ionic/vue-router';
import HomePage from '@/views/HomePage.vue';
import LoginPage from '@/views/LoginPage.vue';
import { getCurrentUser } from 'vuefire';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/home',
    component: HomePage
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 🚧 Gardes de navigation basiques pour l'auth
router.beforeEach(async (to) => {
  // Si on va sur une page protégée, vérifier l'utilisateur
  if (to.path !== '/login') {
    const user = await getCurrentUser();
    if (!user) return '/login';
  }

  // Si déjà connecté, éviter la page de login
  if (to.path === '/login') {
    const user = await getCurrentUser();
    if (user) return '/home';
  }
});

export default router;
