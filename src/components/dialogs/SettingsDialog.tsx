import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { SETTINGS_KEYS, getGlobalSetting, setGlobalSetting, getCampaignSetting, setCampaignSetting } from '../../services/settingsService';
import { exportDatabase, getImportPreview, importCampaigns } from '../../services/database';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

type Tab = 'general' | 'overlay' | 'campaign' | 'playing';

const SettingsDialog: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, activeCampaign } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<any>({});
  const [importPreview, setImportPreview] = useState<[string, string][] | null>(null);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importPath, setImportPath] = useState<string | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      loadSettings();
    }
  }, [isSettingsOpen, activeCampaign]);

  const loadSettings = async () => {
    const globalKeys = [
      SETTINGS_KEYS.APP_APPEARANCE,
      SETTINGS_KEYS.WS_PORT,
      SETTINGS_KEYS.WS_FREQUENCY,
      SETTINGS_KEYS.WS_OVERLAY_THEME,
      SETTINGS_KEYS.DATABASE_AUTO_SAVE_INTERVAL
    ];

    const newSettings: any = {};
    for (const key of globalKeys) {
      newSettings[key] = await getGlobalSetting(key);
    }

    if (activeCampaign) {
      const campaignKeys = [
        SETTINGS_KEYS.CAMPAIGN_GAME_SYSTEM,
        SETTINGS_KEYS.CAMPAIGN_FEATURE_TOGGLES,
        SETTINGS_KEYS.CAMPAIGN_IMAGE_STORAGE_PATH,
        SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS,
        SETTINGS_KEYS.PLAYING_LAYOUT_MODE,
        SETTINGS_KEYS.PLAYING_STATUS_ICON_SET
      ];
      for (const key of campaignKeys) {
        newSettings[key] = await getCampaignSetting(activeCampaign.id, key);
      }
    }

    // Set defaults if null
    if (newSettings[SETTINGS_KEYS.WS_PORT] === null) newSettings[SETTINGS_KEYS.WS_PORT] = 3030;
    if (newSettings[SETTINGS_KEYS.WS_FREQUENCY] === null) newSettings[SETTINGS_KEYS.WS_FREQUENCY] = 500;
    if (newSettings[SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS] === null) newSettings[SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS] = [1, 3, 10];

    setSettings(newSettings);
  };

  const updateGlobalSetting = async (key: string, value: any) => {
    await setGlobalSetting(key, value);
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateCampaignSetting = async (key: string, value: any) => {
    if (!activeCampaign) return;
    await setCampaignSetting(activeCampaign.id, key, value);
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      const path = await exportDatabase();
      alert(`Database exported to: ${path}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportSelect = async () => {
    const selected = await open({
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });
    
    if (selected && typeof selected === 'string') {
      const preview = await getImportPreview(selected);
      setImportPath(selected);
      setImportPreview(preview);
      setSelectedImportIds(preview.map(p => p[0]));
    }
  };

  const handleImportExecute = async () => {
    if (!importPath || selectedImportIds.length === 0) return;
    try {
      await importCampaigns(importPath, selectedImportIds);
      alert('Import completed successfully. Existing campaigns were skipped.');
      setImportPreview(null);
      setImportPath(null);
      // Reload the page to show new campaigns
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(`Import failed: ${e}`);
    }
  };

  const handleRestartWs = async () => {
    const port = parseInt(settings[SETTINGS_KEYS.WS_PORT]);
    if (isNaN(port)) return;
    try {
      await invoke('update_websocket_config', { newPort: port });
      alert(`WebSocket server restarted on port ${port}`);
    } catch (e) {
      console.error(e);
      alert(`Failed to restart WebSocket server: ${e}`);
    }
  };

  if (!isSettingsOpen) return null;

  const wsUrl = `http://localhost:${settings[SETTINGS_KEYS.WS_PORT] || 3030}/overlay.html`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-900/50 border-r border-gray-700 p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('overlay')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overlay' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              Overlay & WS
            </button>
            {activeCampaign && (
              <>
                <button 
                  onClick={() => setActiveTab('campaign')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'campaign' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                  Campaign
                </button>
                <button 
                  onClick={() => setActiveTab('playing')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'playing' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                  Playing Screen
                </button>
              </>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Appearance</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200">Dark Mode</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-6"></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Database Management</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={handleExport}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Export Database</span>
                    </button>
                    <button 
                      onClick={handleImportSelect}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Import Campaigns</span>
                    </button>
                  </div>
                </section>

                {importPreview && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <h4 className="text-white font-bold mb-2">Select Campaigns to Import</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                      {importPreview.map(([id, name]) => (
                        <label key={id} className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedImportIds.includes(id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedImportIds([...selectedImportIds, id]);
                              else setSelectedImportIds(selectedImportIds.filter(i => i !== id));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="text-gray-300 text-sm">{name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleImportExecute}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Import Selected
                      </button>
                      <button 
                        onClick={() => setImportPreview(null)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overlay' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">WebSocket Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Server Port</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          value={settings[SETTINGS_KEYS.WS_PORT] || 3030}
                          onChange={(e) => updateGlobalSetting(SETTINGS_KEYS.WS_PORT, e.target.value)}
                          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 flex-1"
                        />
                        <button 
                          onClick={handleRestartWs}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          Restart
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Broadcast Frequency (ms)</label>
                      <input 
                        type="range" min="100" max="2000" step="100"
                        value={settings[SETTINGS_KEYS.WS_FREQUENCY] || 500}
                        onChange={(e) => updateGlobalSetting(SETTINGS_KEYS.WS_FREQUENCY, parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>100ms (Fast)</span>
                        <span>{settings[SETTINGS_KEYS.WS_FREQUENCY] || 500}ms</span>
                        <span>2000ms (Slow)</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Overlay URL</h3>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={wsUrl}
                      readOnly
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 focus:outline-none flex-1"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(wsUrl);
                        alert('URL copied to clipboard');
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'campaign' && activeCampaign && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Campaign Info</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Game System</label>
                      <select 
                        value={settings[SETTINGS_KEYS.CAMPAIGN_GAME_SYSTEM] || 'D&D 5e'}
                        onChange={(e) => updateCampaignSetting(SETTINGS_KEYS.CAMPAIGN_GAME_SYSTEM, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option>D&D 5e</option>
                        <option>Pathfinder 2e</option>
                        <option>Star Trek Adventures</option>
                        <option>Generic/Custom</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Feature Toggles</h3>
                  <div className="space-y-2">
                    {['Factions', 'Quests', 'Inbox', 'History'].map(feature => (
                      <label key={feature} className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-300">{feature}</span>
                        <input 
                          type="checkbox" 
                          defaultChecked={true}
                          className="form-checkbox h-5 w-5 text-blue-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'playing' && activeCampaign && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Health Increments</h3>
                  <div className="flex space-x-2">
                    {[0, 1, 2].map(idx => (
                      <input 
                        key={idx}
                        type="number" 
                        value={settings[SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS]?.[idx] || 0}
                        onChange={(e) => {
                          const newVals = [...(settings[SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS] || [1, 3, 10])];
                          newVals[idx] = parseInt(e.target.value);
                          updateCampaignSetting(SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS, newVals);
                        }}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full"
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Layout Mode</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => updateCampaignSetting(SETTINGS_KEYS.PLAYING_LAYOUT_MODE, 'combat')}
                      className={`p-4 rounded-xl border transition-all text-left ${settings[SETTINGS_KEYS.PLAYING_LAYOUT_MODE] === 'combat' ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                    >
                      <div className="font-bold text-white mb-1">Combat</div>
                      <div className="text-[10px] text-gray-400">Optimized for player tracking and status effects.</div>
                    </button>
                    <button 
                      onClick={() => updateCampaignSetting(SETTINGS_KEYS.PLAYING_LAYOUT_MODE, 'focused')}
                      className={`p-4 rounded-xl border transition-all text-left ${settings[SETTINGS_KEYS.PLAYING_LAYOUT_MODE] === 'focused' ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                    >
                      <div className="font-bold text-white mb-1">Focused</div>
                      <div className="text-[10px] text-gray-400">Heavy emphasis on session notes and lore.</div>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
