# GM Nexus
> [!IMPORTANT]  
> I vibecoded this app, because im not a frontend dev and i wanted a nice app for my game master to use for when we play tabletop rpgs.
> This is just a project i did for fun and i made it public for if other people want to use it.

> [!IMPORTANT]  
> No generative ai was used to create the logo. i did that with gimp and pixabay :)

GM Nexus is a powerful tool designed for Tabletop RPG Game Masters to manage their campaigns, track game state, and enhance their livestreams with automated overlays. Built with Tauri, React, and Rust, it offers a fast, local-first experience with deep OBS integration.

## Key Features

- **Campaign Management**: Create and switch between multiple TTRPG campaigns.
- **Entity Tracking**: Detailed management for NPCs, Locations, Quests, and Factions.
- **Session History**: Keep track of what happened in previous sessions.
- **Player & NPC Portraits**: Manage character imagery that syncs directly to your stream.
- **Live OBS Overlay**: An integrated Axum server provides real-time updates to your OBS scene via WebSockets.
- **Local-First & Secure**: Your data stays on your machine, utilizing a local SQLite database.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [Rust](https://www.rust-lang.org/tools/install) (via rustup)
- Windows, macOS, or Linux

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

## Using the OBS Overlay

GM Nexus includes a built-in HTTP/WebSocket server (running on `http://127.0.0.1:3030`) that allows you to add dynamic elements to your stream.

### How to set it up:

1. **Add Browser Source**: In OBS, add a new "Browser Source".
2. **URL**: Set the URL to `http://127.0.0.1:3030/overlay.html`.
3. **Dimensions**: Set the width and height to match your stream resolution (e.g., 1920x1080).
4. **Interact**: Use the GM Nexus application to change active players, show NPC portraits, or update quest status. The overlay will update instantly.

### Technical Details:
- **WebSocket**: `ws://127.0.0.1:3030/ws` handles the live state synchronization.
- **Asset Serving**: Local portraits are served via `http://127.0.0.1:3030/player-assets/<url-encoded-path>`.

## Development

### Recommended IDE Setup
- [WebStorm](https://www.jetbrains.com/webstorm/) or [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Scripts
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the frontend and prepares for production.
- `npm run tauri dev`: Runs the Tauri app in a debug window with hot-reloading.
- `npm run tauri build`: Packages the app for distribution.
