import React, { useState } from 'react';
import { Creature, CampaignEntity } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { creatureService } from '../../services/creatureService';
import { entityService } from '../../services/entityService';
import { convertFileSrc } from '@tauri-apps/api/core';
import ConfirmDialog from '../common/ConfirmDialog';

interface CreatureCardProps {
  creature?: Creature;
  npc?: CampaignEntity;
  onUpdate: () => void;
  onDelete?: () => void;
}

const CreatureCard: React.FC<CreatureCardProps> = ({ creature, npc, onUpdate, onDelete }) => {
  const { playingSettings } = useAppContext();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setShowDeleteConfirm(true);
  };

  const confirmRemove = async () => {
    if (isNpc) {
      await entityService.update(entity.id, { inScene: false });
      onUpdate();
    } else if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`bg-theme-bg-alt border border-theme-border rounded-2xl shadow-lg hover:border-theme-primary transition-all group overflow-hidden relative flex ${playingSettings.layoutMode === 'focused' ? 'flex-row h-32 p-0' : 'flex-col p-4'}`}>
      {playingSettings.layoutMode === 'focused' ? (
        <div className="relative bg-theme-bg w-24 flex-shrink-0 border-r border-theme-border overflow-hidden">
          {isNpc && npc.image ? (
            <img 
              src={npc.image.startsWith('http') ? npc.image : convertFileSrc(npc.image)} 
              alt={npc.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-2xl">
              {isNpc ? '👤' : '👾'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
            <h3 className="text-[10px] font-black text-white truncate leading-tight mb-1">{entity.name}</h3>
            {isNpc && <span className="text-[7px] text-theme-primary-text bg-theme-primary/80 px-1 py-0.5 rounded uppercase font-bold self-start mb-1">NPC</span>}
            <button 
              onClick={() => setShowStatusModal(true)}
              className="text-[7px] text-white hover:opacity-90 font-bold uppercase tracking-tighter bg-theme-primary/60 px-1 py-0.5 rounded border border-theme-primary/30 transition-all backdrop-blur-sm active:scale-95 text-center"
            >
              + STATUS
            </button>
          </div>
          <button 
            onClick={handleRemove}
            className="absolute top-1 right-1 text-white/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            &times;
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            {isNpc && npc.image && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-theme-border flex-shrink-0 bg-theme-bg shadow-sm">
                <img 
                  src={npc.image.startsWith('http') ? npc.image : convertFileSrc(npc.image)} 
                  alt={npc.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-theme-text group-hover:text-theme-primary transition-colors truncate max-w-[150px]">
                {entity.name}
              </h3>
              {isNpc && <span className="text-[10px] bg-theme-primary/10 text-theme-primary px-1.5 py-0.5 rounded uppercase tracking-tighter font-bold border border-theme-primary/20">NPC</span>}
              <button 
                onClick={() => setShowStatusModal(true)}
                className="ml-2 text-[9px] text-theme-primary hover:text-theme-primary-hover font-bold uppercase tracking-tighter inline-flex items-center bg-theme-primary/10 px-1.5 py-0.5 rounded border border-theme-primary/20 transition-colors shadow-sm"
              >
                + ADD
              </button>
            </div>
          </div>
          <button 
            onClick={handleRemove}
            className="text-theme-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            &times;
          </button>
        </div>
      )}

      <div className={`flex-1 flex flex-col min-w-0 ${playingSettings.layoutMode === 'focused' ? 'p-3 justify-center' : 'space-y-4'}`}>
        <div className={playingSettings.layoutMode === 'focused' ? 'space-y-1' : 'space-y-2'}>
          <div className="flex justify-between items-end relative">
            <span className={`font-black text-theme-text-muted uppercase tracking-widest ${playingSettings.layoutMode === 'focused' ? 'text-[9px]' : 'text-[10px]'}`}>Health</span>
            
            <div className="flex items-center space-x-1">
              <input 
                type="number"
                value={currentHealth}
                onChange={(e) => handleDirectEdit(e.target.value)}
                className={`w-10 bg-transparent text-right font-bold text-theme-text focus:outline-none focus:bg-theme-bg rounded transition-colors ${playingSettings.layoutMode === 'focused' ? 'text-sm' : 'text-xl'}`}
              />
              <span className={`text-theme-text-muted ${playingSettings.layoutMode === 'focused' ? 'text-[10px]' : 'text-sm'}`}>/ {maxHealth}</span>
            </div>
          </div>

        {/* Health Bar */}
        <div className={`${playingSettings.layoutMode === 'focused' ? 'h-2' : 'h-3'} bg-theme-bg rounded-full overflow-hidden border border-theme-border shadow-inner`}>
          <div 
            className={`h-full transition-all duration-300 ${getHealthColor()}`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>

        {/* Quick Buttons */}
        <div className={`grid grid-cols-6 gap-1 mt-2 ${playingSettings.layoutMode === 'focused' ? 'scale-90 origin-left' : ''}`}>
          {[...playingSettings.healthIncrements.map(v => -v).reverse(), ...playingSettings.healthIncrements].map(delta => (
            <button
              key={delta}
              onClick={() => handleHealthChange(delta)}
              className={`${playingSettings.layoutMode === 'focused' ? 'py-1 text-[8px]' : 'py-2 text-[10px]'} rounded-lg font-black transition-all shadow-sm ${
                delta < 0 
                  ? 'bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30' 
                  : 'bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-600/30'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        {/* Status Effects */}
        {playingSettings.layoutMode !== 'focused' && (
          <div className="flex flex-wrap gap-1 min-h-[1.25rem] mt-3">
            {statusEffects.map(effect => (
              <span 
                key={effect}
                className="bg-purple-600/10 text-purple-600 border border-purple-600/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center group cursor-pointer hover:bg-purple-600/20 transition-all shadow-sm"
                onClick={() => handleStatusEffectChange(effect, 'remove')}
                title="Click to remove"
              >
                {effect}
                <span className="ml-1 text-purple-400 group-hover:text-purple-600">×</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Add Status Modal - Inline for simplicity */}
      {showStatusModal && (
        <div className="absolute inset-0 bg-theme-bg/95 z-20 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-theme-bg-alt border border-theme-border p-4 rounded-xl w-full shadow-2xl">
            <h4 className="text-sm font-bold text-theme-text mb-3 uppercase tracking-wider">Add Status Effect</h4>
            <input 
              type="text"
              autoFocus
              placeholder="Effect name (e.g. Poisoned)"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-text mb-4 focus:outline-none focus:border-theme-primary transition-all"
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-theme-text-muted hover:text-theme-text font-bold transition-colors"
              >CANCEL</button>
              <button 
                onClick={handleAddStatus}
                className="px-3 py-1.5 text-xs bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text font-bold rounded-lg shadow-sm transition-all"
              >ADD STATUS</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={isNpc ? "Remove NPC" : "Remove Creature"}
        message={isNpc ? `Remove ${entity.name} from scene?` : `Remove ${entity.name}?`}
        onConfirm={confirmRemove}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default CreatureCard;
