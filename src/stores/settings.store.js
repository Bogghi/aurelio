import { defineStore } from "pinia";
import db from "@/utils/db.js";
import { writeTextFile, exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs"

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        appStorageFolder: null,
        isLoading: false,
        error: null
    }),
    actions: {
        async setAppStorageFolder(folderPath) {
            if(!folderPath) {
                // this scenario has no allert because it's the cancell button
                return;
            }
            if (folderPath.length === 0) {
                alert("No folder selected.\nPlease select a folder to proceed.");
                return;
            }

            if(!await exists(folderPath)) {
                try {
                    await mkdir(folderPath, { baseDir: BaseDirectory.Home, recursive: true });
                } catch (error) {
                    alert(`Failed to create directory: ${error.message}`);
                    return;
                }
            }

            await db.execute("UPDATE settings SET storage_folder = ?", [folderPath]);
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
                
                this.appStorageFolder = settings[0].storage_folder;

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