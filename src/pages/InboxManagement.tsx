import React, { useState, useEffect } from 'react';
import { Campaign, InboxEntry } from '../types';
import { campaignContentService } from '../services/campaignContentService';
import ConfirmDialog from '../components/common/ConfirmDialog';

interface InboxManagementProps {
  campaign: Campaign;
}

const InboxManagement: React.FC<InboxManagementProps> = ({ campaign }) => {
  const [entries, setEntries] = useState<InboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntryText, setNewEntryText] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [campaign.id]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await campaignContentService.getInboxEntries(campaign.id);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load inbox entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryText.trim()) return;

    await campaignContentService.createInboxEntry({
      id: crypto.randomUUID(),
      campaignId: campaign.id,
      text: newEntryText.trim(),
      completed: false,
    });

    setNewEntryText('');
    loadEntries();
  };

  const handleToggle = async (entry: InboxEntry) => {
    await campaignContentService.updateInboxEntry(entry.id, entry.text, !entry.completed);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    setEntryToDelete(id);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await campaignContentService.deleteInboxEntry(entryToDelete);
      setEntryToDelete(null);
      loadEntries();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-theme-text uppercase tracking-tight">Campaign Inbox</h2>
        <p className="text-theme-text-muted mt-1">Quick notes and reminders for your campaign.</p>
      </div>

      <form onSubmit={handleAdd} className="relative group">
        <input
          type="text"
          value={newEntryText}
          onChange={(e) => setNewEntryText(e.target.value)}
          placeholder="I need to remember to..."
          className="w-full bg-theme-bg-alt border border-theme-border rounded-xl px-6 py-4 text-theme-text focus:outline-none focus:border-theme-primary transition-all shadow-lg text-lg"
        />
        <button
          type="submit"
          disabled={!newEntryText.trim()}
          className="absolute right-3 top-3 bg-theme-primary hover:bg-theme-primary-hover disabled:bg-theme-bg-alt disabled:text-theme-text-muted text-theme-primary-text px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm"
        >
          ADD
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-theme-bg-alt/30 rounded-2xl border-2 border-theme-border border-dashed">
          <p className="text-theme-text-muted italic text-lg">Your inbox is empty.</p>
          <p className="text-theme-text-muted opacity-70 text-sm mt-2">Add your first reminder above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className={`group flex items-center space-x-4 p-4 rounded-xl border transition-all shadow-sm ${
                entry.completed 
                  ? 'bg-theme-bg/50 border-theme-border opacity-60' 
                  : 'bg-theme-bg-alt border-theme-border hover:border-theme-primary/50'
              }`}
            >
              <button
                onClick={() => handleToggle(entry)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  entry.completed 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-theme-bg border-theme-border hover:border-theme-primary'
                }`}
              >
                {entry.completed && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              
              <span className={`flex-1 text-sm font-medium ${entry.completed ? 'line-through text-theme-text-muted' : 'text-theme-text'}`}>
                {entry.text}
              </span>

              <button
                onClick={() => handleDelete(entry.id)}
                className="text-theme-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={entryToDelete !== null}
        title="Delete Inbox Entry"
        message="Are you sure you want to delete this inbox entry?"
        onConfirm={confirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};

export default InboxManagement;
