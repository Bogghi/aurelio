import { defineStore } from "pinia";
import db from "@/utils/db.js";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        appStorageFolder: null,
        isLoading: false,
        error: null
    }),
    actions: {
        setAppStorageFolder(folderPath) {
            this.appStorageFolder = folderPath;
        },
        async setupApp() {
            this.isLoading = true;
            this.error = null;

            try {
                // Get settings from database
                const settings = await db.select("SELECT * FROM settings LIMIT 1", []);
                
                if (settings.length === 0) {
                    console.error("No settings found in database");
                    throw new Error("No settings found in database");
                }
                
                this.setAppStorageFolder(settings[0].storage_folder);

                return true;
            } catch (error) {
                console.error("Failed to setup app:", error);
                this.error = error.message;
                return false;
            } finally {
                this.isLoading = false;
            }
        },
    },
    getters: {
        getStorageFolder: (state) => state.appStorageFolder
    }
});