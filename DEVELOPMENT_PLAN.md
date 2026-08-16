# GM Nexus Development Plan - Foundation Phase

This document outlines the architecture, database schema, and development roadmap for the initial foundation of GM Nexus.

## 1. Architecture Overview

GM Nexus is built as a local-first desktop application using Tauri 2.

- **Frontend**: React + TypeScript + Vite + Tailwind CSS.
- **Backend**: Rust (Tauri).
- **Persistence**: SQLite (local-only).
- **Overlay Integration**: WebSocket server (local) for OBS communication.

The architecture follows a clean separation between the UI and the data layer, ensuring that the application remains system-agnostic.

## 2. Database Schema (SQLite)

The initial schema focuses on the core campaign entities and their relationships.

### Campaigns
- `id`: UUID (Primary Key)
- `name`: TEXT
- `gameSystem`: TEXT (e.g., "D&D", "STA")
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP

### Players
- `id`: UUID (Primary Key)
- `campaignId`: UUID (Foreign Key -> Campaigns.id)
- `name`: TEXT
- `image`: TEXT (Path to local file)
- `status`: TEXT
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP

### PlayerResources
- `id`: UUID (Primary Key)
- `playerId`: UUID (Foreign Key -> Players.id)
- `name`: TEXT (e.g., "Health", "Mana")
- `currentValue`: INTEGER
- `maxValue`: INTEGER
- `displayStyle`: TEXT
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP

### CampaignEntities (NPCs, Locations, Quests, Factions)
- `id`: UUID (Primary Key)
- `campaignId`: UUID (Foreign Key -> Campaigns.id)
- `type`: TEXT (e.g., "NPC", "Location", "Quest", "Faction")
- `name`: TEXT
- `description`: TEXT
- `image`: TEXT
- `notes`: TEXT
- `parentId`: UUID (Self-reference for nested locations or factions)
- `status`: TEXT (For Quests)
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP

### Relationships
- `id`: UUID (Primary Key)
- `campaignId`: UUID (Foreign Key -> Campaigns.id)
- `sourceEntityId`: UUID
- `sourceEntityType`: TEXT
- `targetEntityId`: UUID
- `targetEntityType`: TEXT
- `relationshipType`: TEXT
- `notes`: TEXT
- `createdAt`: TIMESTAMP

### Sessions
- `id`: UUID (Primary Key)
- `campaignId`: UUID (Foreign Key -> Campaigns.id)
- `name`: TEXT
- `startDate`: TIMESTAMP
- `endDate`: TIMESTAMP
- `notes`: TEXT

## 3. Application State Architecture

State management will be handled in the React frontend using a combination of:
- **React Context / Custom Hooks**: For global application state (current campaign, active session).
- **Repository Pattern**: A set of service classes that interact with the Tauri/Rust layer to perform CRUD operations on the SQLite database.

## 4. Component Architecture

- **Shell**: Main navigation and layout.
- **Campaign Selector**: Entry point for choosing/creating campaigns.
- **Campaign Book**: Knowledge base viewer and editor.
- **Playing Screen**: Live session management dashboard.
- **Common UI**: Reusable components (Buttons, Inputs, Modals, Entity Cards).

## 5. OBS / WebSocket Architecture

- **Rust Backend**: Manages a local WebSocket server.
- **React Frontend**: Communicates with the Rust backend to broadcast state changes (e.g., player health updates).
- **OBS Overlay**: A separate HTML/JS project (or served via Tauri) that connects to the WebSocket server to receive and display live game data.

## 6. MVP Development Phases

1. **Phase 1: Foundation (Current)**
   - Project configuration verification.
   - SQLite integration and initial schema.
   - Domain models and basic repository layer.
   - Application shell and navigation.
2. **Phase 2: Campaign Management**
   - Campaign creation and selection.
   - CRUD for NPCs, Locations, Quests.
   - Relationship linking.
3. **Phase 3: Live Play**
   - Player management and resource tracking.
   - Session management and event logging.
4. **Phase 4: OBS Overlay**
   - WebSocket server implementation.
   - Basic OBS overlay template.
   - Real-time state synchronization.

## 7. Testing Strategy

- **Unit Tests**: For core business logic and data transformations (Vitest).
- **Integration Tests**: For repository layer and SQLite interactions.
- **Component Tests**: For UI components (React Testing Library).
- **Manual Verification**: Running the Tauri app and verifying persistence.

## 8. Known Risks

- **SQLite Migration**: Handling schema updates in a local-first desktop app.
- **WebSocket Stability**: Ensuring the OBS overlay reliably reconnects to the local server.
- **Performance**: Maintaining responsiveness as the Campaign Book grows to thousands of entities.
