import React, { useState, useEffect } from 'react';
import { Campaign, CampaignEntity, Relationship } from '../types';
import { entityService } from '../services/entityService';
import EntityModal from '../components/common/EntityModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

import { useAppContext } from '../store/AppContext';

interface NPCManagementProps {
  campaign: Campaign;
}

const NPCManagement: React.FC<NPCManagementProps> = ({ campaign }) => {
  const [npcs, setNpcs] = useState<CampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<CampaignEntity | undefined>(undefined);
  const [npcToDelete, setNpcToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedEntity, refreshEntities, entitiesRefreshTrigger, selectedEntity } = useAppContext();

  useEffect(() => {
    loadNPCs();
  }, [campaign.id, entitiesRefreshTrigger]);

  const loadNPCs = async () => {
    try {
      setLoading(true);
      const data = await entityService.getAllByCampaign(campaign.id, 'NPC');
      setNpcs(data);
    } catch (error) {
      console.error('Failed to load NPCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNpc(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (npc: CampaignEntity) => {
    setEditingNpc(npc);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<CampaignEntity>, relationshipUpdates?: { added: Partial<Relationship>[], deletedIds: string[] }) => {
    try {
      if (editingNpc) {
        await entityService.update(editingNpc.id, data, relationshipUpdates);
        if (selectedEntity?.id === editingNpc.id) {
          const updated = await entityService.getById(editingNpc.id);
          if (updated) setSelectedEntity(updated);
        }
      } else {
        const newId = crypto.randomUUID();
        await entityService.create({
          id: newId,
          campaignId: campaign.id,
          type: 'NPC',
          name: data.name || '',
          description: data.description || '',
          notes: data.notes || '',
          image: data.image || null,
          parentId: data.parentId || null,
          status: data.status || null,
          objectives: data.objectives || null
        } as any);
      }
      refreshEntities();
    } catch (error) {
      console.error('Failed to save NPC:', error);
      alert('Failed to save NPC');
    }
  };

  const handleDelete = async (id: string) => {
    setNpcToDelete(id);
  };

  const confirmDelete = async () => {
    if (npcToDelete) {
      try {
        await entityService.delete(npcToDelete);
        if (selectedEntity?.id === npcToDelete) {
          setSelectedEntity(null);
        }
        refreshEntities();
      } catch (error) {
        alert('Failed to delete NPC');
      } finally {
        setNpcToDelete(null);
      }
    }
  };

  const filteredNPCs = npcs.filter(npc => 
    npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    npc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-theme-text">NPCs</h2>
          <p className="text-theme-text-muted mt-1">Manage the characters in your world.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-theme-primary hover:bg-theme-primary-hover px-6 py-2 rounded-lg text-sm font-bold text-theme-primary-text transition-all shadow-lg shadow-black/10"
        >
          + Add NPC
        </button>
      </div>

      <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search NPCs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-10 pr-4 py-2 text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-theme-primary"></div>
        </div>
      ) : filteredNPCs.length === 0 ? (
        <div className="text-center py-20 bg-theme-bg-alt rounded-xl border-2 border-theme-border border-dashed">
          <p className="text-theme-text-muted text-lg mb-6">{searchQuery ? 'No NPCs match your search.' : 'No NPCs found.'}</p>
          {!searchQuery && (
            <button 
              onClick={handleCreate}
              className="bg-theme-primary/10 text-theme-text hover:bg-theme-primary/20 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              Create your first NPC
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNPCs.map((npc) => (
            <div 
              key={npc.id} 
              onClick={() => setSelectedEntity(npc)}
              className="group bg-theme-bg-alt border border-theme-border rounded-xl overflow-hidden hover:border-theme-primary transition-all shadow-lg flex flex-col cursor-pointer"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-theme-bg flex items-center justify-center text-xl text-theme-text-muted group-hover:bg-theme-primary group-hover:text-theme-primary-text transition-colors">
                    👤
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-theme-text group-hover:text-theme-primary transition-colors leading-tight">{npc.name}</h3>
                    <p className="text-theme-primary text-xs font-bold uppercase tracking-widest mt-0.5">NPC</p>
                  </div>
                </div>
                {npc.description && (
                  <p className="text-theme-text-muted text-sm line-clamp-3 mb-4">{npc.description}</p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-theme-bg border-t border-theme-border flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(npc);
                  }}
                  className="text-xs font-bold text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  EDIT
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(npc.id);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EntityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingNpc}
        type="NPC"
        campaignId={campaign.id}
      />

      <ConfirmDialog
        isOpen={npcToDelete !== null}
        title="Delete NPC"
        message="Are you sure you want to delete this NPC? Relationships involving this NPC will also be removed."
        onConfirm={confirmDelete}
        onCancel={() => setNpcToDelete(null)}
      />
    </div>
  );
};

export default NPCManagement;
