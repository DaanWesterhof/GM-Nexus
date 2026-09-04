import React, { useState, useEffect } from 'react';
import { Campaign, CampaignEntity, Relationship } from '../types';
import { entityService } from '../services/entityService';
import EntityModal from '../components/common/EntityModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

import { useAppContext } from '../store/AppContext';

interface EntityManagerProps {
  campaign: Campaign;
  type: 'Location' | 'Quest' | 'Faction';
  title: string;
  description: string;
}

const EntityManager: React.FC<EntityManagerProps> = ({ campaign, type, title, description }) => {
  const [entities, setEntities] = useState<CampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CampaignEntity | undefined>(undefined);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedEntity, refreshEntities, entitiesRefreshTrigger, selectedEntity } = useAppContext();

  useEffect(() => {
    loadEntities();
  }, [campaign.id, type, entitiesRefreshTrigger]);

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

  const handleSave = async (data: Partial<CampaignEntity>, relationshipUpdates?: { added: Partial<Relationship>[], deletedIds: string[] }) => {
    try {
      if (editingEntity) {
        await entityService.update(editingEntity.id, data, relationshipUpdates);
        if (selectedEntity?.id === editingEntity.id) {
          const updated = await entityService.getById(editingEntity.id);
          if (updated) setSelectedEntity(updated);
        }
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
      refreshEntities();
    } catch (error) {
      console.error(`Failed to save ${type}:`, error);
      alert(`Failed to save ${type}`);
    }
  };

  const handleDelete = async (id: string) => {
    setEntityToDelete(id);
  };

  const confirmDelete = async () => {
    if (entityToDelete) {
      try {
        await entityService.delete(entityToDelete);
        if (selectedEntity?.id === entityToDelete) {
          setSelectedEntity(null);
        }
        refreshEntities();
      } catch (error) {
        alert(`Failed to delete ${type}`);
      } finally {
        setEntityToDelete(null);
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
          <h2 className="text-3xl font-bold text-theme-text">{title}</h2>
          <p className="text-theme-text-muted mt-1">{description}</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-theme-primary hover:bg-theme-primary-hover px-6 py-2 rounded-lg text-sm font-bold text-theme-primary-text transition-all shadow-lg shadow-black/10"
        >
          + Add {type}
        </button>
      </div>

      <div className="bg-theme-bg-alt border border-theme-border rounded-xl p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Search ${type}s...`}
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
      ) : filteredEntities.length === 0 ? (
        <div className="text-center py-20 bg-theme-bg-alt rounded-xl border-2 border-theme-border border-dashed">
          <p className="text-theme-text-muted text-lg mb-6">{searchQuery ? `No ${type}s match your search.` : `No ${type}s found.`}</p>
          {!searchQuery && (
            <button 
              onClick={handleCreate}
              className="bg-theme-bg-alt hover:bg-theme-bg px-6 py-2 rounded-lg text-sm font-semibold transition-all border border-theme-border text-theme-text"
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
              className="group bg-theme-bg-alt border border-theme-border rounded-xl overflow-hidden hover:border-theme-primary transition-all shadow-lg flex flex-col cursor-pointer"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-theme-text group-hover:text-theme-primary transition-colors leading-tight">{entity.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-theme-primary text-[10px] font-black uppercase tracking-widest">{type}</p>
                      {type === 'Quest' && entity.status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          entity.status === 'Active' ? 'bg-green-600/20 text-green-500' :
                          entity.status === 'Completed' ? 'bg-blue-600/20 text-blue-500' :
                          'bg-theme-bg text-theme-text-muted border border-theme-border'
                        }`}>
                          {entity.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {entity.description && (
                  <p className="text-theme-text-muted text-sm line-clamp-3 mb-4">{entity.description}</p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-theme-bg border-t border-theme-border flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(entity);
                  }}
                  className="text-xs font-bold text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  EDIT
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entity.id);
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
        initialData={editingEntity}
        type={type}
        campaignId={campaign.id}
      />

      <ConfirmDialog
        isOpen={entityToDelete !== null}
        title={`Delete ${type}`}
        message={`Are you sure you want to delete this ${type}? Relationships involving this ${type.toLowerCase()} will also be removed.`}
        onConfirm={confirmDelete}
        onCancel={() => setEntityToDelete(null)}
      />
    </div>
  );
};

export default EntityManager;
