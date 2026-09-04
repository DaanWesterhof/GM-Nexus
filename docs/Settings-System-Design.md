### Design Document: Settings Management System for GM Nexus

This document outlines the design and implementation plan for the Settings System in GM Nexus. The system will provide a centralized interface for managing application-wide preferences, campaign-specific configurations, and database operations.

---

### 1. User Interface: Settings Dialog

The Settings Dialog will be implemented as a modal overlay, accessible via the gear icon in the main layout. It will feature a tabbed navigation system.

#### Tab 1: General Application Settings
*   **Appearance**: Toggle between Dark/Light mode (stored in local settings).
*   **Database Management**:
    *   **Export Database**: Triggers a "Save File" dialog to export the `gmnexus.db` as a portable file.
    *   **Import Database**: 
        *   Opens a "Select File" dialog.
        *   Displays a list of campaigns found in the import file.
        *   **Selective Import**: Checkbox list allowing the user to select which campaigns to import.
        *   **Conflict Prevention**: The system will check for existing Campaign IDs. If a conflict occurs, it will suggest a "Copy" (new ID) or skip, ensuring no existing data is overwritten.
*   **Auto-Save**: Configuration for background database commit intervals.

#### Tab 2: Overlay & WebSocket Settings
*   **WebSocket Configuration**:
    *   **Server Port**: Input field to change the port (default: `3030`). Requires a server restart (handled via Tauri command).
    *   **Broadcast Frequency**: Slider to adjust how often updates are sent to the OBS overlay.
*   **Overlay URL**: A read-only field showing `http://localhost:[PORT]/overlay.html` with a "Copy to Clipboard" button.
*   **Theme Selection**: Dropdown to select the visual style for the OBS overlay.

#### Tab 3: Campaign Settings
*Visible only when a campaign is active.*
*   **Game System**: Preset selector (D&D 5e, Pathfinder, etc.) to customize resource defaults.
*   **Feature Toggles**: Enable/Disable specific sidebar modules (e.g., Factions, Quests) for the current campaign.
*   **Image Storage Path**: Set a local directory for campaign-specific assets.

#### Tab 4: Playing Screen Preferences
*Visible only when a campaign is active.*
*   **Quick Health Values**: Customizable increments for health adjustment buttons (e.g., `+/- 1, 5, 10` instead of `1, 3, 10`).
*   **Layout Mode**: Toggle between "Focused" (notes-heavy) and "Combat" (player-heavy) layouts.
*   **Status Icon Set**: Select which icon pack to use for player status effects.

---

### 2. Technical Architecture

#### Database Schema Updates
A new `settings` table will be added to `gmnexus.db` to persist these preferences:

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON stringified value
  campaignId TEXT,     -- NULL for global settings
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
);
```

#### Selective Import Logic
1.  **Read Source**: Load the imported SQLite file as a secondary database connection (`ATTACH DATABASE`).
2.  **Compare**: Select campaigns from the attached DB that do not exist in the main `campaigns` table.
3.  **User Selection**: Present the list to the user.
4.  **Batch Insert**: For each selected campaign:
    *   Insert campaign record.
    *   Insert all related records (players, entities, notes, etc.) using the original IDs.
    *   *Note: If an ID already exists in the local database, the import for that specific entity is skipped to prevent overwriting.*

#### WebSocket Port Management
1.  **Frontend**: User updates the port in Settings.
2.  **Backend (Rust)**: The frontend calls a Tauri command `update_websocket_config(new_port)`.
3.  **Restart**: The Rust backend shuts down the existing Axum server and initializes a new one on the requested port.

---

### 3. Implementation Checklist

*   [ ] Create `src/components/dialogs/SettingsDialog.tsx` with Radix UI or similar tab components.
*   [ ] Implement `SettingsService.ts` for CRUD operations on the `settings` table.
*   [ ] Add `exportDatabase` and `importDatabase` functions to `src/services/database.ts`.
*   [ ] Update `src-tauri/src/websocket.rs` to accept dynamic port configuration.
*   [ ] Add conditional rendering logic in `SettingsDialog` to check `activeCampaign` from `AppContext`.
