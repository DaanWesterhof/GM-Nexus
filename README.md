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

# Some pictures of the current application

<img width="2878" height="1447" alt="playing" src="https://github.com/user-attachments/assets/3a081259-e34c-40cb-93d8-757624548e6b" />

<img width="2878" height="1447" alt="playing_focused" src="https://github.com/user-attachments/assets/fcac1663-662a-4041-9137-f80b21197e11" />

<img width="1681" height="1159" alt="relationships" src="https://github.com/user-attachments/assets/fef7cb6a-db5d-4da5-82e1-7f39661662db" />

<img width="2878" height="1456" alt="overview" src="https://github.com/user-attachments/assets/dd0c64bd-a815-4ef6-a0de-3be0b2f46649" />

<img width="2878" height="1453" alt="history" src="https://github.com/user-attachments/assets/f18fb7aa-f3f5-4227-81a2-e41795b9c1ac" />

<img width="1194" height="841" alt="menu" src="https://github.com/user-attachments/assets/e7f4b17c-c06d-4b66-8e0e-5969f44e91e7" />

<img width="2863" height="1452" alt="warm_oak" src="https://github.com/user-attachments/assets/c097d907-41d2-43d2-a2c5-f4ac40b099f5" />

<img width="2878" height="1456" alt="light_mode" src="https://github.com/user-attachments/assets/b1cdc7f9-398f-4930-b482-0329fa1317f2" />

<img width="1776" height="1204" alt="capaign_book" src="https://github.com/user-attachments/assets/6bc582f1-5323-4ea8-87eb-ecee2c0bca7e" />
