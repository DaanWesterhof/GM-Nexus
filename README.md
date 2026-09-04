# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## OBS Overlay

The app runs a small local HTTP/WebSocket server (via `axum`) on `http://127.0.0.1:3030` that
serves the OBS browser-source overlay and pushes live player state updates.

- Overlay page (add as an OBS Browser Source): `http://127.0.0.1:3030/overlay.html`
- Live updates: `ws://127.0.0.1:3030/ws`
- Player portrait images (arbitrary local file paths): `http://127.0.0.1:3030/player-assets/<url-encoded-path>`

### How overlay files are located

In development (`npm run dev` / `tauri dev`), the overlay is normally opened directly against the
Vite dev server, but the bundled Rust server can also serve it as a fallback from
`src-tauri/../dist` (i.e. the last `vite build` output) if that folder exists.

In a packaged/release build, the built frontend (`dist/`) is declared as an explicit Tauri
resource (`bundle.resources` in `src-tauri/tauri.conf.json`, mapped to `overlay-dist`) and is
resolved at runtime through Tauri's resource-path API (`app.path().resolve(..., BaseDirectory::Resource)`).
This means the overlay does **not** depend on Vite, Node, WebStorm, or the project source
directory at runtime — it works the same way for an end user who just installs and launches the
app, with the dev server fully stopped.

If the overlay is unreachable in production, check the application's console/log output: the
server logs the exact resolved resource path it tried, or a clear error if `overlay.html` could
not be found there or in the dev fallback location.
