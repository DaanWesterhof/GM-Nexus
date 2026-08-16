import React, { useState } from 'react';
import { EntityType } from '../../types';
import { entityService } from '../../services/entityService';
import { useAppContext } from '../../store/AppContext';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntityType;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, type }) => {
  const { activeCampaign, setSelectedEntity } = useAppContext();
  const [name, setName] = useState('');

  if (!isOpen || !activeCampaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEntity = {
      id: crypto.randomUUID(),
      campaignId: activeCampaign.id,
      type,
      name: name.trim(),
      description: '',
      notes: '',
      image: null,
      parentId: null,
      status: null,
      objectives: null
    };

    try {
      await entityService.create(newEntity as any);
      const created = await entityService.getById(newEntity.id);
      if (created) {
        setSelectedEntity(created);
      }
      
      setName('');
      onClose();
    } catch (error) {
      console.error('Failed to quick add entity:', error);
      alert(`Failed to create ${type}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/80">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Quick Add {type}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Name</label>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={`e.g. ${type === 'NPC' ? 'Captain Brom' : type === 'Location' ? 'Greyhaven' : 'The Missing Merchant'}`}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-black text-white transition-all shadow-lg shadow-blue-900/20"
            >
              CREATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
