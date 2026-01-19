# Scalable SQLite Migration Architecture - Learning Guide

## What You'll Learn

1. **Module organization** in Rust - how to split code across files
2. **Timestamp-based versioning** - why it prevents merge conflicts
3. **SQLite best practices** - TEXT for dates, INTEGER for money, CHECK constraints
4. **Testing patterns** - using rusqlite for isolated migration tests

---

## Architecture Overview

```
src-tauri/src/
├── lib.rs                          # Entry point → imports db::migrations::all_migrations()
├── main.rs                         # Unchanged
└── db/
    ├── mod.rs                      # Declares submodules, re-exports
    └── migrations/
        ├── mod.rs                  # Collects all migrations into a Vec
        ├── helpers.rs              # Reusable SQL patterns
        └── m20250115_000001_create_users.rs   # Your first migration
```

**Why this structure?**
- Each migration is isolated → easy to test, review, and understand
- Helpers centralize patterns → consistent schema across tables
- Version numbers in filenames → chronological ordering in file explorer

---

## Step-by-Step Implementation

### Step 1: Create the db module

**Create file:** `src-tauri/src/db/mod.rs`

```rust
// This module contains all database-related code.
// As Aurelio grows, you might add models, queries, etc. here.

pub mod migrations;
```

**What's happening?**
- `pub mod migrations;` tells Rust to look for `db/migrations/mod.rs` or `db/migrations.rs`
- `pub` makes it accessible from `lib.rs`

---

### Step 2: Create the migrations aggregator

**Create file:** `src-tauri/src/db/migrations/mod.rs`

```rust
mod m20250115_000001_create_users;
pub mod helpers;

use tauri_plugin_sql::Migration;

/// Collects all migrations in version order.
///
/// WHY sort?
/// - Ensures consistent order regardless of how Rust loads modules
/// - Defensive programming: catches ordering bugs early
pub fn all_migrations() -> Vec<Migration> {
    let mut migrations = vec![
        m20250115_000001_create_users::migration(),
        // Add future migrations here:
        // m20250115_000002_create_accounts::migration(),
    ];

    // Sort by version (defensive - should already be in order)
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
```

**Key insight:** The `#[cfg(debug_assertions)]` block only runs in debug builds. It catches mistakes (duplicate versions) during development without slowing down production.

---

### Step 3: Create the helpers module

**Create file:** `src-tauri/src/db/migrations/helpers.rs`

```rust
//! Reusable SQL patterns for consistent schema design.
//!
//! WHY helpers?
//! - DRY: Don't repeat audit columns in every table
//! - Consistency: All tables use the same patterns
//! - Documentation: Explains WHY we make certain choices

/// Standard audit columns for tracking record creation/modification.
///
/// WHY TEXT for dates?
/// SQLite has no native datetime type. TEXT in ISO8601 format
/// ('2024-01-15 14:30:00') sorts correctly and is human-readable.
pub const AUDIT_COLUMNS: &str = r#"
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
"#;

/// Generates an updated_at trigger for a table.
///
/// WHY a trigger?
/// SQLite's DEFAULT only applies on INSERT. To auto-update
/// updated_at on modifications, we need an AFTER UPDATE trigger.
///
/// Usage in migration SQL:
/// ```sql
/// CREATE TABLE foo (...);
/// {updated_at_trigger("foo")}
/// ```
pub fn updated_at_trigger(table_name: &str) -> String {
    format!(
        r#"
CREATE TRIGGER IF NOT EXISTS trg_{table}_updated_at
AFTER UPDATE ON {table}
FOR EACH ROW
BEGIN
    UPDATE {table} SET updated_at = datetime('now') WHERE id = OLD.id;
END;
"#,
        table = table_name
    )
}

/// Money column definition.
///
/// WHY INTEGER instead of REAL?
/// Floating point has precision issues (0.1 + 0.2 != 0.3).
/// Store amounts in cents: $123.45 → 12345
/// The frontend handles formatting for display.
pub const MONEY_TYPE: &str = "INTEGER NOT NULL DEFAULT 0";
```

---

### Step 4: Create your first migration file

**Create file:** `src-tauri/src/db/migrations/m20250115_000001_create_users.rs`

```rust
//! Migration: Create users table
//! Version: 20250115_000001
//!
//! This is the foundation table for user preferences and settings.

use tauri_plugin_sql::{Migration, MigrationKind};

/// Migration version using timestamp format: YYYYMMDD_NNNNNN
///
/// WHY timestamps instead of 1, 2, 3?
/// - Two developers can create migrations on different branches
///   without version conflicts
/// - The version number tells you WHEN it was created
pub const VERSION: i64 = 20250115_000001;
pub const DESCRIPTION: &str = "create users table";

pub fn migration() -> Migration {
    Migration {
        version: VERSION,
        description: DESCRIPTION,
        sql: SQL,
        kind: MigrationKind::Up,
    }
}

const SQL: &str = r#"
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Email as unique identifier (even for single-user, useful for exports/syncs)
    email TEXT UNIQUE,
    display_name TEXT,

    -- User preferences stored as JSON
    -- WHY JSON? Flexible for future settings without schema changes
    preferences TEXT DEFAULT '{}',

    -- Audit columns (see helpers.rs for explanation)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for email lookups (even though UNIQUE creates one, being explicit is clearer)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"#;
```

**Naming convention explained:**
- `m` = migration
- `20250115` = date (YYYYMMDD)
- `000001` = sequence number for that day
- `create_users` = human-readable description

---

### Step 5: Update lib.rs to use the new module

**Modify file:** `src-tauri/src/lib.rs`

```rust
mod db;  // ← Add this line

use tauri_plugin_sql::{Migration, MigrationKind};  // ← Can remove MigrationKind if not used

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // OLD: inline migrations vec![...]
    // NEW: import from db module
    let migrations = db::migrations::all_migrations();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                // Consider renaming from test.db to aurelio.db
                .add_migrations("sqlite:aurelio.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Adding More Migrations (Your Next Steps)

When you're ready to add accounts and transactions tables:

### 1. Create the migration file

```
src-tauri/src/db/migrations/m20250115_000002_create_accounts.rs
```

### 2. Register it in mod.rs

```rust
mod m20250115_000001_create_users;
mod m20250115_000002_create_accounts;  // ← Add this

pub fn all_migrations() -> Vec<Migration> {
    let mut migrations = vec![
        m20250115_000001_create_users::migration(),
        m20250115_000002_create_accounts::migration(),  // ← Add this
    ];
    // ...
}
```

### 3. Suggested schema for accounts (double-entry bookkeeping)

```rust
const SQL: &str = r#"
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Account types for double-entry bookkeeping:
    -- 'asset': Bank accounts, cash (positive = you have money)
    -- 'liability': Credit cards, loans (positive = you owe)
    -- 'income': Salary, interest (categorizes inflows)
    -- 'expense': Groceries, rent (categorizes outflows)
    account_type TEXT NOT NULL
        CHECK(account_type IN ('asset', 'liability', 'income', 'expense')),

    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',

    -- Soft delete: never lose financial data
    is_active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;
```

---

## Testing Your Migrations (Optional Enhancement)

Add to `Cargo.toml`:

```toml
[dev-dependencies]
rusqlite = { version = "0.31", features = ["bundled"] }
```

Then in each migration file:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_migration_runs_successfully() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(SQL).unwrap();

        // Verify table exists
        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }
}
```

Run tests: `cd src-tauri && cargo test`

---

## Verification Checklist

After implementing, verify:

1. **App starts:** `npm run tauri:dev` → no errors
2. **Database created:** Check for `src-tauri/aurelio.db` (or in app data dir)
3. **Schema correct:** `sqlite3 aurelio.db ".schema"` shows your tables
4. **Tests pass:** `cd src-tauri && cargo test` (if you added tests)

---

## Common Gotchas

1. **Forgot `mod` declaration** → Rust won't compile the file
2. **Wrong version number** → Migrations run in wrong order or duplicate detection fails
3. **Forgot `pub`** → Module not accessible from lib.rs
4. **Database already exists** → Delete old `test.db` when changing schema during development
