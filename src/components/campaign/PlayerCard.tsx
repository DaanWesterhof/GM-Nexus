import React, { useState, useEffect } from 'react';
import { Player, PlayerResource, StatusEffect } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { playerService } from '../../services/playerService';
import { convertFileSrc } from '@tauri-apps/api/core';
import { obsService } from '../../services/obsService';

interface PlayerCardProps {
  player: Player;
  activeSessionId?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, activeSessionId }) => {
  const { playingSettings } = useAppContext();
  const [resources, setResources] = useState<PlayerResource[]>([]);
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  useEffect(() => {
    loadPlayerData();
  }, [player.id]);

  const loadPlayerData = async () => {
    const [res, status] = await Promise.all([
      playerService.getResources(player.id),
      playerService.getStatusEffects(player.id)
    ]);
    setResources(res);
    setStatusEffects(status);
  };

  const handleHealthChange = async (resourceId: string, delta: number) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    let newValue = resource.currentValue + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > resource.maxValue) newValue = resource.maxValue;

    if (newValue === resource.currentValue) return;

    await playerService.updateResource(resourceId, newValue, activeSessionId);
    
    // Optimistic update
    const updatedResources = resources.map(r => 
      r.id === resourceId ? { ...r, currentValue: newValue } : r
    );
    setResources(updatedResources);

    // Broadcast to OBS
    obsService.broadcastState({
      players: [{
        ...player,
        resources: updatedResources,
        statusEffects
      }]
    });
  };

  const handleDirectEdit = async (resourceId: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    let newValue = numValue;
    if (newValue < 0) newValue = 0;
    if (newValue > resource.maxValue) newValue = resource.maxValue;

    await playerService.updateResource(resourceId, newValue, activeSessionId);
    const updatedResources = resources.map(r => 
      r.id === resourceId ? { ...r, currentValue: newValue } : r
    );
    setResources(updatedResources);

    // Broadcast to OBS
    obsService.broadcastState({
      players: [{
        ...player,
        resources: updatedResources,
        statusEffects
      }]
    });
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    
    await playerService.addStatusEffect({
      id: crypto.randomUUID(),
      playerId: player.id,
      name: newStatusName,
    });
    
    setNewStatusName('');
    setShowStatusModal(false);
    await loadPlayerData();
    
    // Broadcast full sync after status change to ensure OBS is up to date
    if (player.campaignId) {
      obsService.broadcastFullSync(player.campaignId);
    }
  };

  const handleRemoveStatus = async (statusId: string) => {
    await playerService.removeStatusEffect(statusId);
    await loadPlayerData();

    // Broadcast full sync
    if (player.campaignId) {
      obsService.broadcastFullSync(player.campaignId);
    }
  };

  const health = resources.find(r => r.name.toLowerCase() === 'health' || r.name.toLowerCase() === 'hp');
  const otherResources = resources.filter(r => r.id !== health?.id);
  
  const renderResource = (res: PlayerResource, isHealth: boolean = false) => {
    return (
      <div key={res.id} className={playingSettings.layoutMode === 'focused' ? 'space-y-1' : 'space-y-2'}>
        <div className="flex justify-between items-end">
          <span className={`font-bold uppercase tracking-widest ${playingSettings.layoutMode === 'focused' ? 'text-[10px]' : 'text-xs'} ${isHealth ? 'text-theme-text-muted' : 'text-theme-primary'}`}>
            {res.name}
          </span>
          <div className="flex items-center space-x-1">
            <input 
              type="number"
              value={res.currentValue}
              onChange={(e) => handleDirectEdit(res.id, e.target.value)}
              className={`w-10 bg-transparent text-right font-bold text-theme-text focus:outline-none focus:bg-theme-bg rounded transition-colors ${playingSettings.layoutMode === 'focused' ? 'text-base' : 'text-xl'}`}
            />
            <span className={`text-theme-text-muted ${playingSettings.layoutMode === 'focused' ? 'text-[10px]' : 'text-sm'}`}>/ {res.maxValue}</span>
          </div>
        </div>
        
        {/* Resource Bar */}
        <div className={`${playingSettings.layoutMode === 'focused' ? 'h-2' : 'h-4'} bg-theme-bg rounded-full overflow-hidden border border-theme-border shadow-inner`}>
          <div 
            className={`h-full transition-all duration-300 ${
              isHealth && !res.color
                ? ((res.currentValue / res.maxValue) < 0.25 ? 'bg-red-500' :
                   (res.currentValue / res.maxValue) < 0.5 ? 'bg-yellow-500' : 'bg-green-500')
                : !res.color ? 'bg-theme-primary' : ''
            }`}
            style={{ 
              width: `${(res.currentValue / res.maxValue) * 100}%`,
              backgroundColor: res.color || undefined
            }}
          />
        </div>

        {/* Quick Buttons */}
        <div className={`grid grid-cols-6 gap-1 mt-2 ${playingSettings.layoutMode === 'focused' ? 'scale-90 origin-left' : ''}`}>
          {[...playingSettings.healthIncrements.map(v => -v).reverse(), ...playingSettings.healthIncrements].map(delta => (
            <button
              key={delta}
              onClick={() => handleHealthChange(res.id, delta)}
              className={`${playingSettings.layoutMode === 'focused' ? 'py-1 text-[9px]' : 'py-2 text-[10px]'} rounded-lg font-black transition-all shadow-sm ${
                delta < 0 
                  ? 'bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30' 
                  : 'bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-600/30'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-theme-bg-alt border-2 border-theme-border rounded-2xl overflow-hidden shadow-xl flex group/card relative ${playingSettings.layoutMode === 'focused' ? 'flex-row h-32' : 'flex-col h-full'}`}>
      {/* Portrait and Name */}
      <div className={`relative bg-theme-bg overflow-hidden border-b border-theme-border transition-all duration-300 ${playingSettings.layoutMode === 'focused' ? 'h-full w-24 flex-shrink-0 border-b-0 border-r' : 'h-48'}`}>
        {player.image ? (
          <img 
            src={player.image.startsWith('http') ? player.image : convertFileSrc(player.image)} 
            alt={player.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" 
            onError={() => console.error("PlayerCard image load error for:", player.image, "Converted:", player.image ? convertFileSrc(player.image) : "undefined")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-4xl">👤</div>
        )}
        
        {playingSettings.layoutMode === 'focused' ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
            <h3 className="text-[10px] font-black text-white truncate leading-tight mb-1">{player.name}</h3>
            <button 
              onClick={() => setShowStatusModal(true)}
              className="text-[7px] text-white hover:opacity-90 font-bold uppercase tracking-tighter bg-theme-primary/80 px-1 py-0.5 rounded border border-theme-primary/30 transition-all backdrop-blur-sm active:scale-95 text-center"
            >
              + STATUS
            </button>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-white truncate">{player.name}</h3>
            </div>
            <button 
              onClick={() => setShowStatusModal(true)}
              className="mb-1 text-[9px] text-theme-primary-text hover:opacity-90 font-bold uppercase tracking-tighter bg-theme-primary px-2 py-1 rounded border border-theme-primary/30 transition-all backdrop-blur-sm shadow-lg active:scale-95"
            >
              + ADD STATUS
            </button>
          </div>
        )}
      </div>

      <div className={`p-4 flex-1 flex flex-col min-w-0 ${playingSettings.layoutMode === 'focused' ? 'justify-center space-y-2' : 'space-y-6'}`}>
        {/* Health Section */}
        {health && renderResource(health, true)}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div className={playingSettings.layoutMode === 'focused' ? 'space-y-2' : 'space-y-6'}>
            {otherResources.map(res => renderResource(res, false))}
          </div>
        )}

        {/* Status Effects */}
        {playingSettings.layoutMode !== 'focused' && (
          <div className="flex flex-wrap gap-1 min-h-[1.25rem] mt-2">
            {statusEffects.map(status => (
              <span 
                key={status.id}
                className="bg-purple-600/10 text-purple-600 border border-purple-600/30 px-1.5 py-0.5 rounded text-[8px] font-medium flex items-center group cursor-pointer hover:bg-purple-600/20 transition-all shadow-sm"
                onClick={() => handleRemoveStatus(status.id)}
                title="Click to remove"
              >
                {status.name}
                <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
              </span>
            ))}
          </div>
        )}
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
    </div>
  );
};

export default PlayerCard;
