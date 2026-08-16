import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { sessionService } from '../services/sessionService';
import PlayerCard from '../components/campaign/PlayerCard';
import { SessionEvent } from '../types';

const PlayingPage: React.FC = () => {
  const { activeCampaign, activeSession, setActiveSession, players } = useAppContext();
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [newEventText, setNewEventText] = useState('');
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (activeSession) {
      loadEvents();
      setSessionNotes(activeSession.notes || '');
    }
  }, [activeSession]);

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
    if (!activeSession) return;
    if (window.confirm('End this session?')) {
      await sessionService.endSession(activeSession.id);
      setActiveSession(null);
    }
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
          <h2 className="text-3xl font-black text-white mb-2">Ready to Play?</h2>
          <p className="text-gray-400">Start a session to manage players and log events.</p>
        </div>
        <button
          onClick={handleStartSession}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all shadow-lg shadow-blue-900/40"
        >
          Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden -m-8">
      {/* Playing Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center shadow-lg z-10">
        <div>
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Session</div>
          <h2 className="text-xl font-bold text-white">{activeSession.name}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsBookOpen(!isBookOpen)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
              isBookOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-650'
            }`}
          >
            📖 Campaign Book
          </button>
          <button 
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg font-bold text-sm hover:bg-red-900/40 transition-all"
          >
            End Session
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content: Player Cards */}
        <div className={`flex-1 overflow-auto p-8 transition-all duration-500 ${isBookOpen ? 'pr-4' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map(player => (
              <PlayerCard key={player.id} player={player} activeSessionId={activeSession.id} />
            ))}
            {players.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <p className="text-gray-600 italic">No players in this campaign yet.</p>
              </div>
            )}
          </div>
          
          {/* Session Footer Area */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            {/* Events Log */}
            <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">Session Events</h3>
              </div>
              <div className="p-4 border-b border-gray-700">
                <form onSubmit={handleAddEvent} className="flex space-x-2">
                  <input 
                    type="text"
                    placeholder="What happened?..."
                    value={newEventText}
                    onChange={(e) => setNewEventText(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                </form>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {events.map(event => (
                  <div key={event.id} className="flex flex-col space-y-1">
                    <div className="text-[10px] text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div className="bg-gray-750 p-3 rounded-lg border border-gray-700 text-sm text-gray-200">
                      {event.text}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-10 text-gray-600 italic text-sm">No events recorded yet.</div>
                )}
              </div>
            </section>

            {/* Session Notes */}
            <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">Session Notes</h3>
                <button 
                  onClick={handleUpdateNotes}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                >SAVE NOTES</button>
              </div>
              <textarea 
                className="flex-1 bg-gray-900 p-6 text-gray-300 focus:outline-none resize-none"
                placeholder="Private session notes, player thoughts, future hooks..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                onBlur={handleUpdateNotes}
              />
            </section>
          </div>
        </div>

        {/* Campaign Book Sidebar/Drawer */}
        <div 
          className={`bg-gray-900 border-l border-gray-700 transition-all duration-500 ease-in-out flex flex-col ${
            isBookOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="flex-1 overflow-auto p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Campaign Book</h3>
               <button onClick={() => setIsBookOpen(false)} className="text-gray-500 hover:text-white">&times;</button>
             </div>
             
             {/* Simple list of entities for now, in a real app we'd reuse CampaignOverview/Sidebar logic */}
             <div className="space-y-4">
               <p className="text-sm text-gray-400 italic">Quick Access to your campaign notes and entities.</p>
               <div className="grid grid-cols-2 gap-2">
                 {['NPC', 'Location', 'Quest', 'Faction', 'Note'].map(type => (
                   <button 
                    key={type}
                    className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-sm text-white hover:bg-gray-700 text-left flex items-center space-x-2"
                   >
                     <span>{type}s</span>
                   </button>
                 ))}
               </div>
               
               <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Quick Create</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['NPC', 'Location', 'Quest', 'Faction'].map(type => (
                      <button 
                        key={type}
                        className="bg-blue-900/20 border border-blue-900/50 text-blue-400 p-2 rounded text-[10px] font-bold hover:bg-blue-900/40"
                      >
                        + NEW {type}
                      </button>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingPage;
