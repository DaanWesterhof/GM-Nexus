### Implementation Plan: Settings Management System for GM Nexus

This plan details the steps required to implement the Settings Management System as described in the design document.

---

### Phase 1: Database & Backend Infrastructure

#### 1. Schema Update (`src/services/database.ts`)
*   Add the `settings` table to the `initializeDatabase` function:
    ```sql
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      campaignId TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
    ```
*   Include a migration check to ensure the table is created for existing users.

#### 2. Tauri Commands & Rust Backend (`src-tauri/src/websocket.rs` & `lib.rs`)
*   **Dynamic WebSocket Port**:
    *   Modify `start_server` in `websocket.rs` to allow stopping and restarting the server.
    *   Wrap the Axum server handle in a state object that can be managed from `lib.rs`.
    *   Implement a Tauri command `update_websocket_config(new_port: u16)` that kills the current server task and spawns a new one on the target port.
*   **Database Operations**:
    *   Implement `export_database_file` using `tauri-plugin-dialog` to select a save location and `tauri-plugin-fs` to copy the `gmnexus.db` file.
    *   Implement `get_import_preview(path: String)` to read a provided SQLite file and return a list of campaign names/IDs it contains.
    *   Implement `import_campaigns(path: String, selected_ids: Vec<String>)` to perform the selective `INSERT` logic, skipping existing IDs to prevent overwrites.

---

### Phase 2: Frontend Service Layer

#### 3. Settings Service (`src/services/settingsService.ts`)
*   Create a new service for CRUD operations on the `settings` table.
*   Provide methods for:
    *   `getGlobalSetting(key)` / `setGlobalSetting(key, value)`
    *   `getCampaignSetting(campaignId, key)` / `setCampaignSetting(campaignId, key, value)`
*   Define standard keys (e.g., `APP_APPEARANCE`, `WS_PORT`, `WS_FREQUENCY`, `UI_HEALTH_INCREMENTS`).

#### 4. Enhanced Database Service (`src/services/database.ts`)
*   Add wrapper functions for the new Tauri export/import commands.
*   Implement the conflict prevention logic: when importing, the service should check against the local `campaigns` table before proceeding with the `INSERT`.

---

### Phase 3: User Interface Development

#### 5. Settings Dialog (`src/components/dialogs/SettingsDialog.tsx`)
*   Build a modal component using Radix UI `Tabs` (or a custom Tailwind implementation).
*   **Tab 1: General Application**
    *   Appearance toggle (Dark/Light).
    *   Database Section: "Export All" button and "Import..." button.
    *   Import Modal: A sub-dialog showing the list of campaigns from the selected file with checkboxes for selective import.
*   **Tab 2: Overlay & WebSocket**
    *   Port input (numeric) with a "Restart Server" button.
    *   Broadcast frequency slider (100ms to 2000ms).
    *   Overlay URL display with "Copy" button (moving it from the Sidebar for better organization).
*   **Tab 3: Campaign Settings** (Conditional: Only if `activeCampaign` exists)
    *   Game system dropdown.
    *   Feature toggles (checkboxes for Factions, Quests, etc.).
*   **Tab 4: Playing Screen** (Conditional: Only if `activeCampaign` exists)
    *   Input fields for the 3 health increment values.
    *   Layout preference selector.

#### 6. Layout Integration (`src/components/layout/Layout.tsx`)
*   Connect the gear icon button in the `header` to a new `isSettingsOpen` state in `AppContext`.
*   Render the `SettingsDialog` globally within the `Layout`.

---

### Phase 4: Testing & Verification

*   **Conflict Test**: Attempt to import a campaign that already exists and verify the system skips it without error or overwrite.
*   **Port Test**: Change the WebSocket port from `3030` to `3031` and verify the OBS overlay (or a test client) can no longer connect to the old port but succeeds on the new one.
*   **State Persistence**: Verify that changing a "Playing Screen Preference" persists when switching between different campaigns.
