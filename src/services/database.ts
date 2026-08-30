import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const getDatabase = async () => {
  if (!db) {
    try {
      db = await Database.load('sqlite:gmnexus.db');
    } catch (error) {
      console.error('Failed to load database:', error);
      throw error;
    }
  }
  return db;
};

export const initializeDatabase = async () => {
  const database = await getDatabase();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gameSystem TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      name TEXT NOT NULL,
      image TEXT,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS player_resources (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      name TEXT NOT NULL,
      currentValue INTEGER NOT NULL,
      maxValue INTEGER NOT NULL,
      displayStyle TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS campaign_entities (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      notes TEXT,
      parentId TEXT,
      status TEXT,
      objectives TEXT, -- JSON string for quest objectives
      statusEffects TEXT, -- JSON string for NPC status effects
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  // Migration: Add objectives column if it doesn't exist (for existing Phase 1 databases)
  try {
    await database.execute('ALTER TABLE campaign_entities ADD COLUMN objectives TEXT');
  } catch (e) {
    // Column might already exist
  }

  // Migration: Add statusEffects column to campaign_entities
  try {
    await database.execute('ALTER TABLE campaign_entities ADD COLUMN statusEffects TEXT');
  } catch (e) { /* ignore */ }

  // Migration: Add health and scene columns to campaign_entities
  try {
    await database.execute('ALTER TABLE campaign_entities ADD COLUMN currentHealth INTEGER');
  } catch (e) { /* ignore */ }
  try {
    await database.execute('ALTER TABLE campaign_entities ADD COLUMN maxHealth INTEGER');
  } catch (e) { /* ignore */ }
  try {
    await database.execute('ALTER TABLE campaign_entities ADD COLUMN inScene BOOLEAN DEFAULT 0');
  } catch (e) { /* ignore */ }

  // Migration: Add columns to sessions table if they don't exist
  try {
    await database.execute('ALTER TABLE sessions ADD COLUMN sessionNumber INTEGER');
    console.log('Added sessionNumber to sessions table');
  } catch (e) { /* ignore if already exists */ }

  try {
    await database.execute('ALTER TABLE sessions ADD COLUMN isActive BOOLEAN DEFAULT 0');
    console.log('Added isActive to sessions table');
  } catch (e) { /* ignore if already exists */ }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS inbox_entries (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      sourceEntityId TEXT NOT NULL,
      sourceEntityType TEXT NOT NULL,
      targetEntityId TEXT NOT NULL,
      targetEntityType TEXT NOT NULL,
      relationshipType TEXT NOT NULL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      name TEXT NOT NULL,
      sessionNumber INTEGER,
      startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      endDate DATETIME,
      isActive BOOLEAN DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS session_events (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS status_effects (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      duration TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players (id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS resource_history (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      resourceId TEXT NOT NULL,
      sessionId TEXT,
      previousValue INTEGER NOT NULL,
      newValue INTEGER NOT NULL,
      change INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players (id) ON DELETE CASCADE,
      FOREIGN KEY (resourceId) REFERENCES player_resources (id) ON DELETE CASCADE,
      FOREIGN KEY (sessionId) REFERENCES sessions (id) ON DELETE SET NULL
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS creatures (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL,
      name TEXT NOT NULL,
      currentHealth INTEGER NOT NULL,
      maxHealth INTEGER NOT NULL,
      statusEffects TEXT, -- JSON string
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);

  // Migration: Add statusEffects to creatures
  try {
    await database.execute('ALTER TABLE creatures ADD COLUMN statusEffects TEXT');
  } catch (e) { /* ignore */ }
};
