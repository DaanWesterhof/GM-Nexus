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
  const { currentView, setCurrentView, setActiveCampaign, featureToggles } = useAppContext();
  const [quickAddType, setQuickAddType] = useState<EntityType | null>(null);

  const navItems: NavItem[] = [
    { view: 'Playing' as View, label: 'Playing', icon: '🎮' },
    { view: 'Overview' as View, label: 'Overview', icon: '🏠' },
    { view: 'History' as View, label: 'History', icon: '📜' },
    { view: 'NPCs' as View, label: 'NPCs', icon: '👤' },
    { view: 'Locations' as View, label: 'Locations', icon: '📍' },
    { view: 'Quests' as View, label: 'Quests', icon: '📜' },
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
    <aside className="w-64 bg-theme-bg-alt border-r border-theme-border flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-4 border-b border-theme-border">
        <button
          onClick={() => setActiveCampaign(null)}
          className="w-full flex items-center space-x-2 text-theme-text-muted hover:text-theme-text transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Campaigns</span>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
              currentView === item.view
                ? 'bg-theme-primary text-theme-primary-text shadow-lg shadow-black/10'
                : 'text-theme-text-muted hover:bg-theme-bg hover:text-theme-text'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}

        <div className="pt-4 pb-2">
          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest px-4 mb-2">Campaign Tools</div>
          {extraItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                currentView === item.view
                  ? 'bg-theme-bg text-theme-text'
                  : 'text-theme-text-muted hover:bg-theme-bg/50 hover:text-theme-text'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-theme-border space-y-4">
        <button
          onClick={() => {
            navigator.clipboard.writeText('http://127.0.0.1:3030/overlay.html');
            alert('OBS Browser Source URL copied to clipboard!');
          }}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-theme-primary/10 border border-theme-primary/20 text-theme-primary rounded-lg text-xs font-bold hover:bg-theme-primary/20 transition-all mb-2"
        >
          <span>Copy Overlay URL</span>
        </button>
        <div className="text-xs font-bold text-theme-text-muted uppercase tracking-widest px-4">
          Quick Add
        </div>
        <div className="grid grid-cols-4 gap-2 px-2">
          {quickAddItems.map((item) => (
            <button
              key={item.type}
              onClick={() => setQuickAddType(item.type)}
              className="aspect-square rounded-lg bg-theme-bg-alt hover:bg-theme-bg flex items-center justify-center text-lg transition-colors border border-transparent hover:border-theme-border"
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
