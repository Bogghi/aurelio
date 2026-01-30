<script setup>
import { Icon } from '@iconify/vue';
</script>

<template>
  <div class="side-bar">
    <Icon icon='solar:home-2-linear' class='icon-style clicked' />
    <Icon icon='solar:settings-minimalistic-outline' class='icon-style' />
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
