import { createMemoryHistory, createRouter } from 'vue-router';
import AppHome from '../views/AppHome.vue';

const routes = [
  { path: '/', component: AppHome }
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
