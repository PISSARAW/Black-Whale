export type AffiliationType = 
  | 'ROYAL_FAMILY' 
  | 'PRINCE_CAMP' 
  | 'KAKIN_ROYAL_ARMY' 
  | 'BENJAMIN_PRIVATE_ARMY' 
  | 'HUNTER_ASSOCIATION' 
  | 'MAFIA_FAMILY' 
  | 'PHANTOM_TROUPE' 
  | 'EXPEDITION_TEAM'
  | 'JUSTICE_POLICE'
  | 'CIVILIAN'
  | 'UNKNOWN';

export interface Faction {
  id: string;
  name: string;
  type: AffiliationType;
  leaderId?: string;
}

export type MembershipRole = 'LEADER' | 'EXECUTIVE' | 'MEMBER' | 'ASSOCIATE' | 'PRISONER' | 'UNKNOWN';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'EXILED' | 'DECEASED' | 'UNKNOWN';

export interface AffiliationMembership {
  id: string;
  characterId: string;
  factionId: string;
  role: MembershipRole;
  status: MembershipStatus;
  fromEventId: string;
  untilEventId?: string;
}
