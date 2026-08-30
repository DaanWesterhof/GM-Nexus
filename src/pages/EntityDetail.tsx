import React, { useEffect, useState } from 'react';
import { CampaignEntity, Relationship } from '../types';
import { entityService, relationshipService } from '../services/entityService';
import { useAppContext } from '../store/AppContext';
import EntityModal from '../components/common/EntityModal';
import { getRelationshipWording } from '../constants/relationships';
import { convertFileSrc } from '@tauri-apps/api/core';

const EntityDetail: React.FC = () => {
  const { selectedEntity, setSelectedEntity, activeCampaign, setCurrentView, refreshEntities } = useAppContext();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relatedEntities, setRelatedEntities] = useState<Record<string, CampaignEntity>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

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

  const handleSave = async (data: Partial<CampaignEntity>, relationshipUpdates?: { added: Partial<Relationship>[], deletedIds: string[] }) => {
    try {
      await entityService.update(selectedEntity.id, data, relationshipUpdates);
      const updated = await entityService.getById(selectedEntity.id);
      if (updated) setSelectedEntity(updated);
      await loadDetails();
      refreshEntities();
    } catch (error) {
      console.error('Failed to update entity:', error);
      alert('Failed to save changes');
    }
  };

  const handleHealthChange = async (delta: number) => {
    if (selectedEntity.currentHealth === undefined || selectedEntity.maxHealth === undefined) return;
    
    let newValue = (selectedEntity.currentHealth || 0) + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > (selectedEntity.maxHealth || 0)) newValue = selectedEntity.maxHealth;
    
    await handleSave({ currentHealth: newValue });
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await handleStatusEffectChange(newStatusName, 'add');
    setNewStatusName('');
    setIsStatusModalOpen(false);
  };

  const handleStatusEffectChange = async (effectName: string, action: 'add' | 'remove') => {
    const currentEffects: string[] = selectedEntity.statusEffects ? JSON.parse(selectedEntity.statusEffects) : [];
    let updatedEffects: string[];
    
    if (action === 'add') {
      if (currentEffects.includes(effectName)) return;
      updatedEffects = [...currentEffects, effectName];
    } else {
      updatedEffects = currentEffects.filter(e => e !== effectName);
    }
    
    await handleSave({ statusEffects: JSON.stringify(updatedEffects) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Add Status Modal - Reusing the same pattern for consistency */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h4 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Add Status Effect</h4>
            <input 
              type="text"
              autoFocus
              placeholder="Effect name (e.g. Poisoned)"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >CANCEL</button>
              <button 
                onClick={handleAddStatus}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
              >ADD STATUS</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-6">
          {selectedEntity.image && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl">
              <img 
                src={selectedEntity.image.startsWith('http') ? selectedEntity.image : convertFileSrc(selectedEntity.image)} 
                alt={selectedEntity.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">{selectedEntity.name}</h2>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-blue-500 font-black uppercase tracking-widest text-sm">{selectedEntity.type}</span>
              <button 
                onClick={() => setIsStatusModalOpen(true)}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tighter bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/30 transition-all active:scale-95"
              >
                + ADD STATUS
              </button>
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
          {selectedEntity.type === 'NPC' && selectedEntity.maxHealth !== undefined && (
            <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 relative">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Health</span>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-black text-white">{selectedEntity.currentHealth}</span>
                  <span className="text-gray-500 font-bold">/ {selectedEntity.maxHealth}</span>
                </div>
              </div>

              <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 mb-6">
                <div 
                  className={`h-full transition-all duration-500 ${
                    ((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) < 0.25 ? 'bg-red-500' :
                    ((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) < 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-6 gap-2">
                {[-10, -5, -1, 1, 5, 10].map(delta => (
                  <button
                    key={delta}
                    onClick={() => handleHealthChange(delta)}
                    className={`py-3 rounded-xl text-sm font-black transition-all ${
                      delta < 0 
                        ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30' 
                        : 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/30'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>

              {/* Status Effects - Moved here from sidebar to save space */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Active Status Effects</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntity.statusEffects && JSON.parse(selectedEntity.statusEffects).length > 0 ? (
                    JSON.parse(selectedEntity.statusEffects).map((effect: string) => (
                      <span 
                        key={effect}
                        className="bg-purple-900/30 text-purple-300 border border-purple-800/50 px-3 py-1 rounded-lg text-xs font-bold flex items-center group cursor-pointer hover:bg-purple-900/50 transition-all"
                        onClick={() => handleStatusEffectChange(effect, 'remove')}
                        title="Click to remove"
                      >
                        {effect}
                        <span className="ml-2 text-purple-500 group-hover:text-purple-300">×</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-600 italic">No active effects</span>
                  )}
                </div>
              </div>
            </section>
          )}

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
