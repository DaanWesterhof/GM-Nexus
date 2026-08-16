import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Campaign, CampaignEntity, Session, Player } from '../types';
import { playerService } from '../services/playerService';
import { sessionService } from '../services/sessionService';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentView, setCurrentView] = useState<View>('Overview');
  const [selectedEntity, setSelectedEntity] = useState<CampaignEntity | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [entitiesRefreshTrigger, setEntitiesRefreshTrigger] = useState(0);

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
      entitiesRefreshTrigger
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
