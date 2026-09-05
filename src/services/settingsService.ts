import { getDatabase } from './database';

export interface Setting {
  key: string;
  value: any;
  campaignId?: string;
  updatedAt: string;
}

export const SETTINGS_KEYS = {
  // Global Settings
  APP_APPEARANCE: 'app_appearance',
  WS_PORT: 'ws_port',
  WS_FREQUENCY: 'ws_frequency',
  WS_OVERLAY_THEME: 'ws_overlay_theme',
  DATABASE_AUTO_SAVE_INTERVAL: 'database_auto_save_interval',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',

  // Campaign Settings
  CAMPAIGN_GAME_SYSTEM: 'campaign_game_system',
  CAMPAIGN_FEATURE_TOGGLES: 'campaign_feature_toggles',
  CAMPAIGN_IMAGE_STORAGE_PATH: 'campaign_image_storage_path',

  // Playing Screen Preferences
  PLAYING_HEALTH_INCREMENTS: 'playing_health_increments',
  PLAYING_LAYOUT_MODE: 'playing_layout_mode',
  PLAYING_STATUS_ICON_SET: 'playing_status_icon_set',
};

export const GAME_SYSTEMS = [
  'D&D 5e',
  'Pathfinder 2e',
  'URealms',
  'Star Trek Adventures',
  'Generic/Custom'
];

export const getSetting = async (key: string, campaignId?: string): Promise<any | null> => {
  const db = await getDatabase();
  let query = 'SELECT value FROM settings WHERE key = ?';
  let params: any[] = [key];

  if (campaignId) {
    query += ' AND campaignId = ?';
    params.push(campaignId);
  } else {
    query += ' AND campaignId IS NULL';
  }

  try {
    const result = await db.select<{ value: string }[]>(query, params);

    if (result.length > 0) {
      try {
        return JSON.parse(result[0].value);
      } catch (e) {
        return result[0].value;
      }
    }
  } catch (e) {
    console.error(`Error getting setting ${key}:`, e);
  }

  return null;
};

export const setSetting = async (key: string, value: any, campaignId?: string): Promise<void> => {
  const db = await getDatabase();
  const stringifiedValue = JSON.stringify(value);
  const now = new Date().toISOString();

  try {
    // Check if it already exists to use UPDATE or INSERT
    const existing = await getSetting(key, campaignId);

    if (existing !== null) {
      let query = 'UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?';
      let params: any[] = [stringifiedValue, now, key];
      
      if (campaignId) {
        query += ' AND campaignId = ?';
        params.push(campaignId);
      } else {
        query += ' AND campaignId IS NULL';
      }
      
      await db.execute(query, params);
    } else {
      await db.execute(
        'INSERT INTO settings (key, value, campaignId, updatedAt) VALUES (?, ?, ?, ?)',
        [key, stringifiedValue, campaignId || null, now]
      );
    }
  } catch (e) {
    console.error(`Error setting setting ${key}:`, e);
  }
};

export const getGlobalSetting = (key: string) => getSetting(key);
export const setGlobalSetting = (key: string, value: any) => setSetting(key, value);

export const getCampaignSetting = (campaignId: string, key: string) => getSetting(key, campaignId);
export const setCampaignSetting = (campaignId: string, key: string, value: any) => setSetting(key, value, campaignId);
