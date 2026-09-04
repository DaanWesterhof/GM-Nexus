import React, { useEffect, useState } from 'react';
import { CampaignEntity, Relationship } from '../types';
import { entityService, relationshipService } from '../services/entityService';
import { useAppContext } from '../store/AppContext';
import EntityModal from '../components/common/EntityModal';
import { getRelationshipWording } from '../constants/relationships';
import { convertFileSrc } from '@tauri-apps/api/core';

const EntityDetail: React.FC = () => {
  const { selectedEntity, setSelectedEntity, activeCampaign, setCurrentView, refreshEntities, playingSettings } = useAppContext();
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-theme-primary"></div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-theme-bg border border-theme-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h4 className="text-xl font-black text-theme-text mb-4 uppercase tracking-tight">Add Status Effect</h4>
            <input 
              type="text"
              autoFocus
              placeholder="Effect name (e.g. Poisoned)"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              className="w-full bg-theme-bg-alt border border-theme-border rounded-xl px-4 py-3 text-theme-text mb-6 focus:outline-none focus:border-theme-primary transition-all shadow-inner"
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-theme-text-muted hover:text-theme-text transition-colors"
              >CANCEL</button>
              <button 
                onClick={handleAddStatus}
                className="px-6 py-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
              >ADD STATUS</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-6">
          {selectedEntity.image && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-theme-border shadow-2xl">
              <img 
                src={selectedEntity.image.startsWith('http') ? selectedEntity.image : convertFileSrc(selectedEntity.image)} 
                alt={selectedEntity.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-4xl font-black text-theme-text tracking-tight">{selectedEntity.name}</h2>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-theme-primary font-black uppercase tracking-widest text-sm">{selectedEntity.type}</span>
              <button 
                onClick={() => setIsStatusModalOpen(true)}
                className="text-[10px] text-theme-primary hover:text-theme-primary-hover font-bold uppercase tracking-tighter bg-theme-primary/10 px-2 py-0.5 rounded border border-theme-primary/20 transition-all active:scale-95"
              >
                + ADD STATUS
              </button>
              {selectedEntity.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedEntity.status === 'Active' ? 'bg-green-600/20 text-green-500' :
                  selectedEntity.status === 'Completed' ? 'bg-blue-600/20 text-blue-500' :
                  'bg-theme-bg-alt text-theme-text-muted border border-theme-border'
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
            className="bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2 rounded-lg text-sm font-bold text-theme-text transition-all shadow-sm"
          >
            EDIT
          </button>
          <button 
            onClick={() => setCurrentView(selectedEntity.type + 's' as any)}
            className="bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2 rounded-lg text-sm font-bold text-theme-text-muted hover:text-theme-text transition-all shadow-sm"
          >
            CLOSE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {selectedEntity.type === 'NPC' && selectedEntity.maxHealth !== undefined && (
            <section className="bg-theme-bg-alt border border-theme-border rounded-2xl p-6 relative shadow-lg">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-black text-theme-text-muted uppercase tracking-widest">Health</span>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-black text-theme-text">{selectedEntity.currentHealth}</span>
                  <span className="text-theme-text-muted font-bold">/ {selectedEntity.maxHealth}</span>
                </div>
              </div>

              <div className="h-4 bg-theme-bg rounded-full overflow-hidden border border-theme-border mb-6">
                <div 
                  className={`h-full transition-all duration-500 ${
                    ((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) < 0.25 ? 'bg-red-500' :
                    ((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) < 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${((selectedEntity.currentHealth || 0) / (selectedEntity.maxHealth || 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-6 gap-2">
                {[...playingSettings.healthIncrements.map(v => -v).reverse(), ...playingSettings.healthIncrements].map(delta => (
                  <button
                    key={delta}
                    onClick={() => handleHealthChange(delta)}
                    className={`py-3 rounded-xl text-sm font-black transition-all ${
                      delta < 0 
                        ? 'bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30' 
                        : 'bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-600/30'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>

              {/* Status Effects - Moved here from sidebar to save space */}
              <div className="mt-8 pt-6 border-t border-theme-border">
                <h4 className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-3">Active Status Effects</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntity.statusEffects && JSON.parse(selectedEntity.statusEffects).length > 0 ? (
                    JSON.parse(selectedEntity.statusEffects).map((effect: string) => (
                      <span 
                        key={effect}
                        className="bg-purple-600/10 text-purple-600 border border-purple-600/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center group cursor-pointer hover:bg-purple-600/20 transition-all"
                        onClick={() => handleStatusEffectChange(effect, 'remove')}
                        title="Click to remove"
                      >
                        {effect}
                        <span className="ml-2 text-purple-400 group-hover:text-purple-600">×</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-theme-text-muted italic opacity-60">No active effects</span>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-black text-theme-text-muted uppercase tracking-widest mb-3">Description</h3>
            <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-6 text-theme-text leading-relaxed shadow-sm">
              {selectedEntity.description || <span className="italic text-theme-text-muted opacity-60">No description provided.</span>}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-theme-text-muted uppercase tracking-widest mb-3">GM Notes</h3>
            <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-6 text-theme-text font-mono text-sm whitespace-pre-wrap min-h-[100px] shadow-sm">
              {selectedEntity.notes || <span className="italic text-theme-text-muted opacity-60">No notes yet.</span>}
            </div>
          </section>

          {selectedEntity.type === 'Quest' && (
            <section>
              <h3 className="text-sm font-black text-theme-text-muted uppercase tracking-widest mb-3">Objectives</h3>
              <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-6 italic text-theme-text-muted opacity-60 shadow-sm">
                Objectives management coming soon...
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-black text-theme-text-muted uppercase tracking-widest mb-3 text-center lg:text-left">Relationships</h3>
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
                      className="bg-theme-bg-alt border border-theme-border p-4 rounded-xl hover:border-theme-primary transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-theme-primary uppercase tracking-tighter mb-1">
                          {getRelationshipWording(rel.relationshipType, isSource)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-theme-text font-bold group-hover:text-theme-primary transition-colors">
                            {target?.name || 'Unknown Entity'}
                          </span>
                          <span className="text-theme-text-muted text-[10px] uppercase font-bold opacity-60">{target?.type}</span>
                        </div>
                        {rel.notes && <p className="text-theme-text-muted text-[11px] mt-1 italic opacity-70">{rel.notes}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-theme-bg-alt border border-theme-border border-dashed rounded-xl text-xs text-theme-text-muted italic opacity-60">
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
