import { getDatabase } from './database';
import { Creature } from '../types';

export const creatureService = {
  async getAllByCampaign(campaignId: string): Promise<Creature[]> {
    const db = await getDatabase();
    return await db.select<Creature[]>(
      'SELECT * FROM creatures WHERE campaignId = ? ORDER BY createdAt ASC',
      [campaignId]
    );
  },

  async create(creature: Omit<Creature, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO creatures (id, campaignId, name, currentHealth, maxHealth, statusEffects, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        creature.id,
        creature.campaignId,
        creature.name,
        creature.currentHealth,
        creature.maxHealth,
        creature.statusEffects ?? null
      ]
    );
  },

  async update(id: string, creature: Partial<Creature>): Promise<void> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(creature).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        sets.push(`${key} = ?`);
        values.push(value ?? null);
      }
    });

    if (sets.length > 0) {
      sets.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id);

      await db.execute(
        `UPDATE creatures SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM creatures WHERE id = ?', [id]);
  },

  async deleteAllFromCampaign(campaignId: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM creatures WHERE campaignId = ?', [campaignId]);
  }
};
