import React, { useState } from 'react';
import { useAppContext, View } from '../../store/AppContext';
import QuickAddModal from '../common/QuickAddModal';
import { EntityType } from '../../types';

interface NavItem {
  view: View;
  label: string;
  icon: string;
  isPage?: boolean;
}

const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    setActiveCampaign, 
    featureToggles, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    setSelectedEntity 
  } = useAppContext();
  const [quickAddType, setQuickAddType] = useState<EntityType | null>(null);

  const navItems: NavItem[] = [
    { view: 'Playing' as View, label: 'Playing', icon: '🎮' },
    { view: 'Overview' as View, label: 'Overview', icon: '🏠' },
    { view: 'History' as View, label: 'History', icon: '📜' },
    { view: 'NPCs' as View, label: 'NPCs', icon: '👤' },
    { view: 'Locations' as View, label: 'Locations', icon: '📍' },
    { view: 'Quests' as View, label: 'Quests', icon: '⚔️' },
    { view: 'Factions' as View, label: 'Factions', icon: '🛡️' },
    { view: 'Notes' as View, label: 'Notes', icon: '📝' },
    { view: 'Inbox' as View, label: 'Inbox', icon: '📥' },
  ].filter(item => {
    // If it's a togglable feature, check if it's enabled
    if (['Factions', 'Quests', 'Inbox', 'History'].includes(item.label)) {
      return featureToggles[item.label] !== false;
    }
    return true;
  });

  const extraItems: NavItem[] = [
    { view: 'Players' as any, label: 'Players', icon: '👥', isPage: true }
  ];

  const quickAddItems: { type: EntityType; icon: string }[] = [
    { type: 'NPC', icon: '👤' },
    { type: 'Location', icon: '📍' },
    { type: 'Quest', icon: '📜' },
    { type: 'Faction', icon: '🛡️' },
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-theme-bg-alt border-r border-theme-border flex flex-col h-full overflow-hidden transition-all duration-300 relative`}>
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-20 bg-theme-bg border border-theme-border rounded-full p-1 text-theme-text-muted hover:text-theme-text shadow-sm z-20 transition-colors"
      >
        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={`p-4 border-b border-theme-border flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
        <button
          onClick={() => setActiveCampaign(null)}
          className={`flex items-center space-x-2 text-theme-text-muted hover:text-theme-text transition-colors text-sm font-medium ${isSidebarCollapsed ? 'w-auto' : 'w-full'}`}
          title="Back to Campaigns"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {!isSidebarCollapsed && <span>Back to Campaigns</span>}
        </button>
      </div>

      <nav className={`flex-1 p-4 space-y-2 overflow-y-auto ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`flex items-center rounded-lg transition-all text-sm font-medium ${isSidebarCollapsed ? 'w-10 h-10 justify-center px-0 py-0' : 'w-full px-4 py-2.5 space-x-3'} ${
              currentView === item.view
                ? 'bg-theme-primary text-theme-primary-text shadow-lg shadow-black/10'
                : 'text-theme-text-muted hover:bg-theme-bg hover:text-theme-text'
            }`}
            title={isSidebarCollapsed ? item.label : undefined}
          >
            {isSidebarCollapsed && <span className="text-lg">{item.icon}</span>}
            {!isSidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}

        <div className={`pt-4 pb-2 ${isSidebarCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
          {!isSidebarCollapsed && <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest px-4 mb-2">Campaign Tools</div>}
          {extraItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center rounded-lg transition-all text-sm font-medium ${isSidebarCollapsed ? 'w-10 h-10 justify-center px-0 py-0' : 'w-full px-4 py-2 space-x-3'} ${
                currentView === item.view
                  ? 'bg-theme-bg text-theme-text'
                  : 'text-theme-text-muted hover:bg-theme-bg/50 hover:text-theme-text'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              {isSidebarCollapsed && <span className="text-lg">{item.icon}</span>}
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className={`p-4 border-t border-theme-border space-y-4 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
        <button
          onClick={() => {
            navigator.clipboard.writeText('http://127.0.0.1:3030/overlay.html');
            alert('OBS Browser Source URL copied to clipboard!');
          }}
          className={`flex items-center justify-center bg-theme-primary/10 border border-theme-primary/20 text-theme-primary rounded-lg font-bold hover:bg-theme-primary/20 transition-all ${
            isSidebarCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2 space-x-2 text-xs mb-2'
          }`}
          title="Copy Overlay URL"
        >
          {isSidebarCollapsed ? <span>🔗</span> : <span>Copy Overlay URL</span>}
        </button>
        
        {!isSidebarCollapsed && (
          <div className="text-xs font-bold text-theme-text-muted uppercase tracking-widest px-4">
            Quick Add
          </div>
        )}
        
        <div className={isSidebarCollapsed ? 'flex flex-col space-y-2' : 'grid grid-cols-4 gap-2 px-2'}>
          {quickAddItems.map((item) => (
            <button
              key={item.type}
              onClick={() => setQuickAddType(item.type)}
              className="aspect-square rounded-lg bg-theme-bg-alt hover:bg-theme-bg flex items-center justify-center text-lg transition-colors border border-transparent hover:border-theme-border w-10 h-10"
              title={`Quick Add ${item.type}`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <QuickAddModal 
        type={quickAddType || 'NPC'} 
        isOpen={!!quickAddType} 
        onClose={() => setQuickAddType(null)} 
        onAdded={(created) => {
          if (currentView === 'Playing') {
            // Stay on Playing page, but refresh if needed (AppContext handles broadcast)
            return;
          }
          // Default behavior for other pages: go to detail
          setSelectedEntity(created);
        }}
      />
    </aside>
  );
};

export default Sidebar;
