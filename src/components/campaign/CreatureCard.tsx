import React, { useState } from 'react';
import { Creature, CampaignEntity } from '../../types';
import { creatureService } from '../../services/creatureService';
import { entityService } from '../../services/entityService';
import { convertFileSrc } from '@tauri-apps/api/core';

interface CreatureCardProps {
  creature?: Creature;
  npc?: CampaignEntity;
  onUpdate: () => void;
  onDelete?: () => void;
}

const CreatureCard: React.FC<CreatureCardProps> = ({ creature, npc, onUpdate, onDelete }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  const entity = creature || npc;
  if (!entity) return null;

  const currentHealth = entity.currentHealth ?? 0;
  const maxHealth = entity.maxHealth ?? 10;
  const isNpc = !!npc;

  const statusEffects: string[] = entity.statusEffects ? JSON.parse(entity.statusEffects) : [];

  const handleHealthChange = async (delta: number) => {
    let newValue = currentHealth + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > maxHealth) newValue = maxHealth;

    if (newValue === currentHealth) return;

    if (isNpc) {
      await entityService.update(entity.id, { currentHealth: newValue });
    } else {
      await creatureService.update(entity.id, { currentHealth: newValue });
    }
    onUpdate();
  };

  const handleDirectEdit = async (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    let newValue = numValue;
    if (newValue < 0) newValue = 0;
    if (newValue > maxHealth) newValue = maxHealth;

    if (isNpc) {
      await entityService.update(entity.id, { currentHealth: newValue });
    } else {
      await creatureService.update(entity.id, { currentHealth: newValue });
    }
    onUpdate();
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await handleStatusEffectChange(newStatusName, 'add');
    setNewStatusName('');
    setShowStatusModal(false);
  };

  const handleStatusEffectChange = async (effectName: string, action: 'add' | 'remove') => {
    let updatedEffects: string[];
    
    if (action === 'add') {
      if (!effectName.trim() || statusEffects.includes(effectName)) return;
      updatedEffects = [...statusEffects, effectName];
    } else {
      updatedEffects = statusEffects.filter(e => e !== effectName);
    }
    
    const statusEffectsJson = JSON.stringify(updatedEffects);
    if (isNpc) {
      await entityService.update(entity.id, { statusEffects: statusEffectsJson });
    } else {
      await creatureService.update(entity.id, { statusEffects: statusEffectsJson });
    }
    onUpdate();
  };

  const healthPercentage = (currentHealth / maxHealth) * 100;
  
  // Health bar color based on percentage
  const getHealthColor = () => {
    const ratio = currentHealth / maxHealth;
    if (ratio < 0.25) return 'bg-red-500';
    if (ratio < 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleRemove = async () => {
    if (isNpc) {
      if (window.confirm(`Remove ${entity.name} from scene?`)) {
        await entityService.update(entity.id, { inScene: false });
        onUpdate();
      }
    } else if (onDelete) {
      if (window.confirm(`Remove ${entity.name}?`)) {
        onDelete();
      }
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg hover:border-gray-600 transition-all group overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          {isNpc && npc.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0 bg-gray-900">
              <img 
                src={npc.image.startsWith('http') ? npc.image : convertFileSrc(npc.image)} 
                alt={npc.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[150px]">
              {entity.name}
            </h3>
            {isNpc && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">NPC</span>}
            <button 
              onClick={() => setShowStatusModal(true)}
              className="ml-2 text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tighter inline-flex items-center bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-800/30 transition-colors"
            >
              + ADD
            </button>
          </div>
        </div>
        <button 
          onClick={handleRemove}
          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          &times;
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end relative">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Health</span>
            
            <div className="flex items-center space-x-1">
              <input 
                type="number"
                value={currentHealth}
                onChange={(e) => handleDirectEdit(e.target.value)}
                className="w-12 bg-transparent text-right font-bold text-xl text-white focus:outline-none focus:bg-gray-700 rounded transition-colors"
              />
              <span className="text-gray-500 text-sm">/ {maxHealth}</span>
            </div>
          </div>

        {/* Health Bar */}
        <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700 shadow-inner">
          <div 
            className={`h-full transition-all duration-300 ${getHealthColor()}`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-6 gap-1 mt-2">
          {[-10, -5, -1, 1, 5, 10].map(delta => (
            <button
              key={delta}
              onClick={() => handleHealthChange(delta)}
              className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                delta < 0 
                  ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30' 
                  : 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/30'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        {/* Status Effects - Placed below controls to save space */}
        <div className="flex flex-wrap gap-1 min-h-[1.25rem] mt-3">
          {statusEffects.map(effect => (
            <span 
              key={effect}
              className="bg-purple-900/30 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center group cursor-pointer hover:bg-purple-900/50 transition-all"
              onClick={() => handleStatusEffectChange(effect, 'remove')}
              title="Click to remove"
            >
              {effect}
              <span className="ml-1 text-purple-500 group-hover:text-purple-300">×</span>
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Add Status Modal - Inline for simplicity */}
      {showStatusModal && (
        <div className="absolute inset-0 bg-gray-900/90 z-20 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl w-full">
            <h4 className="text-sm font-bold text-white mb-3">Add Status Effect</h4>
            <input 
              type="text"
              autoFocus
              placeholder="Effect name (e.g. Poisoned)"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >Cancel</button>
              <button 
                onClick={handleAddStatus}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >Add Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatureCard;
