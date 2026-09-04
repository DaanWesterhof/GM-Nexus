import { getDatabase } from './database';
import { Player, PlayerResource, StatusEffect } from '../types';

export const playerService = {
  async getByCampaign(campaignId: string): Promise<Player[]> {
    const db = await getDatabase();
    return await db.select<Player[]>(
      'SELECT * FROM players WHERE campaignId = ? ORDER BY createdAt ASC',
      [campaignId]
    );
  },

  async create(player: Omit<Player, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO players (id, campaignId, name, image, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [player.id, player.campaignId, player.name, player.image, player.status]
    );
  },

  async update(id: string, updates: Partial<Omit<Player, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const db = await getDatabase();
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.execute(
      `UPDATE players SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM players WHERE id = ?', [id]);
  },

  // Resources
  async getResources(playerId: string): Promise<PlayerResource[]> {
    const db = await getDatabase();
    return await db.select<PlayerResource[]>(
      'SELECT * FROM player_resources WHERE playerId = ? ORDER BY createdAt ASC',
      [playerId]
    );
  },

  async createResource(resource: Omit<PlayerResource, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO player_resources (id, playerId, name, currentValue, maxValue, displayStyle, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [resource.id, resource.playerId, resource.name, resource.currentValue, resource.maxValue, resource.displayStyle]
    );
  },

  async updateResource(id: string, currentValue: number, sessionId?: string): Promise<void> {
    const db = await getDatabase();
    
    // Get current value for history
    const resources = await db.select<PlayerResource[]>('SELECT * FROM player_resources WHERE id = ?', [id]);
    if (resources.length === 0) return;
    
    const resource = resources[0];
    const previousValue = resource.currentValue;
    const change = currentValue - previousValue;
    
    if (change === 0) return;

    await db.execute(
      'UPDATE player_resources SET currentValue = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [currentValue, id]
    );

    // Record history
    const historyId = crypto.randomUUID();
    await db.execute(
      'INSERT INTO resource_history (id, playerId, resourceId, sessionId, previousValue, newValue, change, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [historyId, resource.playerId, resource.id, sessionId || null, previousValue, currentValue, change]
    );
  },

  async updateResourceMetadata(id: string, updates: Partial<Omit<PlayerResource, 'id' | 'playerId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const db = await getDatabase();
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.execute(
      `UPDATE player_resources SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  },

  async deleteResource(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM player_resources WHERE id = ?', [id]);
  },

  // Status Effects
  async getStatusEffects(playerId: string): Promise<StatusEffect[]> {
    const db = await getDatabase();
    return await db.select<StatusEffect[]>(
      'SELECT * FROM status_effects WHERE playerId = ? ORDER BY createdAt ASC',
      [playerId]
    );
  },

  async addStatusEffect(status: Omit<StatusEffect, 'createdAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO status_effects (id, playerId, name, description, icon, duration, createdAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [status.id, status.playerId, status.name, status.description, status.icon, status.duration]
    );
  },

  async removeStatusEffect(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM status_effects WHERE id = ?', [id]);
  }
};
