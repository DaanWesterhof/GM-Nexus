import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Campaign, CampaignEntity } from '../types';

export type View = 'Overview' | 'NPCs' | 'Locations' | 'Quests' | 'Factions' | 'Notes' | 'Inbox' | 'EntityDetail';

interface AppContextType {
  activeCampaign: Campaign | null;
  setActiveCampaign: (campaign: Campaign | null) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedEntity: CampaignEntity | null;
  setSelectedEntity: (entity: CampaignEntity | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentView, setCurrentView] = useState<View>('Overview');
  const [selectedEntity, setSelectedEntity] = useState<CampaignEntity | null>(null);

  const handleSetActiveCampaign = (campaign: Campaign | null) => {
    setActiveCampaign(campaign);
    setSelectedEntity(null);
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
      setSelectedEntity: handleSetSelectedEntity
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
