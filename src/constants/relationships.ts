export interface RelationshipTemplate {
  id: string;
  forward: string;
  reverse: string;
}

export const RELATIONSHIP_TEMPLATES: RelationshipTemplate[] = [
  { id: 'employment', forward: 'works for', reverse: 'employs' },
  { id: 'membership', forward: 'is a member of', reverse: 'has member' },
  { id: 'leadership', forward: 'leads', reverse: 'is led by' },
  { id: 'knowledge', forward: 'knows', reverse: 'is known by' },
  { id: 'location', forward: 'is located at', reverse: 'is the location of' },
  { id: 'alliance', forward: 'is allied with', reverse: 'is allied with' },
  { id: 'enmity', forward: 'is an enemy of', reverse: 'is an enemy of' },
  { id: 'ownership', forward: 'belongs to', reverse: 'owns' },
  { id: 'family', forward: 'is related to', reverse: 'is related to' },
  { id: 'friendship', forward: 'is friends with', reverse: 'is friends with' },
  { id: 'rivalry', forward: 'is a rival of', reverse: 'is a rival of' },
];

export const getRelationshipWording = (relationshipType: string, isSource: boolean): string => {
  const template = RELATIONSHIP_TEMPLATES.find(t => t.id === relationshipType || t.forward === relationshipType);
  if (!template) return relationshipType;
  return isSource ? template.forward : template.reverse;
};
