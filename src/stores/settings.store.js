import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        appStorageFolder: null, 
    }),
    actions: {
        setAppStorageFolder(folderPath = "~/Aurelio") {
            this.appStorageFolder = folderPath;
        },
        setupApp() {
            this.setAppStorageFolder();
        }
    },
});