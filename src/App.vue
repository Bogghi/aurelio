<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppSideBar from './components/AppSideBar.vue';

const router = useRouter();

onMounted(() => {
  router.push('/');
})

</script>

<template>
  <div class="app">
    <AppSideBar/>
    <div class="main">
      <RouterView />
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
