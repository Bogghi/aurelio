import { defineStore } from "pinia";
// import { DB } from "../utils/db.js";

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