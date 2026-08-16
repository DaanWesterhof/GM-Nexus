import React from 'react';
import Layout from "./components/layout/Layout";
import CampaignSelector from "./pages/CampaignSelector";
import CampaignOverview from "./pages/CampaignOverview";
import { useAppContext } from "./store/AppContext";

import NPCManagement from "./pages/NPCManagement";
import EntityManager from "./pages/EntityManager";
import EntityDetail from "./pages/EntityDetail";
import InboxManagement from "./pages/InboxManagement";
import NotesManagement from "./pages/NotesManagement";

const AppContent: React.FC = () => {
  const { activeCampaign, currentView } = useAppContext();

  const renderView = () => {
    if (!activeCampaign) return <CampaignSelector />;

    switch (currentView) {
      case 'Overview':
        return <CampaignOverview campaign={activeCampaign} />;
      case 'NPCs':
        return <NPCManagement campaign={activeCampaign} />;
      case 'Locations':
        return (
          <EntityManager 
            campaign={activeCampaign} 
            type="Location" 
            title="Locations" 
            description="Places and landmarks in your campaign." 
            icon="📍" 
          />
        );
      case 'Quests':
        return (
          <EntityManager 
            campaign={activeCampaign} 
            type="Quest" 
            title="Quests" 
            description="Adventures and objectives for your players." 
            icon="📜" 
          />
        );
      case 'Factions':
        return (
          <EntityManager 
            campaign={activeCampaign} 
            type="Faction" 
            title="Factions" 
            description="Organizations and groups competing for power." 
            icon="🛡️" 
          />
        );
      case 'EntityDetail':
        return <EntityDetail />;
      case 'Notes':
        return <NotesManagement campaign={activeCampaign} />;
      case 'Inbox':
        return <InboxManagement campaign={activeCampaign} />;
      default:
        return <CampaignOverview campaign={activeCampaign} />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
};

export default AppContent;
