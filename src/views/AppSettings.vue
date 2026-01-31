<script setup></script>

<template>
  <div class="flex-container just-center">
    <div class="container-column">
      <h1>Settings</h1>
      <div class="explain">
        <p>General settings regarding the application</p>
      </div>

      <div class="input-container">
        <p class="setting-title">Application Storage Folder</p>
        <input type="text" class="setting-input" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting-title {
  font-size: 14px;
  font-weight: 450;
  padding: 15px 0px;
}

.setting-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 0;
  font-size: 14px;
}
</style>
