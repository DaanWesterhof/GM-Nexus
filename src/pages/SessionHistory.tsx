import React, { useEffect, useState } from 'react';
import { Campaign, Session, SessionEvent } from '../types';
import { sessionService } from '../services/sessionService';

interface SessionHistoryProps {
  campaign: Campaign;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ campaign }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await sessionService.getByCampaign(campaign.id);
        setSessions(data);
        if (data.length > 0) {
          handleSelectSession(data[0]);
        }
      } catch (error) {
        console.error('Failed to load session history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [campaign.id]);

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    const sessionEvents = await sessionService.getEvents(session.id);
    setEvents(sessionEvents);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-theme-text">Session History</h2>
        <p className="text-theme-text-muted mt-1">Review past sessions and events for {campaign.name}</p>
      </header>

      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Session List */}
        <aside className="w-1/3 bg-theme-bg-alt border border-theme-border rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50">
            <h3 className="font-bold text-theme-text uppercase tracking-wider text-xs">Past Sessions</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-theme-border">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full px-6 py-4 text-left transition-colors hover:bg-theme-bg/50 ${
                    selectedSession?.id === session.id ? 'bg-theme-bg border-l-4 border-theme-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-theme-text font-bold">{session.name}</div>
                      <div className="text-xs text-theme-text-muted mt-1">
                        {new Date(session.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    {session.isActive && (
                      <span className="bg-green-600/20 text-green-500 text-[10px] px-2 py-0.5 rounded font-black uppercase">Active</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-theme-text-muted italic text-sm">
                No sessions found.
              </div>
            )}
          </div>
        </aside>

        {/* Session Details */}
        <main className="flex-1 bg-theme-bg-alt border border-theme-border rounded-2xl flex flex-col overflow-hidden shadow-lg">
          {selectedSession ? (
            <>
              <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-theme-text text-lg">{selectedSession.name}</h3>
                  <div className="text-xs text-theme-text-muted">
                    Started: {new Date(selectedSession.startDate).toLocaleString()}
                    {selectedSession.endDate && ` • Ended: ${new Date(selectedSession.endDate).toLocaleString()}`}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Notes */}
                <section>
                  <h4 className="text-xs font-black text-theme-primary uppercase tracking-widest mb-3">Session Notes</h4>
                  <div className="bg-theme-bg border border-theme-border rounded-xl p-4 text-theme-text text-sm whitespace-pre-wrap min-h-[100px]">
                    {selectedSession.notes || 'No notes for this session.'}
                  </div>
                </section>

                {/* Events */}
                <section>
                  <h4 className="text-xs font-black text-theme-primary uppercase tracking-widest mb-3">Events Log</h4>
                  <div className="space-y-3">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <div key={event.id} className="flex space-x-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-theme-primary mt-2"></div>
                            <div className="w-0.5 flex-1 bg-theme-border my-1"></div>
                          </div>
                          <div className="pb-4">
                            <div className="text-[10px] text-theme-text-muted">{new Date(event.timestamp).toLocaleTimeString()}</div>
                            <div className="text-theme-text text-sm mt-0.5">{event.text}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-theme-text-muted italic text-sm">No events logged.</p>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-theme-text-muted italic">
              Select a session to view details
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SessionHistory;
