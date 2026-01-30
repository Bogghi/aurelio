<script setup>
import { Icon } from '@iconify/vue';
import { router } from '../router';
import { ref } from 'vue';

const map = ref([
  { 
    icon: 'solar:home-2-linear',
    route: '/', 
    clicked: true,
  },
  { 
    icon: 'solar:settings-minimalistic-outline',
    route: '/settings', 
    clicked: false,
  }
]);

const navigateToRoute = route => {
  map.value.forEach(section => {
    section.clicked = section.route === route;
  });
  router.push(route);
}
</script>

<template>
  <div class="side-bar">
    <Icon v-for="section in map" 
      :icon="section.icon" 
      class="icon-style"
      :class="{clicked: section.clicked}" 
      @click="navigateToRoute(section.route)" />
  </div>
</template>

<style scoped>
.side-bar {
  height: 100vh;
  width: 40px;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding-top: 10px;

  .icon-style {
    color: #ffffff;
    width: 20px;
    padding: 5px 4px;
    border-radius: 5px;

    &.clicked {
      background-color: rgba(255,255,255, 0.3);
    }
  }
}
</style>
