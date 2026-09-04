import React, { useState, useEffect } from 'react';
import { Campaign, Note } from '../types';
import { campaignContentService } from '../services/campaignContentService';
import ConfirmDialog from '../components/common/ConfirmDialog';

interface NotesManagementProps {
  campaign: Campaign;
}

const NotesManagement: React.FC<NotesManagementProps> = ({ campaign }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [campaign.id]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await campaignContentService.getNotes(campaign.id);
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const newNote = {
      id: crypto.randomUUID(),
      campaignId: campaign.id,
      title: 'New Note',
      content: '',
    };
    await campaignContentService.createNote(newNote);
    await loadNotes();
    const created = await campaignContentService.getNotes(campaign.id);
    const note = created.find(n => n.id === newNote.id);
    if (note) {
      setSelectedNote(note);
      startEdit(note);
    }
  };

  const startEdit = (note: Note) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    await campaignContentService.updateNote(selectedNote.id, editTitle, editContent);
    setIsEditing(false);
    await loadNotes();
    const updated = await campaignContentService.getNotes(campaign.id);
    setSelectedNote(updated.find(n => n.id === selectedNote.id) || null);
  };

  const handleDelete = async (id: string) => {
    setNoteToDelete(id);
  };

  const confirmDelete = async () => {
    if (noteToDelete) {
      await campaignContentService.deleteNote(noteToDelete);
      setSelectedNote(null);
      await loadNotes();
      setNoteToDelete(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-theme-bg-alt border border-theme-border rounded-2xl overflow-hidden animate-in fade-in duration-500 shadow-xl">
      {/* Sidebar */}
      <div className="w-64 border-r border-theme-border flex flex-col bg-theme-bg/50">
        <div className="p-4 border-b border-theme-border">
          <button 
            onClick={handleCreate}
            className="w-full bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text font-bold py-2 rounded-lg text-sm transition-all shadow-lg shadow-black/10"
          >
            + NEW NOTE
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setIsEditing(false);
              }}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                selectedNote?.id === note.id 
                  ? 'bg-theme-primary text-theme-primary-text' 
                  : 'text-theme-text-muted hover:bg-theme-bg hover:text-theme-text'
              }`}
            >
              <div className="font-bold truncate">{note.title || 'Untitled'}</div>
              <div className={`text-[10px] mt-1 ${selectedNote?.id === note.id ? 'opacity-70' : 'text-theme-text-muted opacity-60'}`}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
          {notes.length === 0 && !loading && (
            <div className="text-center py-10 text-theme-text-muted text-xs italic">No notes.</div>
          )}
        </div>
      </div>

      {/* Editor/Viewer */}
      <div className="flex-1 flex flex-col bg-theme-bg/10">
        {selectedNote ? (
          <>
            <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-bg/30">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-2xl font-black text-theme-text focus:outline-none border-b border-theme-primary w-full mr-4"
                />
              ) : (
                <h3 className="text-2xl font-black text-theme-text">{selectedNote.title}</h3>
              )}
              <div className="flex space-x-2">
                {isEditing ? (
                  <button 
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    SAVE
                  </button>
                ) : (
                  <button 
                    onClick={() => startEdit(selectedNote)}
                    className="bg-theme-bg border border-theme-border hover:bg-theme-bg-alt text-theme-text px-4 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    EDIT
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(selectedNote.id)}
                  className="bg-theme-bg border border-theme-border hover:bg-red-600 hover:text-white text-theme-text-muted px-4 py-1 rounded-lg text-xs font-bold transition-all"
                >
                  DELETE
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent text-theme-text focus:outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Start writing..."
                />
              ) : (
                <div className="text-theme-text whitespace-pre-wrap leading-relaxed">
                  {selectedNote.content || <span className="italic text-theme-text-muted text-sm">Empty note.</span>}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-theme-text-muted italic">
            Select or create a note.
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={noteToDelete !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        onConfirm={confirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};

export default NotesManagement;
