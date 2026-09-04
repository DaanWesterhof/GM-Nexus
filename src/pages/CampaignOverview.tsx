import React, { useEffect, useState } from 'react';
import { Campaign, CampaignEntity, EntityType } from '../types';
import { entityService } from '../services/entityService';
import QuickAddModal from '../components/common/QuickAddModal';
import { useAppContext } from '../store/AppContext';

interface CampaignOverviewProps {
  campaign: Campaign;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({ campaign }) => {
  const { setCurrentView, setSelectedEntity, entitiesRefreshTrigger } = useAppContext();
  const [stats, setStats] = useState({ npcs: 0, locations: 0, quests: 0, factions: 0 });
  const [recentEntities, setRecentEntities] = useState<CampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddType, setQuickAddType] = useState<EntityType | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, allEntities] = await Promise.all([
          entityService.getStats(campaign.id),
          entityService.getAllByCampaign(campaign.id)
        ]);
        setStats(statsData);
        setRecentEntities(allEntities.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [campaign.id, entitiesRefreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'NPCs', count: stats.npcs, color: 'text-green-400', icon: '👤' },
    { label: 'Locations', count: stats.locations, color: 'text-blue-400', icon: '📍' },
    { label: 'Quests', count: stats.quests, color: 'text-yellow-400', icon: '📜' },
    { label: 'Factions', count: stats.factions, color: 'text-purple-400', icon: '🛡️' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-theme-text">{campaign.name}</h2>
        <p className="text-theme-text-muted mt-1">{campaign.gameSystem} Campaign Overview</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-theme-bg-alt border border-theme-border p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-theme-text-muted text-sm font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-theme-bg-alt border border-theme-border rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-theme-border bg-theme-bg/50 flex justify-between items-center">
            <h3 className="font-bold text-theme-text uppercase tracking-wider text-sm">Recent Entities</h3>
            <button 
              onClick={() => setCurrentView('NPCs')} 
              className="text-xs text-theme-primary hover:text-theme-primary-hover transition-colors font-bold"
            >
              VIEW ALL
            </button>
          </div>
          <div className="divide-y divide-theme-border">
            {recentEntities.length > 0 ? (
              recentEntities.map((entity) => (
                <div 
                  key={entity.id} 
                  onClick={() => setSelectedEntity(entity)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-theme-bg/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-xs text-theme-text-muted group-hover:bg-theme-primary group-hover:text-theme-primary-text transition-colors">
                      {entity.type.substring(0, 1)}
                    </div>
                    <div>
                      <p className="text-theme-text font-medium text-sm group-hover:text-theme-primary transition-colors">{entity.name}</p>
                      <p className="text-theme-text-muted text-xs">{entity.type}</p>
                    </div>
                  </div>
                  <span className="text-theme-text-muted text-[10px]">{new Date(entity.updatedAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-theme-text-muted italic text-sm">
                No entities created yet.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-theme-text uppercase tracking-wider text-sm mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {['NPC', 'Location', 'Quest', 'Faction'].map((type) => (
              <button
                key={type}
                onClick={() => setQuickAddType(type as EntityType)}
                className="flex items-center space-x-3 bg-theme-bg-alt border border-theme-border p-4 rounded-xl hover:bg-theme-bg hover:border-theme-primary/50 transition-all group shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-theme-bg flex items-center justify-center text-theme-primary group-hover:bg-theme-primary group-hover:text-theme-primary-text transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-theme-text font-medium text-sm">Add {type}</span>
              </button>
            ))}
            <button
              onClick={() => setCurrentView('Notes')}
              className="flex items-center space-x-3 bg-theme-bg-alt border border-theme-border p-4 rounded-xl hover:bg-theme-bg hover:border-theme-primary/50 transition-all group shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-theme-bg flex items-center justify-center text-theme-primary group-hover:bg-theme-primary group-hover:text-theme-primary-text transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-theme-text font-medium text-sm">Add Note</span>
            </button>
          </div>
        </section>
      </div>

      <QuickAddModal 
        type={quickAddType || 'NPC'} 
        isOpen={!!quickAddType} 
        onClose={() => setQuickAddType(null)} 
      />
    </div>
  );
};

export default CampaignOverview;
