import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: { name: string; gameSystem: string }) => void;
  initialData?: Campaign;
  title: string;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, initialData, title }) => {
  const [name, setName] = useState('');
  const [gameSystem, setGameSystem] = useState('D&D');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setGameSystem(initialData.gameSystem);
    } else {
      setName('');
      setGameSystem('D&D');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, gameSystem });
          onClose();
        }}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Campaign Name</label>
              <input
                autoFocus
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. The Lost Kingdom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Game System</label>
              <select
                value={gameSystem}
                onChange={(e) => setGameSystem(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="D&D">D&D</option>
                <option value="URealms">URealms</option>
                <option value="STA">Star Trek Adventures (STA)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            >
              Save Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;
