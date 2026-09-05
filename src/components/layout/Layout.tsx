import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAppContext } from '../../store/AppContext';
import SearchOverlay from '../common/SearchOverlay';
import SettingsDialog from '../dialogs/SettingsDialog';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeCampaign, setIsSearchOpen, setIsSettingsOpen, isSidebarCollapsed } = useAppContext();

  return (
    <div className="h-screen bg-theme-bg text-theme-text flex flex-col overflow-hidden transition-colors">
      {activeCampaign && <SearchOverlay />}
      <SettingsDialog />
      <header className="bg-theme-bg-alt border-b border-theme-border p-4 flex justify-between items-center z-10 transition-colors">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-black tracking-tighter text-theme-primary">GM NEXUS</h1>
          {activeCampaign && (
            <div className={`flex items-center space-x-2 transition-all duration-300 ${isSidebarCollapsed ? 'ml-4' : 'ml-0'}`}>
              <span className="text-theme-text-muted">/</span>
              <span className="text-theme-text font-medium">{activeCampaign.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search campaign..." 
              className="bg-theme-bg border border-theme-border rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-theme-primary w-64 transition-all cursor-pointer text-theme-text"
              readOnly
              onClick={() => setIsSearchOpen(true)}
            />
            <span className="absolute right-3 top-2 text-theme-text-muted text-xs font-mono pointer-events-none">⌘K</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {activeCampaign && <Sidebar />}
        <main className="flex-1 overflow-auto p-8 relative bg-theme-bg transition-colors">
          {children}
        </main>
      </div>
      
      <footer className="bg-theme-bg-alt border-t border-theme-border p-2 text-center text-[10px] text-theme-text-muted font-medium transition-colors">
        GM NEXUS PHASE 2 &bull; LOCAL FIRST ARCHITECTURE
      </footer>
    </div>
  );
};

export default Layout;
