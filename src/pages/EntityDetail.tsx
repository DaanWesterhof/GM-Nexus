import React, { useEffect, useState } from 'react';
import { CampaignEntity, Relationship } from '../types';
import { entityService, relationshipService } from '../services/entityService';
import { useAppContext } from '../store/AppContext';
import EntityModal from '../components/common/EntityModal';
import { getRelationshipWording } from '../constants/relationships';

const EntityDetail: React.FC = () => {
  const { selectedEntity, setSelectedEntity, activeCampaign, setCurrentView } = useAppContext();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relatedEntities, setRelatedEntities] = useState<Record<string, CampaignEntity>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedEntity) {
      loadDetails();
    }
  }, [selectedEntity?.id]);

  const loadDetails = async () => {
    if (!selectedEntity || !activeCampaign) return;
    try {
      setLoading(true);
      const rels = await relationshipService.getForEntity(selectedEntity.id);
      setRelationships(rels);

      const allEntities = await entityService.getAllByCampaign(activeCampaign.id);
      const entityMap: Record<string, CampaignEntity> = {};
      allEntities.forEach(e => {
        entityMap[e.id] = e;
      });
      setRelatedEntities(entityMap);
    } catch (error) {
      console.error('Failed to load entity details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedEntity || !activeCampaign) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSave = async (data: Partial<CampaignEntity>) => {
    try {
      await entityService.update(selectedEntity.id, data);
      const updated = await entityService.getById(selectedEntity.id);
      if (updated) setSelectedEntity(updated);
      loadDetails();
    } catch (error) {
      console.error('Failed to update entity:', error);
      alert('Failed to save changes');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl shadow-lg">
            {selectedEntity.type === 'NPC' ? '👤' : 
             selectedEntity.type === 'Location' ? '📍' : 
             selectedEntity.type === 'Quest' ? '📜' : '🛡️'}
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">{selectedEntity.name}</h2>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-blue-500 font-black uppercase tracking-widest text-sm">{selectedEntity.type}</span>
              {selectedEntity.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedEntity.status === 'Active' ? 'bg-green-900 text-green-400' :
                  selectedEntity.status === 'Completed' ? 'bg-blue-900 text-blue-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {selectedEntity.status}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            EDIT
          </button>
          <button 
            onClick={() => setCurrentView(selectedEntity.type + 's' as any)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-400"
          >
            CLOSE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Description</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-gray-300 leading-relaxed">
              {selectedEntity.description || <span className="italic text-gray-600">No description provided.</span>}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">GM Notes</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-gray-300 font-mono text-sm whitespace-pre-wrap min-h-[100px]">
              {selectedEntity.notes || <span className="italic text-gray-600">No notes yet.</span>}
            </div>
          </section>

          {selectedEntity.type === 'Quest' && (
            <section>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Objectives</h3>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 italic text-gray-600">
                Objectives management coming soon...
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 text-center lg:text-left">Relationships</h3>
            <div className="space-y-3">
              {relationships.length > 0 ? (
                relationships.map(rel => {
                  const isSource = rel.sourceEntityId === selectedEntity.id;
                  const targetId = isSource ? rel.targetEntityId : rel.sourceEntityId;
                  const target = relatedEntities[targetId];
                  
                  return (
                    <div 
                      key={rel.id} 
                      onClick={() => target && setSelectedEntity(target)}
                      className="bg-gray-800 border border-gray-700 p-4 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">
                          {getRelationshipWording(rel.relationshipType, isSource)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold group-hover:text-blue-400 transition-colors">
                            {target?.name || 'Unknown Entity'}
                          </span>
                          <span className="text-gray-600 text-[10px] uppercase font-bold">{target?.type}</span>
                        </div>
                        {rel.notes && <p className="text-gray-500 text-[11px] mt-1 italic">{rel.notes}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-gray-800/30 border border-gray-700 border-dashed rounded-xl text-xs text-gray-600 italic">
                  No relationships.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <EntityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedEntity}
        type={selectedEntity.type}
        campaignId={activeCampaign.id}
      />
    </div>
  );
};

export default EntityDetail;
