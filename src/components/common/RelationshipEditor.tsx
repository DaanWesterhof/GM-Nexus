import React, { useState, useEffect } from 'react';
import { CampaignEntity, Relationship } from '../../types';
import { entityService, relationshipService } from '../../services/entityService';

interface RelationshipEditorProps {
  campaignId: string;
  sourceEntity: CampaignEntity;
  onChanged: () => void;
}

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({ campaignId, sourceEntity, onChanged }) => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allEntities, setAllEntities] = useState<CampaignEntity[]>([]);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [relationshipType, setRelationshipType] = useState('works for');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [sourceEntity.id]);

  const loadData = async () => {
    const [rels, entities] = await Promise.all([
      relationshipService.getForEntity(sourceEntity.id),
      entityService.getAllByCampaign(campaignId)
    ]);
    setRelationships(rels);
    setAllEntities(entities.filter(e => e.id !== sourceEntity.id));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityId) return;

    const targetEntity = allEntities.find(e => e.id === targetEntityId);
    if (!targetEntity) return;

    await relationshipService.create({
      id: crypto.randomUUID(),
      campaignId,
      sourceEntityId: sourceEntity.id,
      sourceEntityType: sourceEntity.type,
      targetEntityId: targetEntity.id,
      targetEntityType: targetEntity.type,
      relationshipType,
      notes
    });

    setTargetEntityId('');
    setNotes('');
    loadData();
    onChanged();
  };

  const handleDelete = async (id: string) => {
    await relationshipService.delete(id);
    loadData();
    onChanged();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
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
            <input
              type="text"
              list="rel-types"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g. works for"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <datalist id="rel-types">
              <option value="works for" />
              <option value="knows" />
              <option value="located at" />
              <option value="allied with" />
              <option value="enemy of" />
              <option value="member of" />
              <option value="leader of" />
              <option value="belongs to" />
            </datalist>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Target Entity</label>
            <select
              required
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
            type="submit"
            disabled={!targetEntityId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-2 rounded text-sm font-bold transition-all shadow-lg shadow-blue-900/10"
          >
            CREATE
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Current Relationships</h4>
        {relationships.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {relationships.map(rel => {
              const isSource = rel.sourceEntityId === sourceEntity.id;
              const targetId = isSource ? rel.targetEntityId : rel.sourceEntityId;
              const targetEntity = allEntities.find(e => e.id === targetId);
              
              return (
                <div key={rel.id} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between group">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-400 font-bold">{sourceEntity.name}</span>
                    <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
                      {rel.relationshipType}
                    </span>
                    <span className="text-white font-bold">{targetEntity?.name || 'Unknown Entity'}</span>
                    {rel.notes && <span className="text-gray-500 text-xs italic">- {rel.notes}</span>}
                  </div>
                  <button
                    onClick={() => handleDelete(rel.id)}
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
