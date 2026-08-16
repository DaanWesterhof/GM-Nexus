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
      startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      endDate DATETIME,
      notes TEXT,
      FOREIGN KEY (campaignId) REFERENCES campaigns (id) ON DELETE CASCADE
    );
  `);
};
