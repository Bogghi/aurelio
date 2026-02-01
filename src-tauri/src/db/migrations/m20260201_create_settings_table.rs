use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 20260201,
        description: "create settings table",
        sql: SQL,
        kind: MigrationKind::Up,
    }
}

const SQL: &str = r#"
    CREATE TABLE IF NOT EXISTS settings (  
        id INTEGER PRIMARY KEY AUTOINCREMENT,  
        storage_folder TEXT NOT NULL
    );
"#;
