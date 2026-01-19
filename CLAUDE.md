# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurelio is a personal finance tracking desktop application built with **Tauri 2.x** (Rust backend) and **Vue 3** (frontend). It uses ledger-based accounting with the credit-debit model to help users track their finances.

## Development Commands

```bash
# Start full Tauri app in development mode (RECOMMENDED for most work)
npm run tauri:dev

# Build production desktop app (.app on macOS, .exe on Windows)
npm run tauri:build

# Frontend-only development (no native features like file system or database)
npm run dev

# Run Tauri CLI commands directly
npm run tauri <command>
```

## Architecture

```
Frontend (Vue 3)          →  IPC (@tauri-apps/api)  →  Backend (Tauri/Rust)
   /src/                                                  /src-tauri/src/
```

**Frontend** (`/src/`): Vue 3 components with Vue Router. Entry point is `main.js`.

**Backend** (`/src-tauri/src/`): Rust code in `lib.rs` handles database initialization, plugin loading (SQL, filesystem, logging), and IPC bridge.

**Key Tauri Plugins:**
- `tauri-plugin-sql` - SQLite database via `@tauri-apps/plugin-sql`
- `tauri-plugin-fs` - File operations via `@tauri-apps/plugin-fs`
- `tauri-plugin-log` - Debug logging

## Key Files

- `/src/views/AppHome.vue` - Main ledger entry form with debit/credit tracking
- `/src/components/AppSideBar.vue` - Navigation sidebar
- `/src-tauri/src/lib.rs` - Rust backend logic and Tauri setup
- `/src-tauri/capabilities/default.json` - Security permissions for file/database access
- `/src-tauri/migrations/` - SQLite migration scripts

## Data Storage

- **Files**: Saved to `~/Vault/Finance/Transactions/` as markdown
- **Database**: SQLite via Tauri SQL plugin

## Adding Tauri Commands

1. Define Rust function with `#[tauri::command]` attribute in `lib.rs`
2. Register in `.invoke_handler(tauri::generate_handler![...])`
3. Call from Vue using `import { invoke } from '@tauri-apps/api/core'`

## Adding Tauri Permissions

Edit `/src-tauri/capabilities/default.json` to grant new plugin permissions (filesystem paths, SQL operations, etc.).
