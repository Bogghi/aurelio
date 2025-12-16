<script setup>
import AppSideBar from './components/AppSideBar.vue'; 
</script>

<template>
  <div class="app">
    <AppSideBar/>
    <div class="main">
      <RouteView/>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  justify-content: center;
  align-items: stretch;

  .main {
    width: calc(100vw - 40px);
    height: 100vh;
    padding: 0;
    margin: 0;
  }
}
</style>
