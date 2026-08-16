import { getDatabase } from './database';
import { Session, SessionEvent } from '../types';

export const sessionService = {
  async getByCampaign(campaignId: string): Promise<Session[]> {
    try {
      const db = await getDatabase();
      return await db.select<Session[]>(
        'SELECT * FROM sessions WHERE campaignId = ? ORDER BY startDate DESC',
        [campaignId]
      );
    } catch (e) {
      console.error('Error getting sessions by campaign:', e);
      return [];
    }
  },

  async getActiveSession(campaignId: string): Promise<Session | null> {
    try {
      const db = await getDatabase();
      const result = await db.select<Session[]>(
        'SELECT * FROM sessions WHERE campaignId = ? AND isActive = 1 LIMIT 1',
        [campaignId]
      );
      return result.length > 0 ? result[0] : null;
    } catch (e) {
      console.error('Error getting active session:', e);
      return null;
    }
  },

  async getNextSessionNumber(campaignId: string): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.select<{ maxNum: number | null }[]>(
        'SELECT MAX(sessionNumber) as maxNum FROM sessions WHERE campaignId = ?',
        [campaignId]
      );
      return (result[0]?.maxNum || 0) + 1;
    } catch (e) {
      console.error('Error getting next session number:', e);
      return 1;
    }
  },

  async startSession(session: Omit<Session, 'startDate' | 'endDate' | 'isActive'>): Promise<Session> {
    try {
      const db = await getDatabase();
      const startDate = new Date().toISOString();
      
      // Deactivate any existing active sessions just in case
      try {
        await db.execute('UPDATE sessions SET isActive = 0 WHERE campaignId = ?', [session.campaignId]);
      } catch (e) {
        console.warn('Could not deactivate sessions, might be missing isActive column yet:', e);
      }

      await db.execute(
        'INSERT INTO sessions (id, campaignId, name, sessionNumber, startDate, isActive, notes) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [session.id, session.campaignId, session.name, session.sessionNumber, startDate, session.notes]
      );

      return {
        ...session,
        startDate,
        isActive: true
      };
    } catch (e) {
      console.error('Error starting session:', e);
      throw e;
    }
  },

  async updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'campaignId'>>): Promise<void> {
    const db = await getDatabase();
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.execute(
      `UPDATE sessions SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  },

  async endSession(id: string): Promise<void> {
    try {
      const db = await getDatabase();
      const endDate = new Date().toISOString();
      await db.execute(
        'UPDATE sessions SET isActive = 0, endDate = ? WHERE id = ?',
        [endDate, id]
      );
    } catch (e) {
      console.error('Error ending session:', e);
      throw e;
    }
  },

  // Events
  async getEvents(sessionId: string): Promise<SessionEvent[]> {
    const db = await getDatabase();
    return await db.select<SessionEvent[]>(
      'SELECT * FROM session_events WHERE sessionId = ? ORDER BY timestamp DESC',
      [sessionId]
    );
  },

  async addEvent(event: Omit<SessionEvent, 'timestamp'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO session_events (id, sessionId, text, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [event.id, event.sessionId, event.text]
    );
  }
};
