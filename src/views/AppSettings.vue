<script setup>
import { open } from "@tauri-apps/plugin-dialog";
import { useSettingsStore } from "@/stores/settings.store";
import db from "@/utils/db.js";

const settingsStore = useSettingsStore();

const handleFolderSelect = async () => {
  // Logic to handle folder selection
  const file = await open({
    multiple: false,
    directory: true,
    title: "Select Application Storage Folder",
  });

  // Updating the storage folder in the settings store
  settingsStore.setAppStorageFolder(file);
  await db.execute("UPDATE settings SET storage_folder = ? WHERE id = 1", [
    file,
  ]);
};
</script>

<template>
  <div class="flex-container just-center">
    <div class="container-column">
      <h1>Settings</h1>
      <div class="explain">
        <p>General settings regarding the application</p>
      </div>

      <div class="input-container">
        <p class="setting-title">Application Storage Folder</p>
        <input
          type="text"
          class="setting-input"
          placeholder="~/Aurelio"
          :value="settingsStore.appStorageFolder"
          @click="handleFolderSelect"
        />
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
