import React, { useState, useEffect } from 'react';
import { EntityType, CampaignEntity, QuestStatus, Relationship } from '../../types';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { saveImageToAppFolder } from '../../utils/fileUtils';

import RelationshipEditor from './RelationshipEditor';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CampaignEntity>, relationships?: { added: Partial<Relationship>[], deletedIds: string[] }) => void;
  initialData?: CampaignEntity;
  type: EntityType;
  campaignId: string;
}

const EntityModal: React.FC<EntityModalProps> = ({ isOpen, onClose, onSave, initialData, type, campaignId }) => {
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'relationships'>('details');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<QuestStatus>('Planned');
  const [currentHealth, setCurrentHealth] = useState<string>('10');
  const [maxHealth, setMaxHealth] = useState<string>('10');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<{ added: Partial<Relationship>[], deletedIds: string[] }>({ added: [], deletedIds: [] });

  useEffect(() => {
    setActiveTab('details');
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'Planned');
      setCurrentHealth((initialData.currentHealth ?? 10).toString());
      setMaxHealth((initialData.maxHealth ?? 10).toString());
      setParentId(initialData.parentId);
      setImage(initialData.image || null);
    } else {
      setName('');
      setDescription('');
      setNotes('');
      setStatus('Planned');
      setCurrentHealth('10');
      setMaxHealth('10');
      setParentId(undefined);
      setImage(null);
    }
    setPendingRelationships({ added: [], deletedIds: [] });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFinalSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      name, 
      description, 
      notes, 
      status, 
      parentId, 
      image: image || undefined,
      currentHealth: type === 'NPC' ? parseInt(currentHealth) || 0 : undefined,
      maxHealth: type === 'NPC' ? parseInt(maxHealth) || 0 : undefined
    }, pendingRelationships);
    onClose();
  };

  const handleSelectImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'webp']
        }]
      });
      if (selected) {
        const savedPath = await saveImageToAppFolder(selected as string);
        setImage(savedPath);
      }
    } catch (error) {
      console.error('Failed to select image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg border border-theme-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-alt sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-theme-text">
              {initialData ? `Edit ${type}` : `New ${type}`}
            </h3>
            {initialData && (
              <div className="flex space-x-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'details' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-muted hover:text-theme-text'}`}
                >
                  Details
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('relationships')}
                  className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'relationships' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-muted hover:text-theme-text'}`}
                >
                  Relationships
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-theme-text-muted hover:text-theme-text transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleFinalSave}>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-theme-text-muted mb-1 uppercase tracking-wider">Name*</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-2.5 text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                    placeholder={`Name of the ${type.toLowerCase()}`}
                  />
                </div>

                {type === 'NPC' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Current Health</label>
                      <input
                        type="number"
                        value={currentHealth}
                        onChange={(e) => setCurrentHealth(e.target.value)}
                        className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Max Health</label>
                      <input
                        type="number"
                        value={maxHealth}
                        onChange={(e) => setMaxHealth(e.target.value)}
                        className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {type === 'Quest' && (
                  <div>
                    <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as QuestStatus)}
                      className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                      <option value="Abandoned">Abandoned</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Image</label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={image || ''}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors"
                        placeholder="Image URL or Path"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectImage}
                      className="px-4 bg-wood-600 hover:bg-wood-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
                      title="Select image file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </button>
                  </div>
                  {image && (
                    <div className="mt-2 h-32 w-full rounded-lg overflow-hidden border border-wood-500/20 dark:border-gray-700 bg-parchment-50 dark:bg-gray-900">
                      <img 
                        src={image.startsWith('http') ? image : convertFileSrc(image)} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                        onError={() => console.error("Preview load error", image)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors resize-none"
                    placeholder="Brief summary..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-wood-400/60 dark:text-gray-400 mb-1 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full bg-parchment-50 dark:bg-gray-900 border border-wood-500/10 dark:border-gray-700 rounded-lg px-4 py-2.5 text-wood-900 dark:text-white focus:outline-none focus:border-wood-400 transition-colors font-mono text-sm"
                    placeholder="Detailed notes, backstory, or GM info..."
                  />
                </div>
              </div>
            ) : (
              initialData && (
                <RelationshipEditor 
                  campaignId={campaignId}
                  sourceEntity={initialData}
                  onRelationshipsChanged={(added, deletedIds) => setPendingRelationships({ added, deletedIds })}
                />
              )
            )}
          </div>

          <div className="px-6 py-4 bg-theme-bg-alt border-t border-theme-border flex justify-end space-x-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-theme-text-muted hover:text-theme-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-theme-primary hover:bg-theme-primary-hover px-6 py-2 rounded-lg text-sm font-bold text-theme-primary-text transition-all shadow-lg shadow-black/10"
            >
              Save {type}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityModal;
