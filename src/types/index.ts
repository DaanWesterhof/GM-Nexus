export type EntityType = 'NPC' | 'Location' | 'Quest' | 'Faction';
export type QuestStatus = 'Planned' | 'Active' | 'Completed' | 'Failed' | 'Abandoned';

export interface Campaign {
  id: string;
  name: string;
  gameSystem: string;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  campaignId: string;
  name: string;
  image?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerResource {
  id: string;
  playerId: string;
  name: string;
  currentValue: number;
  maxValue: number;
  displayStyle: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignEntity {
  id: string;
  campaignId: string;
  type: EntityType;
  name: string;
  description: string;
  image?: string;
  notes?: string;
  parentId?: string;
  status?: QuestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  campaignId: string;
  sourceEntityId: string;
  sourceEntityType: string;
  targetEntityId: string;
  targetEntityType: string;
  relationshipType: string;
  notes?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  campaignId: string;
  name: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}
