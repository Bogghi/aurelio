import Database from '@tauri-apps/plugin-sql';

class DB {
    db = null;

    async getDB() {
        return await Database.load('sqlite:aurelio.db');
    }

    async init() {
        if (!this.db) {
            this.db = await this.getDB();
        }
    }
}