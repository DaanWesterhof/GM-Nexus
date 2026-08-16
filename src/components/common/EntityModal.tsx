import React, { useState, useEffect } from 'react';
import { EntityType, CampaignEntity, QuestStatus } from '../../types';

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
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [pendingRelationships, setPendingRelationships] = useState<{ added: Partial<Relationship>[], deletedIds: string[] }>({ added: [], deletedIds: [] });

  useEffect(() => {
    setActiveTab('details');
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'Planned');
      setParentId(initialData.parentId);
    } else {
      setName('');
      setDescription('');
      setNotes('');
      setStatus('Planned');
      setParentId(undefined);
    }
    setPendingRelationships({ added: [], deletedIds: [] });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFinalSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, notes, status, parentId }, pendingRelationships);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/80 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {initialData ? `Edit ${type}` : `New ${type}`}
            </h3>
            {initialData && (
              <div className="flex space-x-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  Details
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('relationships')}
                  className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'relationships' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  Relationships
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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
                  <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Name*</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={`Name of the ${type.toLowerCase()}`}
                  />
                </div>

                {type === 'Quest' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as QuestStatus)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                  <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Brief summary..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
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

          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/20"
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
