import React, { useState, useEffect } from 'react';
import { Player, PlayerResource, StatusEffect } from '../../types';
import { playerService } from '../../services/playerService';
import { convertFileSrc } from '@tauri-apps/api/core';
import { obsService } from '../../services/obsService';

interface PlayerCardProps {
  player: Player;
  activeSessionId?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, activeSessionId }) => {
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
      <div key={res.id} className="space-y-2">
        <div className="flex justify-between items-end">
          <span className={`text-xs font-bold uppercase tracking-widest ${isHealth ? 'text-theme-text-muted' : 'text-theme-primary'}`}>
            {res.name}
          </span>
          <div className="flex items-center space-x-1">
            <input 
              type="number"
              value={res.currentValue}
              onChange={(e) => handleDirectEdit(res.id, e.target.value)}
              className="w-12 bg-transparent text-right font-bold text-xl text-theme-text focus:outline-none focus:bg-theme-bg rounded transition-colors"
            />
            <span className="text-theme-text-muted text-sm">/ {res.maxValue}</span>
          </div>
        </div>
        
        {/* Resource Bar */}
        <div className="h-4 bg-theme-bg rounded-full overflow-hidden border border-theme-border shadow-inner">
          <div 
            className={`h-full transition-all duration-300 ${
              isHealth 
                ? ((res.currentValue / res.maxValue) < 0.25 ? 'bg-red-500' :
                   (res.currentValue / res.maxValue) < 0.5 ? 'bg-yellow-500' : 'bg-green-500')
                : 'bg-theme-primary'
            }`}
            style={{ width: `${(res.currentValue / res.maxValue) * 100}%` }}
          />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-6 gap-1 mt-2">
          {[-10, -5, -1, 1, 5, 10].map(delta => (
            <button
              key={delta}
              onClick={() => handleHealthChange(res.id, delta)}
              className={`py-2 rounded-lg text-[10px] font-black transition-all shadow-sm ${
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
    <div className="bg-theme-bg-alt border-2 border-theme-border rounded-2xl overflow-hidden shadow-xl flex flex-col h-full group/card relative">
      {/* Portrait and Name */}
      <div className="relative h-48 bg-theme-bg overflow-hidden border-b border-theme-border">
        {player.image ? (
          <img 
            src={player.image.startsWith('http') ? player.image : convertFileSrc(player.image)} 
            alt={player.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" 
            onError={() => console.error("PlayerCard image load error for:", player.image, "Converted:", player.image ? convertFileSrc(player.image) : "undefined")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-6xl">👤</div>
        )}
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
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-6">
        {/* Health Section */}
        {health && (
          <div key={health.id} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-theme-text-muted">
                {health.name}
              </span>
              <div className="flex items-center space-x-1">
                <input 
                  type="number"
                  value={health.currentValue}
                  onChange={(e) => handleDirectEdit(health.id, e.target.value)}
                  className="w-12 bg-transparent text-right font-bold text-xl text-theme-text focus:outline-none focus:bg-theme-bg rounded transition-colors"
                />
                <span className="text-theme-text-muted text-sm">/ {health.maxValue}</span>
              </div>
            </div>
            
            {/* Resource Bar */}
            <div className="h-4 bg-theme-bg rounded-full overflow-hidden border border-theme-border shadow-inner">
              <div 
                className={`h-full transition-all duration-300 ${
                  ((health.currentValue / health.maxValue) < 0.25 ? 'bg-red-500' :
                   (health.currentValue / health.maxValue) < 0.5 ? 'bg-yellow-500' : 'bg-green-500')
                }`}
                style={{ width: `${(health.currentValue / health.maxValue) * 100}%` }}
              />
            </div>

            {/* Quick Buttons */}
            <div className="grid grid-cols-6 gap-1 mt-2">
              {[-10, -5, -1, 1, 5, 10].map(delta => (
                <button
                  key={delta}
                  onClick={() => handleHealthChange(health.id, delta)}
                  className={`py-2 rounded-lg text-[10px] font-black transition-all shadow-sm ${
                    delta < 0 
                      ? 'bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30' 
                      : 'bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-600/30'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Status Effects - Placed below controls to save space */}
            <div className="flex flex-wrap gap-1 min-h-[1.25rem] mt-3">
              {statusEffects.map(status => (
                <span 
                  key={status.id}
                  className="bg-purple-600/10 text-purple-600 border border-purple-600/30 px-2 py-0.5 rounded text-[10px] font-medium flex items-center group cursor-pointer hover:bg-purple-600/20 transition-all shadow-sm"
                  onClick={() => handleRemoveStatus(status.id)}
                  title="Click to remove"
                >
                  {status.name}
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div className="space-y-6">
            {otherResources.map(res => renderResource(res, false))}
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
