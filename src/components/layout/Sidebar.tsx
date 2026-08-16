import React, { useState } from 'react';
import { useAppContext, View } from '../../store/AppContext';
import QuickAddModal from '../common/QuickAddModal';
import { EntityType } from '../../types';

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, setActiveCampaign } = useAppContext();
  const [quickAddType, setQuickAddType] = useState<EntityType | null>(null);

  const navItems: { view: View; label: string; icon: string }[] = [
    { view: 'Overview', label: 'Overview', icon: '🏠' },
    { view: 'NPCs', label: 'NPCs', icon: '👤' },
    { view: 'Locations', label: 'Locations', icon: '📍' },
    { view: 'Quests', label: 'Quests', icon: '📜' },
    { view: 'Factions', label: 'Factions', icon: '🛡️' },
    { view: 'Notes', label: 'Notes', icon: '📝' },
    { view: 'Inbox', label: 'Inbox', icon: '📥' },
  ];

  const quickAddItems: { type: EntityType; icon: string }[] = [
    { type: 'NPC', icon: '👤' },
    { type: 'Location', icon: '📍' },
    { type: 'Quest', icon: '📜' },
    { type: 'Faction', icon: '🛡️' },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => setActiveCampaign(null)}
          className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
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
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4">
          Quick Add
        </div>
        <div className="grid grid-cols-4 gap-2 px-2">
          {quickAddItems.map((item) => (
            <button
              key={item.type}
              onClick={() => setQuickAddType(item.type)}
              className="aspect-square rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-lg transition-colors border border-transparent hover:border-blue-500/30"
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
      />
    </aside>
  );
};

export default Sidebar;
