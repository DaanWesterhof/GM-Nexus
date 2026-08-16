import { getDatabase } from './database';
import { Note, InboxEntry } from '../types';

export const campaignContentService = {
  // Inbox
  async getInboxEntries(campaignId: string): Promise<InboxEntry[]> {
    const db = await getDatabase();
    return await db.select<InboxEntry[]>(
      'SELECT * FROM inbox_entries WHERE campaignId = ? ORDER BY createdAt DESC',
      [campaignId]
    );
  },

  async createInboxEntry(entry: Omit<InboxEntry, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO inbox_entries (id, campaignId, text, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [entry.id, entry.campaignId, entry.text, entry.completed ? 1 : 0]
    );
  },

  async updateInboxEntry(id: string, text: string, completed: boolean): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'UPDATE inbox_entries SET text = ?, completed = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [text, completed ? 1 : 0, id]
    );
  },

  async deleteInboxEntry(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM inbox_entries WHERE id = ?', [id]);
  },

  // Notes
  async getNotes(campaignId: string): Promise<Note[]> {
    const db = await getDatabase();
    return await db.select<Note[]>(
      'SELECT * FROM notes WHERE campaignId = ? ORDER BY updatedAt DESC',
      [campaignId]
    );
  },

  async createNote(note: Omit<Note, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO notes (id, campaignId, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [note.id, note.campaignId, note.title, note.content ?? null]
    );
  },

  async updateNote(id: string, title: string, content: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, id]
    );
  },

  async deleteNote(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM notes WHERE id = ?', [id]);
  }
};
