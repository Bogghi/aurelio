import Database from '@tauri-apps/plugin-sql';

class DB {
    static instance = null;
    db = null;
    isInitializing = false;

    constructor() {
        if (DB.instance) {
            return DB.instance;
        }
        DB.instance = this;
    }

    async getDB() {
        if (this.db) {
            return this.db;
        }

        if (this.isInitializing) {
            // Wait for existing initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.db;
        }

        this.isInitializing = true;
        try {
            this.db = await Database.load('sqlite:aurelio.db');
            console.log('Database connected successfully');
            return this.db;
        } catch (error) {
            console.error('Database connection failed:', error);
            this.isInitializing = false;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    async execute(query, params = []) {
        try {
            const db = await this.getDB();
            const result = await db.execute(query, params);
            return result.rows || [];
        } catch (error) {
            console.error('Query execution failed:', query, error);
            return [];
        }
    }
}

// Create and export the singleton instance
const dbInstance = new DB();
export default dbInstance;