import { getDatabase } from './database';
import { CampaignEntity, EntityType, Relationship } from '../types';

export const entityService = {
  async getAllByCampaign(campaignId: string, type?: EntityType): Promise<CampaignEntity[]> {
    const db = await getDatabase();
    if (type) {
      return await db.select<CampaignEntity[]>(
        'SELECT * FROM campaign_entities WHERE campaignId = ? AND type = ? ORDER BY updatedAt DESC',
        [campaignId, type]
      );
    }
    return await db.select<CampaignEntity[]>(
      'SELECT * FROM campaign_entities WHERE campaignId = ? ORDER BY updatedAt DESC',
      [campaignId]
    );
  },

  async getById(id: string): Promise<CampaignEntity | null> {
    const db = await getDatabase();
    const result = await db.select<CampaignEntity[]>('SELECT * FROM campaign_entities WHERE id = ?', [id]);
    return result.length > 0 ? result[0] : null;
  },

  async create(entity: Omit<CampaignEntity, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO campaign_entities (id, campaignId, type, name, description, image, notes, parentId, status, objectives, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        entity.id,
        entity.campaignId,
        entity.type,
        entity.name,
        entity.description,
        entity.image ?? null,
        entity.notes ?? null,
        entity.parentId ?? null,
        entity.status ?? null,
        entity.objectives ?? null
      ]
    );
  },

  async update(id: string, entity: Partial<CampaignEntity>): Promise<void> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        sets.push(`${key} = ?`);
        values.push(value ?? null);
      }
    });

    sets.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    await db.execute(
      `UPDATE campaign_entities SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // Also delete relationships involving this entity
    await db.execute('DELETE FROM relationships WHERE sourceEntityId = ? OR targetEntityId = ?', [id, id]);
    await db.execute('DELETE FROM campaign_entities WHERE id = ?', [id]);
  },

  async getStats(campaignId: string) {
    const db = await getDatabase();
    const stats = await db.select<{ type: string; count: number }[]>(
      'SELECT type, COUNT(*) as count FROM campaign_entities WHERE campaignId = ? GROUP BY type',
      [campaignId]
    );
    
    return {
      npcs: stats.find(s => s.type === 'NPC')?.count || 0,
      locations: stats.find(s => s.type === 'Location')?.count || 0,
      quests: stats.find(s => s.type === 'Quest')?.count || 0,
      factions: stats.find(s => s.type === 'Faction')?.count || 0,
    };
  },

  async search(campaignId: string, query: string): Promise<CampaignEntity[]> {
    const db = await getDatabase();
    const sql = `
      SELECT * FROM campaign_entities 
      WHERE campaignId = ? 
      AND (name LIKE ? OR description LIKE ? OR notes LIKE ?)
      LIMIT 20
    `;
    const searchPattern = `%${query}%`;
    return await db.select<CampaignEntity[]>(sql, [campaignId, searchPattern, searchPattern, searchPattern]);
  }
};

export const relationshipService = {
  async getForEntity(entityId: string): Promise<Relationship[]> {
    const db = await getDatabase();
    return await db.select<Relationship[]>(
      'SELECT * FROM relationships WHERE sourceEntityId = ? OR targetEntityId = ?',
      [entityId, entityId]
    );
  },

  async create(relationship: Omit<Relationship, 'createdAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO relationships (id, campaignId, sourceEntityId, sourceEntityType, targetEntityId, targetEntityType, relationshipType, notes, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        relationship.id,
        relationship.campaignId,
        relationship.sourceEntityId,
        relationship.sourceEntityType,
        relationship.targetEntityId,
        relationship.targetEntityType,
        relationship.relationshipType,
        relationship.notes ?? null
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM relationships WHERE id = ?', [id]);
  }
};
