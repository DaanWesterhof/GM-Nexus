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
          <span className={`text-xs font-bold uppercase tracking-widest ${isHealth ? 'text-gray-500' : 'text-blue-400'}`}>
            {res.name}
          </span>
          <div className="flex items-center space-x-1">
            <input 
              type="number"
              value={res.currentValue}
              onChange={(e) => handleDirectEdit(res.id, e.target.value)}
              className="w-12 bg-transparent text-right font-bold text-xl text-white focus:outline-none focus:bg-gray-700 rounded"
            />
            <span className="text-gray-500 text-sm">/ {res.maxValue}</span>
          </div>
        </div>
        
        {/* Resource Bar */}
        <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
          <div 
            className={`h-full transition-all duration-300 ${
              isHealth 
                ? ((res.currentValue / res.maxValue) < 0.25 ? 'bg-red-500' :
                   (res.currentValue / res.maxValue) < 0.5 ? 'bg-yellow-500' : 'bg-green-500')
                : 'bg-blue-500'
            }`}
            style={{ width: `${(res.currentValue / res.maxValue) * 100}%` }}
          />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-6 gap-1 mt-2">
          {[-10, -3, -1, 1, 3, 10].map(delta => (
            <button
              key={delta}
              onClick={() => handleHealthChange(res.id, delta)}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                delta < 0 
                  ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30' 
                  : 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/30'
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
    <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Portrait and Name */}
      <div className="relative h-48 bg-gray-700">
        {player.image ? (
          <img 
            src={player.image.startsWith('http') ? player.image : convertFileSrc(player.image)} 
            alt={player.name} 
            className="w-full h-full object-cover" 
            onError={() => console.error("PlayerCard image load error for:", player.image, "Converted:", player.image ? convertFileSrc(player.image) : "undefined")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">👤</div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
          <h3 className="text-2xl font-black text-white truncate">{player.name}</h3>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-6">
        {/* Health Section */}
        {health && renderResource(health, true)}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div className="space-y-6">
            {otherResources.map(res => renderResource(res, false))}
          </div>
        )}

        {/* Status Effects */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status Effects</span>
            <button 
              onClick={() => setShowStatusModal(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
            >+ ADD</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {statusEffects.map(status => (
              <span 
                key={status.id}
                className="bg-purple-900/30 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded text-[10px] font-medium flex items-center group cursor-pointer"
                onClick={() => handleRemoveStatus(status.id)}
                title="Click to remove"
              >
                {status.name}
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
              </span>
            ))}
            {statusEffects.length === 0 && (
              <span className="text-[10px] text-gray-600 italic">No active effects</span>
            )}
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

export default PlayerCard;
