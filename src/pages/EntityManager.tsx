import React, { useState, useEffect } from 'react';
import { Campaign, CampaignEntity } from '../types';
import { entityService } from '../services/entityService';
import EntityModal from '../components/common/EntityModal';

import { useAppContext } from '../store/AppContext';

interface EntityManagerProps {
  campaign: Campaign;
  type: 'Location' | 'Quest' | 'Faction';
  title: string;
  description: string;
  icon: string;
}

const EntityManager: React.FC<EntityManagerProps> = ({ campaign, type, title, description, icon }) => {
  const [entities, setEntities] = useState<CampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CampaignEntity | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedEntity } = useAppContext();

  useEffect(() => {
    loadEntities();
  }, [campaign.id, type]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const data = await entityService.getAllByCampaign(campaign.id, type);
      setEntities(data);
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEntity(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (entity: CampaignEntity) => {
    setEditingEntity(entity);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<CampaignEntity>) => {
    try {
      if (editingEntity) {
        await entityService.update(editingEntity.id, data);
      } else {
        await entityService.create({
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          type: type,
          name: data.name || '',
          description: data.description || '',
          notes: data.notes || '',
          image: data.image || null,
          parentId: data.parentId || null,
          status: data.status || null,
          objectives: data.objectives || null
        } as any);
      }
      loadEntities();
    } catch (error) {
      console.error(`Failed to save ${type}:`, error);
      alert(`Failed to save ${type}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this ${type}? Relationships involving this ${type.toLowerCase()} will also be removed.`)) {
      try {
        await entityService.delete(id);
        loadEntities();
      } catch (error) {
        alert(`Failed to delete ${type}`);
      }
    }
  };

  const filteredEntities = entities.filter(entity => 
    entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entity.description && entity.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 mt-1">{description}</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/20"
        >
          + Add {type}
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Search ${type}s...`}
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
      ) : filteredEntities.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-xl border-2 border-gray-700 border-dashed">
          <p className="text-gray-400 text-lg mb-6">{searchQuery ? `No ${type}s match your search.` : `No ${type}s found.`}</p>
          {!searchQuery && (
            <button 
              onClick={handleCreate}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              Create your first {type.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntities.map((entity) => (
            <div 
              key={entity.id} 
              onClick={() => setSelectedEntity(entity)}
              className="group bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all shadow-lg flex flex-col cursor-pointer"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl text-gray-400 group-hover:bg-blue-900/30 group-hover:text-blue-300 transition-colors">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{entity.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{type}</p>
                      {type === 'Quest' && entity.status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          entity.status === 'Active' ? 'bg-green-900 text-green-400' :
                          entity.status === 'Completed' ? 'bg-blue-900 text-blue-400' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {entity.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {entity.description && (
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">{entity.description}</p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(entity);
                  }}
                  className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  EDIT
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entity.id);
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
        initialData={editingEntity}
        type={type}
        campaignId={campaign.id}
      />
    </div>
  );
};

export default EntityManager;
