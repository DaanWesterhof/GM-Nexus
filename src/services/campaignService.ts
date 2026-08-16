import { getDatabase } from './database';
import { Campaign } from '../types';

export const campaignService = {
  async getAll(): Promise<Campaign[]> {
    const db = await getDatabase();
    return await db.select<Campaign[]>('SELECT * FROM campaigns ORDER BY updatedAt DESC');
  },

  async getById(id: string): Promise<Campaign | null> {
    const db = await getDatabase();
    const result = await db.select<Campaign[]>('SELECT * FROM campaigns WHERE id = ?', [id]);
    return result.length > 0 ? result[0] : null;
  },

  async create(campaign: Omit<Campaign, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO campaigns (id, name, gameSystem, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [campaign.id, campaign.name, campaign.gameSystem]
    );
  },

  async update(id: string, name: string, gameSystem: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'UPDATE campaigns SET name = ?, gameSystem = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [name, gameSystem, id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM campaigns WHERE id = ?', [id]);
  }
};
