import React, { useState } from 'react';
import { creatureService } from '../../services/creatureService';
import { useAppContext } from '../../store/AppContext';

interface QuickAddCreatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  initialName?: string;
}

const QuickAddCreatureModal: React.FC<QuickAddCreatureModalProps> = ({ isOpen, onClose, onAdded, initialName = '' }) => {
  const { activeCampaign } = useAppContext();
  const [name, setName] = useState(initialName);
  const [health, setHealth] = useState('10');

  if (!isOpen || !activeCampaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hp = parseInt(health);
    if (isNaN(hp) || hp <= 0) return;

    try {
      await creatureService.create({
        id: crypto.randomUUID(),
        campaignId: activeCampaign.id,
        name: name.trim(),
        currentHealth: hp,
        maxHealth: hp
      });
      
      setName('');
      setHealth('10');
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to quick add creature:', error);
      alert('Failed to create creature');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/80">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Quick Add Creature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            &times;
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
              placeholder="e.g. Goblin, Wolf, etc."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Max Health</label>
            <input
              type="number"
              required
              min="1"
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
              ADD TO SCENE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddCreatureModal;
