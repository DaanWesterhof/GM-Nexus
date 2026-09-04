import React, { useEffect, useState, useCallback } from 'react';
import { Player, PlayerResource, StatusEffect } from './types';

interface OverlayState {
  players: (Player & {
    resources: PlayerResource[];
    statusEffects: StatusEffect[];
  })[];
}

const OverlayApp: React.FC = () => {
  const [state, setState] = useState<OverlayState | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const ws = new WebSocket('ws://127.0.0.1:3030/ws');

    ws.onopen = () => {
      console.log('Connected to GM Nexus');
      setConnected(true);
      ws.send(JSON.stringify({ type: 'GET_FULL_SYNC' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'FULL_SYNC') {
          setState(data.payload);
        } else if (data.type === 'STATE_UPDATE') {
          setState(prev => {
            if (!prev) return data.payload;
            
            // Merge the updated players into the current state
            const updatedPlayers = [...prev.players];
            data.payload.players.forEach((updatedPlayer: any) => {
              const index = updatedPlayers.findIndex(p => p.id === updatedPlayer.id);
              if (index !== -1) {
                updatedPlayers[index] = updatedPlayer;
              } else {
                updatedPlayers.push(updatedPlayer);
              }
            });
            
            return {
              ...prev,
              players: updatedPlayers
            };
          });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from GM Nexus, retrying...');
      setConnected(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  if (!connected) {
    return (
      <div className="p-4 text-white bg-black/50 w-fit rounded">
        Connecting to GM Nexus...
      </div>
    );
  }

  if (!state || !state.players || state.players.length === 0) {
    return null; // Don't show anything if no players
  }

  return (
    <div className="p-8 flex flex-wrap gap-6 items-start">
      {[...state.players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
        <PlayerOverlayCard key={player.id} player={player} />
      ))}
    </div>
  );
};

const PlayerOverlayCard: React.FC<{ 
  player: Player & { resources: PlayerResource[]; statusEffects: StatusEffect[] } 
}> = ({ player }) => {
  const healthResource = player.resources.find(r => 
    r.name.toLowerCase() === 'health' || r.name.toLowerCase() === 'hp'
  ) || player.resources[0];

  const healthPercent = healthResource 
    ? Math.max(0, Math.min(100, (healthResource.currentValue / healthResource.maxValue) * 100))
    : 0;

  return (
    <div className="flex items-center bg-black/60 border border-white/20 p-3 rounded-lg shadow-2xl backdrop-blur-sm w-[320px] h-[88px]">
      {/* Portrait */}
      <div className="relative w-16 h-16 mr-4 flex-shrink-0">
        {player.image ? (
          <img 
            src={player.image.startsWith('http') || player.image.startsWith('data:') ? player.image : `http://127.0.0.1:3030/player-assets/${encodeURIComponent(player.image)}`} 
            alt={player.name}
            className="w-full h-full object-cover rounded-full border-2 border-white/40"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded-full border-2 border-white/40 flex items-center justify-center text-xl font-bold">
            {player.name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1">
          <h2 className="text-white font-bold text-lg leading-none">{player.name}</h2>
          {healthResource && (
            <span className="text-white/80 text-xs font-mono">
              {healthResource.currentValue} / {healthResource.maxValue}
            </span>
          )}
        </div>

        {/* Health Bar */}
        {healthResource && (
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                healthPercent > 50 ? 'bg-green-500' : healthPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        )}

        {/* Status Effects */}
        <div className="flex gap-1 mt-1 overflow-hidden h-[18px]">
          {player.statusEffects && player.statusEffects.length > 0 ? (
            player.statusEffects.slice(0, 3).map(effect => (
              <div 
                key={effect.id} 
                className="bg-blue-600/80 text-white text-[9px] px-1.5 py-0.5 rounded border border-blue-400/50 flex items-center whitespace-nowrap"
              >
                {effect.icon && <span className="mr-1">{effect.icon}</span>}
                {effect.name}
              </div>
            ))
          ) : (
            <div className="h-[18px]" /> /* Spacer to maintain height */
          )}
          {player.statusEffects && player.statusEffects.length > 3 && (
            <div className="text-white text-[9px] flex items-center">...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverlayApp;
