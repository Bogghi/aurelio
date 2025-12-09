# Tech Stack

## Frontend

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and dev server

## Backend

- **Tauri 2.x** - Rust-based framework for building desktop apps
- **Rust** - Systems programming language

## Communication

- **@tauri-apps/api** - JavaScript API for frontend-backend IPC

## Build Tools

- **npm** - Package manager
- **Cargo** - Rust package manager and build tool

## Commands

### Development

```bash
# Start the full Tauri app in development mode (recommended)
npm run tauri:dev

# Start only the Vite dev server (frontend only, no native features)
npm run dev
```

### Production Build

```bash
# Build the production app bundle (.app on macOS, .exe on Windows, etc.)
npm run tauri:build
```

### Other Commands

```bash
# Preview the production frontend build
npm run preview

# Run Tauri CLI commands directly
npm run tauri -- <command>
```

## Project Structure

```
aurelio/
├── src/                  # Vue frontend source
│   ├── components/       # Vue components
│   ├── App.vue           # Root component
│   ├── main.js           # Frontend entry point
│   └── style.css         # Global styles
├── src-tauri/            # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs       # Rust entry point
│   │   └── lib.rs        # Rust library (commands, etc.)
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── public/               # Static assets
├── dist/                 # Build output (gitignored)
├── package.json          # npm dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Development Workflow

1. Run `npm run tauri:dev` to start the app
2. Edit Vue components in `src/` - changes hot-reload automatically
3. Edit Rust code in `src-tauri/src/` - app rebuilds automatically
4. Use `@tauri-apps/api` in Vue to call Rust functions
