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
  const { activeCampaign, setSelectedEntity, refreshEntities } = useAppContext();
  const [name, setName] = useState('');
  const [health, setHealth] = useState('10');
  const [maxHealth, setMaxHealth] = useState('10');

  if (!isOpen || !activeCampaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hp = parseInt(health) || 0;
    const maxHp = parseInt(maxHealth) || 10;

    const newId = crypto.randomUUID();
    const newEntity = {
      id: newId,
      campaignId: activeCampaign.id,
      type,
      name: name.trim(),
      description: '',
      notes: '',
      image: null,
      parentId: null,
      status: null,
      objectives: null,
      currentHealth: type === 'NPC' ? hp : null,
      maxHealth: type === 'NPC' ? maxHp : null,
      inScene: false
    };

    try {
      await entityService.create(newEntity as any);
      const created = await entityService.getById(newId);
      if (created) {
        setSelectedEntity(created);
      }
      
      refreshEntities();
      setName('');
      setHealth('10');
      setMaxHealth('10');
      onClose();
    } catch (error) {
      console.error('Failed to quick add entity:', error);
      alert(`Failed to create ${type}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg border border-theme-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-alt">
          <h3 className="text-lg font-black text-theme-text uppercase tracking-wider">Quick Add {type}</h3>
          <button onClick={onClose} className="text-theme-text-muted hover:text-theme-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-theme-text-muted mb-1 uppercase tracking-widest">Name</label>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
              placeholder={`e.g. ${type === 'NPC' ? 'Captain Brom' : type === 'Location' ? 'Greyhaven' : 'The Missing Merchant'}`}
            />
          </div>

          {type === 'NPC' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-theme-text-muted mb-1 uppercase tracking-widest">HP</label>
                <input
                  type="number"
                  required
                  value={health}
                  onChange={(e) => setHealth(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-theme-text-muted mb-1 uppercase tracking-widest">MAX HP</label>
                <input
                  type="number"
                  required
                  value={maxHealth}
                  onChange={(e) => setMaxHealth(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-theme-text-muted hover:text-theme-text transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-theme-primary hover:bg-theme-primary-hover px-6 py-2 rounded-lg text-sm font-black text-theme-primary-text transition-all shadow-md shadow-black/10"
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
