import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { playerService } from '../services/playerService';
import { useAppContext } from '../store/AppContext';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { saveImageToAppFolder } from '../utils/fileUtils';
import ConfirmDialog from '../components/common/ConfirmDialog';

const PlayerManagement: React.FC = () => {
  const { activeCampaign, refreshPlayers, players } = useAppContext();
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('');
  const [resources, setResources] = useState<{id?: string, name: string, current?: number, max: number, style: string, color?: string}[]>([
    { name: 'Health', current: 10, max: 10, style: 'bar', color: '#10b981' }
  ]);

  const DEFAULT_COLORS = [
    { name: 'Health Green', value: '#10b981' },
    { name: 'Resource Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Blue', value: '#2563eb' },
  ];

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setImage(editingPlayer.image || '');
      setStatus(editingPlayer.status || '');
      loadPlayerResources(editingPlayer.id);
    } else {
      setName('');
      setImage('');
      setStatus('');
      setResources([{ name: 'Health', current: 10, max: 10, style: 'bar', color: '#10b981' }]);
    }
  }, [editingPlayer]);

  const loadPlayerResources = async (playerId: string) => {
    const res = await playerService.getResources(playerId);
    if (res.length > 0) {
      setResources(res.map(r => ({ id: r.id, name: r.name, current: r.currentValue, max: r.maxValue, style: r.displayStyle, color: r.color })));
    }
  };

  const handleSelectImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'webp']
        }]
      });
      if (selected) {
        const savedPath = await saveImageToAppFolder(selected as string);
        setImage(savedPath);
      }
    } catch (error) {
      console.error('Failed to select image:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;

    try {
      const playerId = editingPlayer ? editingPlayer.id : crypto.randomUUID();
      
      if (editingPlayer) {
        await playerService.update(playerId, { name, image, status });
      } else {
        await playerService.create({
          id: playerId,
          campaignId: activeCampaign.id,
          name,
          image,
          status
        });
      }

      // Handle resources
      const dbResources = editingPlayer ? await playerService.getResources(playerId) : [];

      // 1. Delete resources that were removed in the UI
      for (const dbRes of dbResources) {
        if (!resources.find(r => r.id === dbRes.id)) {
          await playerService.deleteResource(dbRes.id);
        }
      }

      // 2. Create or Update resources
      for (const res of resources) {
        if (res.id) {
          // Update existing
          await playerService.updateResourceMetadata(res.id, {
            name: res.name,
            maxValue: res.max,
            displayStyle: res.style,
            color: res.color
          });
        } else {
          // Create new
          await playerService.createResource({
            id: crypto.randomUUID(),
            playerId,
            name: res.name,
            currentValue: (res.current !== undefined && !isNaN(res.current)) ? res.current : res.max,
            maxValue: res.max,
            displayStyle: res.style,
            color: res.color
          });
        }
      }

      await refreshPlayers();
      setIsAddingPlayer(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Failed to save player:', error);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsAddingPlayer(true);
  };

  const handleDelete = async (id: string) => {
    setPlayerToDelete(id);
  };

  const confirmDelete = async () => {
    if (playerToDelete) {
      await playerService.delete(playerToDelete);
      await refreshPlayers();
      setPlayerToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-theme-text">Players</h2>
        <button
          onClick={() => setIsAddingPlayer(true)}
          className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/10"
        >
          Add Player
        </button>
      </div>

      {(isAddingPlayer || editingPlayer) && (
        <div className="bg-theme-bg-alt border border-theme-border p-6 rounded-xl animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text-muted mb-1">Image URL/Path</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary"
                    placeholder="https://... or C:\..."
                  />
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="p-2 bg-theme-bg-alt hover:bg-theme-bg text-theme-text rounded-lg transition-colors flex items-center justify-center border border-theme-border"
                    title="Select image file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-muted mb-1">Initial Resources</label>
              {resources.map((res, index) => (
                <div key={index} className="flex flex-col space-y-2 mb-4 p-3 bg-theme-bg-alt/50 border border-theme-border rounded-lg">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Resource Name"
                      value={res.name}
                      onChange={(e) => {
                        const newRes = [...resources];
                        newRes[index].name = e.target.value;
                        setResources(newRes);
                      }}
                      className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-3 py-1 text-theme-text text-sm"
                    />
                    <div className="flex space-x-2 flex-1">
                      <select
                        value={res.color || '#10b981'}
                        onChange={(e) => {
                          const newRes = [...resources];
                          newRes[index].color = e.target.value;
                          setResources(newRes);
                        }}
                        className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-3 py-1 text-theme-text text-sm"
                      >
                        {DEFAULT_COLORS.map(color => (
                          <option key={color.value} value={color.value}>{color.name}</option>
                        ))}
                      </select>
                    </div>
                    {resources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setResources(resources.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-400 px-2"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-4 items-center">
                    <div className="flex flex-1 items-center space-x-2">
                      <label className="text-[10px] uppercase text-theme-text-muted font-bold">Start</label>
                      <input
                        type="number"
                        placeholder="Current"
                        value={res.current}
                        onChange={(e) => {
                          const newRes = [...resources];
                          const val = parseInt(e.target.value);
                          newRes[index].current = isNaN(val) ? undefined : val;
                          setResources(newRes);
                        }}
                        className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-3 py-1 text-theme-text text-sm"
                      />
                    </div>
                    <div className="flex flex-1 items-center space-x-2">
                      <label className="text-[10px] uppercase text-theme-text-muted font-bold">Max</label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={res.max}
                        onChange={(e) => {
                          const newRes = [...resources];
                          const val = parseInt(e.target.value);
                          newRes[index].max = isNaN(val) ? 0 : val;
                          setResources(newRes);
                        }}
                        className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-3 py-1 text-theme-text text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setResources([...resources, { name: '', current: 10, max: 10, style: 'bar', color: '#3b82f6' }])}
                className="text-xs text-theme-primary hover:text-theme-primary-hover"
              >
                + Add Resource
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingPlayer(false);
                  setEditingPlayer(null);
                }}
                className="px-4 py-2 text-theme-text-muted hover:text-theme-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-6 py-2 rounded-lg transition-colors shadow-sm"
              >
                {editingPlayer ? 'Update Player' : 'Create Player'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div key={player.id} className="bg-theme-bg-alt border border-theme-border rounded-xl overflow-hidden group shadow-lg">
            <div className="h-32 bg-theme-bg relative overflow-hidden border-b border-theme-border">
              {player.image ? (
                <img 
                  src={player.image.startsWith('http') ? player.image : convertFileSrc(player.image)} 
                  alt={player.name} 
                  className="w-full h-full object-cover" 
                  onError={() => {
                    console.error("Image load error for:", player.image, "Converted:", player.image ? convertFileSrc(player.image) : "undefined");
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-4xl">
                  👤
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleEdit(player)}
                  className="p-2 bg-theme-primary rounded-full text-theme-primary-text hover:bg-theme-primary-hover"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(player.id)}
                  className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-theme-text">{player.name}</h3>
              <p className="text-sm text-theme-text-muted">{player.status || 'Active'}</p>
            </div>
          </div>
        ))}
        {players.length === 0 && !isAddingPlayer && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-theme-border rounded-xl bg-theme-bg-alt/30">
            <p className="text-theme-text-muted">No players added to this campaign yet.</p>
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="mt-4 text-theme-primary hover:text-theme-primary-hover font-medium"
            >
              + Add your first player
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={playerToDelete !== null}
        title="Delete Player"
        message="Are you sure you want to delete this player? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPlayerToDelete(null)}
      />
    </div>
  );
};

export default PlayerManagement;
