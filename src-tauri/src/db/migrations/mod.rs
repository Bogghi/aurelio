mod m20260119_create_transactions_table;

use tauri_plugin_sql::Migration;

pub fn all_migrations() -> Vec<Migration> {
    let mut migrations = vec![
        // Add future migrations here
        m20260119_create_transactions_table::migration(),
    ];

    migrations.sort_by_key(|m| m.version);

    // Debug: catch duplicate versions during development
    #[cfg(debug_assertions)]
    {
        let mut seen = std::collections::HashSet::new();
        for m in &migrations {
            assert!(
                seen.insert(m.version),
                "Duplicate migration version: {} ({})",
                m.version,
                m.description
            );
        }
    }

    migrations
}
