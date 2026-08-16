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

1. **Phase 1: Foundation (Completed)**
   - Project configuration verification.
   - SQLite integration and initial schema.
   - Domain models and basic repository layer.
   - Application shell and navigation.
2. **Phase 2: Campaign Management (Completed)**
   - **Campaign selection**: Create, select, edit, and delete campaigns.
   - **Entity Management**: Full CRUD for NPCs, Locations, Quests, and Factions.
   - **Relationship System**: Link any entity to another with custom relationship types.
   - **Structured Book**: Wiki-style entity detail pages with relationship navigation.
   - **Campaign Dashboard**: Overview of stats and recent activity.
   - **Utility Tools**: Campaign-wide search (Ctrl+K), Quick Add, and Campaign Inbox.
   - **Notes**: Persistent campaign-wide notes with dedicated editor.
   - **Persistence**: All data stored in SQLite via Tauri's SQL plugin.
3. **Phase 3: Live Play (Completed)**
   - Player management and resource tracking.
   - Session management and event logging.
   - Playing screen with player cards and health controls.
   - Quick status effect management.
   - Campaign Book integration in live play.
4. **Phase 4: OBS Overlay**
   - WebSocket server implementation.
   - Basic OBS overlay template.
   - Real-time state synchronization.

## 7. Phase 3 Implementation Details

### Database Changes
- Added `session_events` table for tracking live events.
- Added `status_effects` table for player conditions.
- Added `resource_history` table for tracking health/resource changes.
- Updated `sessions` table with `isActive`, `sessionNumber`, and `endDate`.

### State-management changes
- `AppContext` expanded to include `activeSession` and `players` list.
- Automatic player and session refreshing on campaign load.
- Added `refreshEntities` and `entitiesRefreshTrigger` to `AppContext` to coordinate global entity synchronization.

### New Components
- `PlayerCard`: Interactive card for each player with health buttons and status display.
- `PlayerManagement`: Dedicated page for configuring players and their resources.
- `HealthControls`: Integrated quick-change buttons (-10, -3, -1, +1, +3, +10).
- `PlayingPage`: The main live dashboard for GMs, featuring a slide-over Campaign Book with simplified entity browsing and quick-add functionality.

### Architectural Considerations for Phase 4
- `playerService.updateResource` now records history, providing a hook for OBS broadcasts.
- `AppContext` serves as the single source of truth for the live playing state, which the WebSocket server will subscribe to.

### Known Limitations
- Status icons are currently text-based; a full icon selector is planned for later.
- Campaign Book in Playing screen is currently a navigation-focused sidebar; deep linking to specific entities within it is basic.

## 8. Testing Strategy

- **Unit Tests**: For core business logic and data transformations (Vitest).
- **Integration Tests**: For repository layer and SQLite interactions.
- **Component Tests**: For UI components (React Testing Library).
- **Manual Verification**: Running the Tauri app and verifying persistence.

## 8. Known Risks

- **SQLite Migration**: Handling schema updates in a local-first desktop app.
- **WebSocket Stability**: Ensuring the OBS overlay reliably reconnects to the local server.
- **Performance**: Maintaining responsiveness as the Campaign Book grows to thousands of entities.
