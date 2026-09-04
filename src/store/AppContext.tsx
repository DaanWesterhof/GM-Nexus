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

  useEffect(() => {
    const initTheme = async () => {
      const savedTheme = await getGlobalSetting(SETTINGS_KEYS.APP_APPEARANCE);
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Default to dark if not set
        setTheme('dark');
      }
    };
    initTheme();
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
  }, [refreshPlayers, refreshActiveSession, entitiesRefreshTrigger]);

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
      setTheme
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
