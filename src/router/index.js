import { createMemoryHistory, createRouter } from 'vue-router';
import AppHome from '../views/AppHome.vue';
import AppHomeOld from '../views/AppHomeOld.vue';

const routes = [
  { path: '/', component: AppHome },
  { path: '/old', component: AppHomeOld }
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
