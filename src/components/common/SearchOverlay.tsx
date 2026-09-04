import React, { useState, useEffect, useRef } from 'react';
import { CampaignEntity } from '../../types';
import { entityService } from '../../services/entityService';
import { useAppContext } from '../../store/AppContext';

const SearchOverlay: React.FC = () => {
  const { activeCampaign, setSelectedEntity, isSearchOpen, setIsSearchOpen } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CampaignEntity[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const performSearch = async () => {
      if (!activeCampaign || query.length < 2) {
        setResults([]);
        return;
      }
      const searchResults = await entityService.search(activeCampaign.id, query);
      setResults(searchResults);
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query, activeCampaign]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 md:pt-24">
      <div 
        className="w-full max-w-2xl bg-theme-bg border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-theme-border flex items-center space-x-4">
          <svg className="w-6 h-6 text-theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search NPCs, Locations, Quests, Factions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xl text-theme-text focus:outline-none placeholder-theme-text-muted/40"
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="text-xs font-bold text-theme-text-muted hover:text-theme-text border border-theme-border px-2 py-1 rounded transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    setSelectedEntity(entity);
                    setIsSearchOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left p-4 rounded-xl hover:bg-theme-primary group flex items-center justify-between transition-all shadow-sm shadow-transparent hover:shadow-black/10"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-theme-text font-bold group-hover:text-theme-primary-text">{entity.name}</p>
                      <p className="text-theme-text-muted text-xs font-black uppercase tracking-widest group-hover:text-theme-primary-text/80">{entity.type}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-theme-text-muted group-hover:text-theme-primary-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-12 text-center text-theme-text-muted italic">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-12 text-center text-theme-text-muted text-sm">
              Type at least 2 characters to search...
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-theme-bg-alt border-t border-theme-border flex justify-between items-center text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">
          <span>Search in {activeCampaign?.name}</span>
          <span>Powered by SQLite</span>
        </div>
      </div>
      
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default SearchOverlay;
