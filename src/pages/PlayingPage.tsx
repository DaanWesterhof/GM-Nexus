import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { sessionService } from '../services/sessionService';
import { entityService } from '../services/entityService';
import { creatureService } from '../services/creatureService';
import PlayerCard from '../components/campaign/PlayerCard';
import CreatureCard from '../components/campaign/CreatureCard';
import { SessionEvent, EntityType, CampaignEntity, Creature } from '../types';
import QuickAddModal from '../components/common/QuickAddModal';
import QuickAddCreatureModal from '../components/common/QuickAddCreatureModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const PlayingPage: React.FC = () => {
  const { activeCampaign, activeSession, setActiveSession, players, setCurrentView, setSelectedEntity, entitiesRefreshTrigger, playingSettings } = useAppContext();
  const layoutMode = playingSettings.layoutMode as string;
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [newEventText, setNewEventText] = useState('');
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [bookSubView, setBookSubView] = useState<EntityType | 'Note' | null>(null);
  const [entities, setEntities] = useState<CampaignEntity[]>([]);
  const [inSceneNpcs, setInSceneNpcs] = useState<CampaignEntity[]>([]);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [quickAddType, setQuickAddType] = useState<EntityType | null>(null);
  const [isQuickAddCreatureOpen, setIsQuickAddCreatureOpen] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [creatureToDelete, setCreatureToDelete] = useState<string | null>(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  useEffect(() => {
    if (activeCampaign) {
      loadCreatures();
      loadInSceneNpcs();
    }
  }, [activeCampaign]);

  useEffect(() => {
    if (activeSession) {
      loadEvents();
    }
  }, [activeSession]);

  useEffect(() => {
    if (isBookOpen && bookSubView && activeCampaign) {
      loadEntities();
    }
  }, [isBookOpen, bookSubView, activeCampaign, entitiesRefreshTrigger]);

  const loadEntities = async () => {
    if (!activeCampaign || !bookSubView) return;
    setLoadingEntities(true);
    try {
      const data = await entityService.getAllByCampaign(activeCampaign.id, bookSubView === 'Note' ? 'Note' as EntityType : bookSubView);
      setEntities(data);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const loadCreatures = async () => {
    if (!activeCampaign) return;
    try {
      const data = await creatureService.getAllByCampaign(activeCampaign.id);
      setCreatures(data);
    } catch (error) {
      console.error('Failed to load creatures:', error);
    }
  };

  const loadInSceneNpcs = async () => {
    if (!activeCampaign) return;
    try {
      const data = await entityService.getInScene(activeCampaign.id);
      setInSceneNpcs(data);
    } catch (error) {
      console.error('Failed to load in-scene NPCs:', error);
    }
  };

  const handleToggleNpcScene = async (npc: CampaignEntity) => {
    const newState = !npc.inScene;
    
    // If adding to scene for the first time or health is missing, set defaults
    const updates: Partial<CampaignEntity> = { inScene: newState };
    if (newState && (npc.currentHealth === undefined || npc.currentHealth === null)) {
      updates.currentHealth = 10;
    }
    if (newState && (npc.maxHealth === undefined || npc.maxHealth === null)) {
      updates.maxHealth = 10;
    }

    await entityService.update(npc.id, updates);
    loadInSceneNpcs();
    if (isBookOpen) loadEntities();
  };

  const handleDeleteCreature = async (id: string) => {
    setCreatureToDelete(id);
  };

  const confirmDeleteCreature = async () => {
    if (creatureToDelete) {
      await creatureService.delete(creatureToDelete);
      setCreatureToDelete(null);
      loadCreatures();
    }
  };

  const loadEvents = async () => {
    if (activeSession) {
      const e = await sessionService.getEvents(activeSession.id);
      setEvents(e);
    }
  };

  const handleStartSession = async () => {
    if (!activeCampaign) return;
    try {
      const nextNum = await sessionService.getNextSessionNumber(activeCampaign.id);
      const session = await sessionService.startSession({
        id: crypto.randomUUID(),
        campaignId: activeCampaign.id,
        name: `Session ${nextNum}`,
        sessionNumber: nextNum,
        notes: ''
      });
      setActiveSession(session);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Check console for details.');
    }
  };

  const handleEndSession = async () => {
    setShowEndSessionConfirm(true);
  };

  const confirmEndSession = async () => {
    if (!activeSession) return;
    await sessionService.endSession(activeSession.id);
    setActiveSession(null);
    setShowEndSessionConfirm(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !newEventText.trim()) return;

    await sessionService.addEvent({
      id: crypto.randomUUID(),
      sessionId: activeSession.id,
      text: newEventText
    });
    setNewEventText('');
    loadEvents();
  };

  const handleUpdateNotes = async () => {
    if (!activeSession) return;
    await sessionService.updateSession(activeSession.id, { notes: sessionNotes });
  };

  if (!activeCampaign) return null;

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-theme-text mb-2">Ready to Play?</h2>
          <p className="text-theme-text-muted">Start a session to manage players and log events.</p>
        </div>
        <button
          onClick={handleStartSession}
          className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-8 py-4 rounded-2xl text-xl font-bold transition-all shadow-lg shadow-black/20"
        >
          Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden -m-8">
      {/* Playing Header */}
      <header className="bg-theme-bg-alt border-b border-theme-border px-8 py-4 flex justify-between items-center shadow-lg z-10">
        <div>
          <div className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Active Session</div>
          <h2 className="text-xl font-bold text-theme-text">{activeSession.name}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsBookOpen(!isBookOpen)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
              isBookOpen ? 'bg-theme-primary border-theme-primary text-theme-primary-text' : 'bg-theme-bg border-theme-border text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            Campaign Book
          </button>
          <button 
            onClick={() => setCurrentView('History')}
            className="px-4 py-2 bg-theme-bg border border-theme-border text-theme-text-muted rounded-lg font-bold text-sm hover:bg-theme-bg-alt hover:text-theme-text transition-all"
          >
            History
          </button>
          <button 
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-500 rounded-lg font-bold text-sm hover:bg-red-600/20 transition-all"
          >
            End Session
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 overflow-auto p-8 transition-all duration-500 ${isBookOpen ? 'pr-4' : ''}`}>
          {layoutMode === 'focused' ? (
            <div className="grid grid-cols-12 gap-8 h-full max-w-[1600px] mx-auto">
              {/* Left Column: Players (Stacked) */}
              <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center sticky top-0 bg-theme-bg/80 backdrop-blur-md z-10 py-2">
                  <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest">Players</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {players.map(player => (
                    <div key={player.id} className="w-full">
                      <PlayerCard player={player} activeSessionId={activeSession?.id} />
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-theme-border rounded-3xl bg-theme-bg-alt/30">
                      <p className="text-theme-text-muted italic text-xs">No players.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Column: Session Events and Notes */}
              <div className="col-span-6 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                {/* Events Log */}
                <section className="bg-theme-bg-alt border border-theme-border rounded-2xl overflow-hidden flex flex-col shadow-lg h-[400px]">
                  <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
                    <h3 className="font-bold text-theme-text uppercase tracking-wider text-xs">Session Events</h3>
                  </div>
                  <div className="p-4 border-b border-theme-border">
                    <form onSubmit={handleAddEvent} className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="What happened?..."
                        value={newEventText}
                        onChange={(e) => setNewEventText(e.target.value)}
                        className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                      />
                      <button type="submit" className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">Add</button>
                    </form>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="flex flex-col space-y-1">
                        <div className="text-[10px] text-theme-text-muted">{new Date(event.timestamp).toLocaleTimeString()}</div>
                        <div className="bg-theme-bg p-3 rounded-lg border border-theme-border text-sm text-theme-text shadow-sm">
                          {event.text}
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-center py-10 text-theme-text-muted italic text-sm">No events recorded yet.</div>
                    )}
                  </div>
                </section>

                {/* Session Notes */}
                <section className="bg-theme-bg-alt border border-theme-border rounded-2xl overflow-hidden flex flex-col shadow-lg h-[600px]">
                  <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
                    <h3 className="font-bold text-theme-text uppercase tracking-wider text-xs">Session Notes</h3>
                    <button 
                      onClick={handleUpdateNotes}
                      className="text-[10px] text-theme-primary hover:text-theme-primary-hover font-bold transition-colors"
                    >SAVE NOTES</button>
                  </div>
                  <textarea 
                    className="flex-1 bg-theme-bg p-6 text-theme-text focus:outline-none resize-none font-mono text-lg leading-relaxed"
                    placeholder="Focus on the story here..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    onBlur={handleUpdateNotes}
                  />
                </section>
              </div>

              {/* Right Column: NPCs and Creatures */}
              <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center sticky top-0 bg-theme-bg/80 backdrop-blur-md z-10 py-2">
                  <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest">Scene Entities</h3>
                  <button 
                    onClick={() => setIsQuickAddCreatureOpen(true)}
                    className="bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary px-2 py-1 rounded-lg text-[9px] font-black transition-all border border-theme-primary/20"
                  >
                    + ADD
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {inSceneNpcs.map(npc => (
                    <CreatureCard key={npc.id} npc={npc} onUpdate={loadInSceneNpcs} />
                  ))}
                  {creatures.map(creature => (
                    <CreatureCard 
                      key={creature.id} 
                      creature={creature} 
                      onUpdate={loadCreatures} 
                      onDelete={() => handleDeleteCreature(creature.id)} 
                    />
                  ))}
                  {inSceneNpcs.length === 0 && creatures.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-theme-border rounded-3xl bg-theme-bg-alt/30">
                      <p className="text-theme-text-muted italic text-xs">The scene is empty.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-8 ${layoutMode === 'focused' ? 'max-w-6xl mx-auto' : ''}`}>
              
              {/* Players Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest">Players</h3>
                </div>
                <div className={`grid gap-6 ${
                  layoutMode === 'focused'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {players.map(player => (
                    <div key={player.id} className={layoutMode === 'focused' ? 'h-32' : ''}>
                      <PlayerCard player={player} activeSessionId={activeSession?.id} />
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="col-span-full py-10 text-center border-2 border-dashed border-theme-border rounded-3xl bg-theme-bg-alt/30">
                      <p className="text-theme-text-muted italic text-sm">No players in this campaign yet.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Scene Entities Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest">Scene Entities</h3>
                  <button 
                    onClick={() => setIsQuickAddCreatureOpen(true)}
                    className="bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary px-3 py-1 rounded-lg text-[10px] font-black transition-all border border-theme-primary/20"
                  >
                    + QUICK ADD CREATURE
                  </button>
                </div>
                <div className={`grid gap-6 ${
                  layoutMode === 'focused'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {inSceneNpcs.map(npc => (
                    <CreatureCard key={npc.id} npc={npc} onUpdate={loadInSceneNpcs} />
                  ))}
                  {creatures.map(creature => (
                    <CreatureCard 
                      key={creature.id} 
                      creature={creature} 
                      onUpdate={loadCreatures} 
                      onDelete={() => handleDeleteCreature(creature.id)} 
                    />
                  ))}
                  {inSceneNpcs.length === 0 && creatures.length === 0 && (
                    <div className="col-span-full py-10 text-center border-2 border-dashed border-theme-border rounded-3xl bg-theme-bg-alt/30">
                      <p className="text-theme-text-muted italic text-sm">The scene is currently empty.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Logs & Notes Section */}
              <div className={`grid gap-8 pb-12 ${
                layoutMode === 'focused' 
                  ? 'grid-cols-1' 
                  : 'grid-cols-1 lg:grid-cols-2'
              }`}>
                {/* Events Log */}
                <section className="bg-theme-bg-alt border border-theme-border rounded-2xl overflow-hidden flex flex-col shadow-lg h-[400px]">
                  <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
                    <h3 className="font-bold text-theme-text uppercase tracking-wider text-xs">Session Events</h3>
                  </div>
                  <div className="p-4 border-b border-theme-border">
                    <form onSubmit={handleAddEvent} className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="What happened?..."
                        value={newEventText}
                        onChange={(e) => setNewEventText(e.target.value)}
                        className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                      />
                      <button type="submit" className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">Add</button>
                    </form>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="flex flex-col space-y-1">
                        <div className="text-[10px] text-theme-text-muted">{new Date(event.timestamp).toLocaleTimeString()}</div>
                        <div className="bg-theme-bg p-3 rounded-lg border border-theme-border text-sm text-theme-text shadow-sm">
                          {event.text}
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-center py-10 text-theme-text-muted italic text-sm">No events recorded yet.</div>
                    )}
                  </div>
                </section>

                {/* Session Notes */}
                <section className={`bg-theme-bg-alt border border-theme-border rounded-2xl overflow-hidden flex flex-col shadow-lg ${
                  layoutMode === 'focused' ? 'h-[600px]' : 'h-[400px]'
                }`}>
                  <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
                    <h3 className="font-bold text-theme-text uppercase tracking-wider text-xs">Session Notes</h3>
                    <button 
                      onClick={handleUpdateNotes}
                      className="text-[10px] text-theme-primary hover:text-theme-primary-hover font-bold transition-colors"
                    >SAVE NOTES</button>
                  </div>
                  <textarea 
                    className={`flex-1 bg-theme-bg p-6 text-theme-text focus:outline-none resize-none font-mono leading-relaxed ${
                      layoutMode === 'focused' ? 'text-lg' : 'text-sm'
                    }`}
                    placeholder={layoutMode === 'focused' ? "Focus on the story here..." : "Private session notes..."}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    onBlur={handleUpdateNotes}
                  />
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Book Sidebar/Drawer */}
        <div 
          className={`bg-theme-bg-alt border-l border-theme-border transition-all duration-500 ease-in-out flex flex-col shadow-2xl ${
            isBookOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="flex-1 overflow-auto p-6 flex flex-col h-full">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center space-x-2">
                 {bookSubView && (
                   <button 
                     onClick={() => setBookSubView(null)}
                     className="text-theme-text-muted hover:text-theme-text mr-2 transition-colors"
                   >
                     ←
                   </button>
                 )}
                 <h3 className="text-xl font-bold text-theme-text">
                   {bookSubView ? `${bookSubView}s` : 'Campaign Book'}
                 </h3>
               </div>
               <button onClick={() => setIsBookOpen(false)} className="text-theme-text-muted hover:text-theme-text text-2xl leading-none transition-colors">&times;</button>
             </div>
             
             {!bookSubView ? (
               <div className="space-y-4">
                 <p className="text-sm text-theme-text-muted italic">Quick Access to your campaign notes and entities.</p>
                 <div className="grid grid-cols-2 gap-2">
                   {[
                     { type: 'NPC', label: 'NPCs' },
                     { type: 'Location', label: 'Locations' },
                     { type: 'Quest', label: 'Quests' },
                     { type: 'Faction', label: 'Factions' },
                   ].map(item => (
                     <button 
                       key={item.type}
                       onClick={() => setBookSubView(item.type as EntityType)}
                       className="bg-theme-bg border border-theme-border p-3 rounded-lg text-sm text-theme-text hover:bg-theme-bg-alt hover:border-theme-primary transition-all text-left flex items-center space-x-2 shadow-sm"
                     >
                       <span>{item.label}</span>
                     </button>
                   ))}
                   <button 
                     onClick={() => setBookSubView('Note')}
                     className="bg-theme-bg border border-theme-border p-3 rounded-lg text-sm text-theme-text hover:bg-theme-bg-alt hover:border-theme-primary transition-all text-left flex items-center space-x-2 shadow-sm"
                   >
                     <span>Notes</span>
                   </button>
                 </div>
                 
                 <div className="pt-4 border-t border-theme-border">
                    <h4 className="text-xs font-bold text-theme-text-muted uppercase mb-3">Quick Create</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['NPC', 'Location', 'Quest', 'Faction'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setQuickAddType(type as EntityType)}
                          className="bg-theme-primary/10 border border-theme-primary/30 text-theme-primary p-2 rounded text-[10px] font-bold hover:bg-theme-primary/20 transition-all"
                        >
                          + NEW {type}
                        </button>
                      ))}
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col min-h-0">
                 <div className="mb-4 flex justify-between items-center">
                    <span className="text-xs text-theme-text-muted">{entities.length} {bookSubView}s found</span>
                    <button 
                      onClick={() => {
                        if (bookSubView !== 'Note') setQuickAddType(bookSubView as EntityType);
                      }}
                      className="text-[10px] text-theme-primary font-bold hover:text-theme-primary-hover transition-colors"
                    >
                      + ADD NEW
                    </button>
                 </div>

                 {loadingEntities ? (
                   <div className="flex-1 flex items-center justify-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                   </div>
                 ) : (
                   <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                     {entities.length > 0 ? (
                       entities.map(entity => (
                         <div 
                           key={entity.id}
                           className="bg-theme-bg border border-theme-border p-3 rounded-lg hover:bg-theme-bg-alt hover:border-theme-primary transition-all group relative shadow-sm"
                         >
                           <div 
                             className="cursor-pointer"
                             onClick={() => {
                               setSelectedEntity(entity);
                               setCurrentView('EntityDetail');
                             }}
                           >
                             <h4 className="text-theme-text font-medium text-sm group-hover:text-theme-primary transition-colors">{entity.name}</h4>
                             {entity.description && (
                               <p className="text-theme-text-muted text-xs mt-1 line-clamp-2">{entity.description}</p>
                             )}
                           </div>
                          
                           {bookSubView === 'NPC' && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleToggleNpcScene(entity);
                               }}
                               className={`absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-lg ${
                                 entity.inScene 
                                   ? 'bg-red-600 hover:bg-red-700 text-white opacity-100' 
                                   : 'bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text opacity-0 group-hover:opacity-100'
                               }`}
                               title={entity.inScene ? "Remove from Scene" : "Add to Scene"}
                             >
                               <span className="text-lg leading-none">{entity.inScene ? '×' : '+'}</span>
                             </button>
                           )}
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-10 text-theme-text-muted italic text-sm">
                         No {bookSubView}s found.
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>

      <QuickAddModal 
        type={quickAddType || 'NPC'} 
        isOpen={!!quickAddType} 
        onClose={() => setQuickAddType(null)} 
      />

      <QuickAddCreatureModal 
        isOpen={isQuickAddCreatureOpen}
        onClose={() => {
          setIsQuickAddCreatureOpen(false);
        }}
        onAdded={loadCreatures}
      />

      <ConfirmDialog
        isOpen={creatureToDelete !== null}
        title="Remove Creature"
        message="Are you sure you want to remove this creature from the scene?"
        onConfirm={confirmDeleteCreature}
        onCancel={() => setCreatureToDelete(null)}
      />

      <ConfirmDialog
        isOpen={showEndSessionConfirm}
        title="End Session"
        message="Are you sure you want to end this session?"
        confirmLabel="End Session"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndSessionConfirm(false)}
        isDestructive={false}
      />
    </div>
  );
};

export default PlayingPage;
