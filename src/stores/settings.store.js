import { defineStore } from "pinia";
import db from "@/utils/db.js";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        appStorageFolder: null,
        isLoading: false,
        error: null
    }),
    actions: {
        setAppStorageFolder(folderPath = "~/Aurelio") {
            this.appStorageFolder = folderPath;
        },

        async setupApp() {
            this.isLoading = true;
            this.error = null;

            try {
                // Get settings from database
                const settings = await db.execute("SELECT * FROM settings LIMIT 1", []);

                if (settings && settings.length > 0) {
                    this.setAppStorageFolder(settings[0].storage_folder);
                } else {
                    // Default settings
                    this.setAppStorageFolder();
                }

                return true;
            } catch (error) {
                console.error("Failed to setup app:", error);
                this.error = error.message;
                // Fallback to default
                this.setAppStorageFolder();
                return false;
            } finally {
                this.isLoading = false;
            }
        }
    },
    getters: {
        getStorageFolder: (state) => state.appStorageFolder
    }
});