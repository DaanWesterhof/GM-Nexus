import React, { useState, useEffect } from 'react';
import { CampaignEntity, Relationship } from '../../types';
import { entityService, relationshipService } from '../../services/entityService';
import { RELATIONSHIP_TEMPLATES, getRelationshipWording } from '../../constants/relationships';

interface RelationshipEditorProps {
  campaignId: string;
  sourceEntity: CampaignEntity;
  onRelationshipsChanged?: (added: Partial<Relationship>[], deletedIds: string[]) => void;
  initialRelationships?: Relationship[];
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ campaignId, sourceEntity, onRelationshipsChanged, initialRelationships }) => {
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships || []);
  const [addedRelationships, setAddedRelationships] = useState<Partial<Relationship>[]>([]);
  const [deletedRelationshipIds, setDeletedRelationshipIds] = useState<string[]>([]);
  const [allEntities, setAllEntities] = useState<CampaignEntity[]>([]);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [relationshipType, setRelationshipType] = useState(RELATIONSHIP_TEMPLATES[0].id);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadEntities();
    if (!initialRelationships) {
      loadRelationships();
    }
  }, [sourceEntity.id]);

  const loadEntities = async () => {
    const entities = await entityService.getAllByCampaign(campaignId);
    setAllEntities(entities.filter(e => e.id !== sourceEntity.id));
  };

  const loadRelationships = async () => {
    const rels = await relationshipService.getForEntity(sourceEntity.id);
    setRelationships(rels);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityId) return;

    const targetEntity = allEntities.find(e => e.id === targetEntityId);
    if (!targetEntity) return;

    const newRel: Partial<Relationship> = {
      id: crypto.randomUUID(),
      campaignId,
      sourceEntityId: sourceEntity.id,
      sourceEntityType: sourceEntity.type,
      targetEntityId: targetEntity.id,
      targetEntityType: targetEntity.type,
      relationshipType,
      notes
    };

    if (onRelationshipsChanged) {
      const newAdded = [...addedRelationships, newRel];
      setAddedRelationships(newAdded);
      onRelationshipsChanged(newAdded, deletedRelationshipIds);
    } else {
      // Legacy behavior if not provided, but we want to move away from it
      relationshipService.create(newRel as any).then(() => {
        setTargetEntityId('');
        setNotes('');
        loadRelationships();
      });
      return;
    }

    setTargetEntityId('');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (onRelationshipsChanged) {
      const isActuallyNew = addedRelationships.some(r => r.id === id);
      if (isActuallyNew) {
        const newAdded = addedRelationships.filter(r => r.id !== id);
        setAddedRelationships(newAdded);
        onRelationshipsChanged(newAdded, deletedRelationshipIds);
      } else {
        const newDeleted = [...deletedRelationshipIds, id];
        setDeletedRelationshipIds(newDeleted);
        onRelationshipsChanged(addedRelationships, newDeleted);
      }
    } else {
      relationshipService.delete(id).then(() => {
        loadRelationships();
      });
    }
  };

  const displayRelationships = [
    ...relationships.filter(r => !deletedRelationshipIds.includes(r.id)),
    ...addedRelationships as Relationship[]
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Add Relationship</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-1">Source</span>
            <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
              {sourceEntity.name}
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Type</label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {RELATIONSHIP_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.forward}</option>
              ))}
            </select>
          </div>

          <div className="flex-col space-y-1 flex">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Target Entity</label>
            <select
              value={targetEntityId}
              onChange={(e) => setTargetEntityId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select entity...</option>
              {['NPC', 'Location', 'Quest', 'Faction'].map(type => (
                <optgroup key={type} label={type + 's'}>
                  {allEntities.filter(e => e.type === type).map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-end space-x-3">
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context for this relationship..."
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!targetEntityId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-2 rounded text-sm font-bold transition-all shadow-lg shadow-blue-900/10"
          >
            ADD
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Current Relationships</h4>
        {displayRelationships.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {displayRelationships.map(rel => {
              const isSource = rel.sourceEntityId === sourceEntity.id;
              const targetId = isSource ? rel.targetEntityId : rel.sourceEntityId;
              const targetEntity = allEntities.find(e => e.id === targetId);
              const isNew = addedRelationships.some(r => r.id === rel.id);
              
              return (
                <div key={rel.id} className={`bg-gray-800 border ${isNew ? 'border-blue-500/50' : 'border-gray-700'} rounded-lg px-4 py-3 flex items-center justify-between group`}>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-400 font-bold">{sourceEntity.name}</span>
                    <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
                      {getRelationshipWording(rel.relationshipType, isSource)}
                    </span>
                    <span className="text-white font-bold">{targetEntity?.name || 'Unknown Entity'}</span>
                    {rel.notes && <span className="text-gray-500 text-xs italic">- {rel.notes}</span>}
                    {isNew && <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-500/10 px-1 rounded">New</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(rel.id!)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic px-1">No relationships defined for this entity.</p>
        )}
      </div>
    </div>
  );
};

export default RelationshipEditor;
