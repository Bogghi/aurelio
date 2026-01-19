use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 20260119,
        description: "create transactions table",
        sql: SQL,
        kind: MigrationKind::Up,
    }
}

const SQL: &str = r#"
    CREATE TABLE IF NOT EXISTS transactions (  
        id INTEGER PRIMARY KEY AUTOINCREMENT,  
        debitor TEXT NOT NULL,  
        debit REAL NOT NULL,
        creditor TEXT NOT NULL,
        credit REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
"#;
