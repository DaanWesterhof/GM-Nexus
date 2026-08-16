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

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
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
  objectives?: string; // JSON string in DB, parsed in UI
  createdAt: string;
  updatedAt: string;
}

export interface InboxEntry {
  id: string;
  campaignId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  campaignId: string;
  title: string;
  content: string;
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
  sessionNumber?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  text: string;
  timestamp: string;
}

export interface StatusEffect {
  id: string;
  playerId: string;
  name: string;
  description?: string;
  icon?: string;
  duration?: string;
  createdAt: string;
}

export interface ResourceHistory {
  id: string;
  playerId: string;
  resourceId: string;
  sessionId?: string;
  previousValue: number;
  newValue: number;
  change: number;
  timestamp: string;
}
