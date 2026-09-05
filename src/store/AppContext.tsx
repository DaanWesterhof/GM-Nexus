import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Campaign, CampaignEntity, Session, Player } from '../types';
import { playerService } from '../services/playerService';
import { sessionService } from '../services/sessionService';
import { SETTINGS_KEYS, getGlobalSetting, setGlobalSetting } from '../services/settingsService';

import { obsService } from '../services/obsService';
import { listen } from '@tauri-apps/api/event';

export type View = 'Overview' | 'NPCs' | 'Locations' | 'Quests' | 'Factions' | 'Notes' | 'Inbox' | 'EntityDetail' | 'Playing' | 'Players' | 'History';

interface AppContextType {
  activeCampaign: Campaign | null;
  setActiveCampaign: (campaign: Campaign | null) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedEntity: CampaignEntity | null;
  setSelectedEntity: (entity: CampaignEntity | null) => void;
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  refreshPlayers: () => Promise<void>;
  refreshEntities: () => Promise<void>;
  entitiesRefreshTrigger: number;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
  featureToggles: Record<string, boolean>;
  refreshFeatureToggles: () => Promise<void>;
  playingSettings: {
    healthIncrements: number[];
    layoutMode: 'balanced' | 'focused';
  };
  refreshPlayingSettings: () => Promise<void>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentView, setCurrentView] = useState<View>('Overview');
  const [selectedEntity, setSelectedEntity] = useState<CampaignEntity | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [entitiesRefreshTrigger, setEntitiesRefreshTrigger] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setThemeState] = useState<string>('dark');
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [playingSettings, setPlayingSettings] = useState<{
    healthIncrements: number[];
    layoutMode: 'balanced' | 'focused';
  }>({
    healthIncrements: [1, 5, 10],
    layoutMode: 'balanced'
  });
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(false);

  const refreshPlayingSettings = useCallback(async () => {
    if (activeCampaign) {
      const { getCampaignSetting } = await import('../services/settingsService');
      const [increments, layout] = await Promise.all([
        getCampaignSetting(activeCampaign.id, SETTINGS_KEYS.PLAYING_HEALTH_INCREMENTS),
        getCampaignSetting(activeCampaign.id, SETTINGS_KEYS.PLAYING_LAYOUT_MODE)
      ]);
      
      setPlayingSettings({
        healthIncrements: increments || [1, 5, 10],
        layoutMode: layout || 'balanced'
      });
    }
  }, [activeCampaign]);

  const refreshFeatureToggles = useCallback(async () => {
    if (activeCampaign) {
      const { getCampaignSetting } = await import('../services/settingsService');
      const toggles = await getCampaignSetting(activeCampaign.id, SETTINGS_KEYS.CAMPAIGN_FEATURE_TOGGLES);
      setFeatureToggles(toggles || {});
    } else {
      setFeatureToggles({});
    }
  }, [activeCampaign]);

  const setTheme = useCallback(async (newTheme: string) => {
    setThemeState(newTheme);
    
    // Remove all possible theme classes/attributes
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme !== 'light') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    
    await setGlobalSetting(SETTINGS_KEYS.APP_APPEARANCE, newTheme);
  }, []);

  const setIsSidebarCollapsed = useCallback(async (isCollapsed: boolean) => {
    setIsSidebarCollapsedState(isCollapsed);
    await setGlobalSetting(SETTINGS_KEYS.SIDEBAR_COLLAPSED, isCollapsed);
  }, []);

  useEffect(() => {
    const initSettings = async () => {
      const [savedTheme, savedSidebarCollapsed] = await Promise.all([
        getGlobalSetting(SETTINGS_KEYS.APP_APPEARANCE),
        getGlobalSetting(SETTINGS_KEYS.SIDEBAR_COLLAPSED)
      ]);

      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme('dark');
      }

      if (savedSidebarCollapsed !== null) {
        setIsSidebarCollapsedState(!!savedSidebarCollapsed);
      }
    };
    initSettings();
  }, [setTheme]);

  const refreshPlayers = useCallback(async () => {
    if (activeCampaign) {
      const p = await playerService.getByCampaign(activeCampaign.id);
      setPlayers(p);
    } else {
      setPlayers([]);
    }
  }, [activeCampaign]);

  const refreshEntities = useCallback(async () => {
    setEntitiesRefreshTrigger(prev => prev + 1);
  }, []);

  const refreshActiveSession = useCallback(async () => {
    if (activeCampaign) {
      const session = await sessionService.getActiveSession(activeCampaign.id);
      setActiveSession(session);
    } else {
      setActiveSession(null);
    }
  }, [activeCampaign]);

  useEffect(() => {
    refreshPlayers();
    refreshActiveSession();
    refreshFeatureToggles();
    refreshPlayingSettings();
  }, [refreshPlayers, refreshActiveSession, refreshFeatureToggles, refreshPlayingSettings, entitiesRefreshTrigger]);

  useEffect(() => {
    if (activeCampaign) {
      const unlisten = listen('ws-client-connected', () => {
        obsService.broadcastFullSync(activeCampaign.id);
      });
      
      return () => {
        unlisten.then(f => f());
      };
    }
  }, [activeCampaign]);

  const handleSetActiveCampaign = (campaign: Campaign | null) => {
    setActiveCampaign(campaign);
    setSelectedEntity(null);
    setActiveSession(null);
    setPlayers([]);
    if (campaign) {
      setCurrentView('Overview');
    }
  };

  const handleSetSelectedEntity = (entity: CampaignEntity | null) => {
    setSelectedEntity(entity);
    if (entity) {
      setCurrentView('EntityDetail');
    }
  };

  return (
    <AppContext.Provider value={{ 
      activeCampaign, 
      setActiveCampaign: handleSetActiveCampaign, 
      currentView, 
      setCurrentView,
      selectedEntity,
      setSelectedEntity: handleSetSelectedEntity,
      activeSession,
      setActiveSession,
      players,
      setPlayers,
      refreshPlayers,
      refreshEntities,
      entitiesRefreshTrigger,
      isSearchOpen,
      setIsSearchOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      theme,
      setTheme,
      featureToggles,
      refreshFeatureToggles,
      playingSettings,
      refreshPlayingSettings,
      isSidebarCollapsed,
      setIsSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
