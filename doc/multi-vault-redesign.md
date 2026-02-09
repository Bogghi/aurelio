# Multi-Vault Redesign Plan for Aurelio

## Executive Summary

Aurelio currently operates with a single hardcoded vault: one SQLite database (`aurelio.db` in Tauri's app data directory) and one file storage path (`~/Vault/Finance/Transactions`). This plan introduces multi-vault support where each vault is a self-contained directory with its own SQLite database and markdown file storage. A central config file tracks known vaults, and the frontend provides UI for creating, selecting, and switching between them at runtime.

The design prioritizes simplicity. Aurelio is a personal finance tool, not an enterprise platform. Every decision below optimizes for "least code that works correctly" over architectural purity.

---

## Current Hardcoded Assumptions (Single Vault)

| Item | Value | Location |
|------|-------|----------|
| Database name | `sqlite:aurelio.db` | `lib.rs:10`, `AppHome.vue:69` |
| Vault path | `Vault/Finance/Transactions` | `AppHome.vue:20` |
| Base directory | `BaseDirectory.Home` (user home) | `AppHome.vue:26,31,36` |
| File format | Markdown with YAML front matter | `AppHome.vue:17` |

---

## Phase 1: Data Layer — Vault Metadata and Per-Vault Database Strategy

### 1.1 Vault Config File

**What**: A JSON config file stored in Tauri's app data directory that tracks all known vaults and the last-active vault.

**Where**: `{AppDataDir}/aurelio-config.json` (resolved at runtime via Tauri's `path` API)

**Format**:

```json
{
  "version": 1,
  "lastActiveVaultId": "vault-abc123",
  "vaults": [
    {
      "id": "vault-abc123",
      "name": "Personal Finance",
      "path": "/Users/john/Vault/Finance",
      "createdAt": "2026-01-19T12:00:00Z"
    },
    {
      "id": "vault-def456",
      "name": "Business",
      "path": "/Users/john/BusinessVault",
      "createdAt": "2026-02-01T09:00:00Z"
    }
  ]
}
```

**Why JSON over a meta SQLite database**: The config is tiny (a handful of vaults at most), read once at startup, and written rarely. A JSON file is human-readable, debuggable, and requires no additional database setup. The `@tauri-apps/plugin-fs` plugin already has permissions for this.

**ID generation**: Use `crypto.randomUUID()` (available in modern webviews). No need for a UUID library.

### 1.2 Per-Vault Directory Structure

Each vault is a directory chosen by the user. Inside it, Aurelio creates:

```
{vault-path}/
  aurelio.db              # SQLite database for this vault
  Transactions/           # Markdown ledger entries
    ledger-entry-2026-01-19T12-00-00-000Z.md
    ledger-entry-2026-01-20T08-30-00-000Z.md
```

**Key decisions**:

- The database lives **inside** the vault directory, not in the app data directory. This makes vaults portable — you can move or copy a vault folder and everything travels together.
- The `Transactions/` subdirectory replaces the current hardcoded `Vault/Finance/Transactions` path. Each vault manages its own transaction files.
- The vault directory itself is chosen by the user (via a folder picker or manual path entry during vault creation).

### 1.3 Per-Vault Database Initialization

**Problem**: `tauri-plugin-sql` registers migrations at plugin build time via `add_migrations()`. You cannot dynamically register migrations for databases discovered or created after plugin initialization.

**Solution**: Bypass `tauri-plugin-sql`'s migration system for vault databases. Instead, run schema initialization as idempotent SQL statements (`CREATE TABLE IF NOT EXISTS`) immediately after opening each vault database.

**New file `src/utils/vaultDb.js`**:

```javascript
import Database from '@tauri-apps/plugin-sql';

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debitor TEXT NOT NULL,
    debit REAL NOT NULL,
    creditor TEXT NOT NULL,
    credit REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function openVaultDatabase(vaultPath) {
  const dbPath = `${vaultPath}/aurelio.db`;
  const db = await Database.load(`sqlite:${dbPath}`);
  await db.execute(SCHEMA_SQL);
  return db;
}
```

**Trade-off**: Schema evolution (ALTER TABLE, new columns) must be handled manually — with version checks or a `schema_version` table. Acceptable for a personal finance app in early development. If the schema becomes complex later, add `rusqlite` and build a Rust-side migration runner.

**Risk**: `Database.load` with absolute paths needs testing across platforms. Windows paths with backslashes or drive letters may need normalization. The `sqlite:///absolute/path` format (three slashes) may be needed.

### 1.4 Removing the Hardcoded Meta Database

**Recommendation**: Remove the `add_migrations` call entirely from `lib.rs`. The SQL plugin stays initialized (for `Database.load` IPC to work), but no database is pre-registered. All databases are opened on-demand from the frontend.

### Phase 1 Files

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/vaultDb.js` | **Create** | `openVaultDatabase(path)` helper |
| `src/utils/vaultConfig.js` | **Create** | Read/write `aurelio-config.json` |
| `src-tauri/src/lib.rs` | **Modify** | Remove `add_migrations` call |

---

## Phase 2: Backend (Rust/Tauri) — Dynamic Connections and Commands

### 2.1 Simplify `lib.rs`

Change from:

```rust
.plugin(
    tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:aurelio.db", migrations)
        .build(),
)
```

To:

```rust
.plugin(tauri_plugin_sql::Builder::default().build())
```

### 2.2 New Tauri Commands

**`resolve_app_config_path`** — Returns the absolute path to the app data directory for storing `aurelio-config.json`:

```rust
#[tauri::command]
fn resolve_app_config_path(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}
```

**`validate_vault_path`** — Checks whether a directory path exists and is writable:

```rust
#[tauri::command]
fn validate_vault_path(path: String) -> Result<bool, String> {
    let p = std::path::Path::new(&path);
    Ok(p.exists() && p.is_dir())
}
```

Register both in the invoke handler:

```rust
.invoke_handler(tauri::generate_handler![
    resolve_app_config_path,
    validate_vault_path,
])
```

### 2.3 What NOT to Build in Rust

Avoid adding `rusqlite`, a Rust migration runner, or proxying all queries through Tauri commands. The `tauri-plugin-sql` frontend API is sufficient for all current needs.

### 2.4 Permissions Update

The current `fs:scope-home-recursive` is sufficient if vaults are always under `~/`. Optionally add `fs:scope-app-data-recursive` for explicit config file access.

### Phase 2 Files

| File | Action | Purpose |
|------|--------|---------|
| `src-tauri/src/lib.rs` | **Modify** | Remove migrations, add commands + invoke_handler |
| `src-tauri/capabilities/default.json` | **Modify** | Optionally add `fs:scope-app-data-recursive` |

---

## Phase 3: Frontend State — Vault Context and Reactive Switching

### 3.1 State Management Approach

Use Vue's `reactive()` in a simple store module rather than adding Pinia. The vault state is a single concern with a handful of values.

### 3.2 Vault Store

**New file `src/stores/vaultStore.js`**:

```javascript
import { reactive, readonly } from 'vue';

const state = reactive({
  vaults: [],           // Array of vault objects from config
  activeVault: null,    // Currently active vault { id, name, path }
  db: null,             // Active vault's Database connection
  isLoading: false,     // True while switching vaults
});

export const vaultState = readonly(state);

export async function loadConfig() { /* read aurelio-config.json */ }
export async function switchVault(vaultId) { /* close old db, open new, update state */ }
export async function createVault(name, path) { /* create dir, init db, update config */ }
export async function removeVault(vaultId) { /* remove from config, optionally delete files */ }
```

**`switchVault` behavior**:

1. Set `isLoading = true`
2. If `db` is not null, call `db.close()` to release the previous connection
3. Find the vault in `vaults` by ID
4. Call `openVaultDatabase(vault.path)`
5. Update `db` and `activeVault`
6. Update `lastActiveVaultId` in config file
7. Set `isLoading = false`

### 3.3 App Initialization Flow

Modify `App.vue` `onMounted` to:

1. Call `loadConfig()` to read vault list
2. If no config file exists (first launch), show vault creation flow
3. If config exists with `lastActiveVaultId`, call `switchVault(lastActiveVaultId)`
4. If vault list is empty, show vault creation flow

### 3.4 Rewiring AppHome.vue

Replace hardcoded references:

```javascript
// Before
db.value = await Database.load('sqlite:aurelio.db');
const dirPath = "Vault/Finance/Transactions";

// After
import { vaultState } from '@/stores/vaultStore';
// Use vaultState.db for all database operations
// Use `${vaultState.activeVault.path}/Transactions` for file operations
```

File writes switch from `BaseDirectory.Home` relative paths to absolute paths using the vault's configured path.

### Phase 3 Files

| File | Action | Purpose |
|------|--------|---------|
| `src/stores/vaultStore.js` | **Create** | Reactive vault state management |
| `src/views/AppHome.vue` | **Modify** | Replace hardcoded DB/path with vault store |
| `src/App.vue` | **Modify** | Add initialization flow, conditional rendering |

---

## Phase 4: UI/UX — Vault Picker, Creation Flow, Sidebar, Routing

### 4.1 Routing Changes

```javascript
const routes = [
  { path: '/', component: AppHome },
  { path: '/vault/create', component: VaultCreate },
  { path: '/vault/select', component: VaultSelect },
];
```

### 4.2 Vault Creation View (`src/views/VaultCreate.vue`)

A form with:
- **Vault name** (text input): Display name like "Personal Finance"
- **Vault path** (text input + optional browse button): Absolute path to the vault directory
- **Create button**: Calls `createVault(name, path)` from the vault store

`createVault` logic:
1. Validate the path
2. Create `{path}/Transactions` subdirectory
3. Call `openVaultDatabase(path)` to create and initialize SQLite
4. Add the vault to config
5. Switch to the new vault
6. Navigate to `/`

### 4.3 Vault Select View (`src/views/VaultSelect.vue`)

Displays:
- List of known vaults (name, path, last-used indicator)
- Click a vault to switch to it
- "Create New Vault" button → `/vault/create`
- Optional "Remove" button per vault (removes from config, does NOT delete files)

### 4.4 Sidebar Changes

1. **Add a vault switcher icon** at the top → navigates to `/vault/select`
2. **Show the active vault name** (or initials) as a visual indicator
3. **Keep existing icons** (home, time-sort) below the vault indicator

### 4.5 Component Hierarchy

```
App.vue
  AppSideBar.vue         (vault indicator + switch button)
  <RouterView>
    AppHome.vue           /               (ledger form + transactions)
    VaultCreate.vue       /vault/create   (new vault form)
    VaultSelect.vue       /vault/select   (vault list + switch)
```

### 4.6 Loading State

```html
<template>
  <div class="app">
    <AppSideBar />
    <div class="main">
      <div v-if="vaultState.isLoading">Loading...</div>
      <RouterView v-else />
    </div>
  </div>
</template>
```

### Phase 4 Files

| File | Action | Purpose |
|------|--------|---------|
| `src/views/VaultCreate.vue` | **Create** | Vault creation form |
| `src/views/VaultSelect.vue` | **Create** | Vault list and switcher |
| `src/components/AppSideBar.vue` | **Modify** | Add vault indicator + switch |
| `src/router/index.js` | **Modify** | Add vault routes |
| `src/App.vue` | **Modify** | Add loading state |

---

## Phase 5: Migration — Handling Existing Single-Vault Data

### 5.1 The Problem

Existing users have:
- A database `aurelio.db` in Tauri's default app data directory
- Markdown files in `~/Vault/Finance/Transactions/`

### 5.2 Migration Strategy

**On first launch after update** (detected by the absence of `aurelio-config.json`):

1. Check if legacy database exists in Tauri app data directory
2. Check if legacy file directory exists at `~/Vault/Finance/Transactions/`
3. If both exist, offer automatic migration:
   - Use `~/Vault/Finance` as the vault path for a "Personal Finance" vault
   - **Copy** (not move) `aurelio.db` from app data directory into `~/Vault/Finance/aurelio.db`
   - `Transactions/` subdirectory is already in place
   - Create `aurelio-config.json` with this vault registered
4. If only the database exists, create the vault directory and copy the database
5. If neither exists, treat as fresh install → vault creation flow

### 5.3 Risks and Edge Cases

- **DB file locking on copy**: Legacy `aurelio.db` should not be open (new code doesn't auto-load it). Use `readFile`/`writeFile` from `plugin-fs`, or add a Tauri command for file copy via Rust.
- **Partial migration**: If copy fails, don't write config. Next launch retries.
- **WAL/journal files**: Copy `-wal` and `-shm` companion files too if they exist.
- **User declines**: Show vault creation flow. Old data stays untouched.

### Phase 5 Files

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/migrateLegacy.js` | **Create** | Legacy data detection and migration |

---

## Implementation Sequence

Each step produces a testable increment:

1. **Vault store and config** (Phases 1 + 3) — Create `vaultStore.js`, `vaultConfig.js`, `vaultDb.js`. Pure logic, testable without UI.
2. **Backend changes** (Phase 2) — Simplify `lib.rs`, add Tauri commands. Verify `Database.load` with absolute paths.
3. **Vault creation and selection UI** (Phase 4) — Build `VaultCreate.vue` and `VaultSelect.vue`. Wire routing. Modify sidebar.
4. **Rewire AppHome.vue** (Phase 3 continued) — Remove all hardcoded paths and DB references.
5. **Legacy migration** (Phase 5) — Add migration logic. Test with legacy `aurelio.db`.

---

## Summary of All File Changes

### New Files (7)

| File | Purpose |
|------|---------|
| `src/stores/vaultStore.js` | Reactive vault state management |
| `src/utils/vaultConfig.js` | Read/write `aurelio-config.json` |
| `src/utils/vaultDb.js` | Open vault databases with schema init |
| `src/utils/migrateLegacy.js` | One-time migration of pre-multi-vault data |
| `src/views/VaultCreate.vue` | Vault creation form |
| `src/views/VaultSelect.vue` | Vault list and switcher |

### Modified Files (5)

| File | Change |
|------|--------|
| `src-tauri/src/lib.rs` | Remove `add_migrations`, add Tauri commands + invoke_handler |
| `src/views/AppHome.vue` | Replace hardcoded DB/path with vault store references |
| `src/components/AppSideBar.vue` | Add vault indicator and switch navigation |
| `src/router/index.js` | Add `/vault/create` and `/vault/select` routes |
| `src/App.vue` | Add initialization flow, loading state, conditional boot |

### Optionally Modified (1)

| File | Change |
|------|--------|
| `src-tauri/capabilities/default.json` | Add `fs:scope-app-data-recursive` if needed |

### Unchanged

| File | Reason |
|------|--------|
| `src/components/AppHome/Transaction.vue` | No vault-specific logic; receives data via props |
| `src/main.js` | No changes needed |
| `src-tauri/Cargo.toml` | No new Rust dependencies required |

---

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `Database.load` with absolute paths behaves differently across OS | Vault DBs fail to open on some platforms | Test `sqlite:` vs `sqlite:///` format on macOS, Windows, Linux early in Step 2. Normalize paths in Rust command. |
| SQLite file lock contention when switching vaults | Database errors during switch | Always call `db.close()` before opening a new vault. |
| Config file corruption (crash during write) | Vault list lost | Write to temp file first, then rename (atomic write). Config is simple enough that losing it is recoverable. |
| Schema evolution without migration runner | Future ALTER TABLE is messy | Add a `schema_version` table and conditional ALTER logic when needed. |
| Windows path separators in SQLite connection strings | DB connection fails on Windows | Normalize all paths to forward slashes before constructing connection string. |
