import { createMemoryHistory, createRouter } from 'vue-router';
import AppHome from '../views/AppHome.vue';
import AppSettings from '../views/AppSettings.vue';
import AppHomeOld from '../views/AppHomeOld.vue';

const routes = [
  { path: '/', component: AppHome },
  { path: '/settings', component: AppSettings },
  { path: '/old', component: AppHomeOld }
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
