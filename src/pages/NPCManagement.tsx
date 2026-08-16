import React, { useState, useEffect } from 'react';
import { Campaign, CampaignEntity } from '../types';
import { entityService } from '../services/entityService';
import EntityModal from '../components/common/EntityModal';

import { useAppContext } from '../store/AppContext';

interface NPCManagementProps {
  campaign: Campaign;
}

const NPCManagement: React.FC<NPCManagementProps> = ({ campaign }) => {
  const [npcs, setNpcs] = useState<CampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<CampaignEntity | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedEntity } = useAppContext();

  useEffect(() => {
    loadNPCs();
  }, [campaign.id]);

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

  const handleSave = async (data: Partial<CampaignEntity>) => {
    try {
      if (editingNpc) {
        await entityService.update(editingNpc.id, data);
      } else {
        await entityService.create({
          id: crypto.randomUUID(),
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
      loadNPCs();
    } catch (error) {
      console.error('Failed to save NPC:', error);
      alert('Failed to save NPC');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this NPC? Relationships involving this NPC will also be removed.')) {
      try {
        await entityService.delete(id);
        loadNPCs();
      } catch (error) {
        alert('Failed to delete NPC');
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
          <h2 className="text-3xl font-bold text-white">NPCs</h2>
          <p className="text-gray-400 mt-1">Manage the characters in your world.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/20"
        >
          + Add NPC
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search NPCs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredNPCs.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-xl border-2 border-gray-700 border-dashed">
          <p className="text-gray-400 text-lg mb-6">{searchQuery ? 'No NPCs match your search.' : 'No NPCs found.'}</p>
          {!searchQuery && (
            <button 
              onClick={handleCreate}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
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
              className="group bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all shadow-lg flex flex-col cursor-pointer"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl text-gray-400 group-hover:bg-blue-900/30 group-hover:text-blue-300 transition-colors">
                    👤
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{npc.name}</h3>
                    <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mt-0.5">NPC</p>
                  </div>
                </div>
                {npc.description && (
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">{npc.description}</p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(npc);
                  }}
                  className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  EDIT
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(npc.id);
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
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
    </div>
  );
};

export default NPCManagement;
