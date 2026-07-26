export type NarrativeImportance = 'PRIMARY' | 'SECONDARY' | 'MINOR' | 'BACKGROUND';
export type ModelingLevel = 1 | 2 | 3 | 4;

export interface Character {
  id: string;
  slug: string;
  canonicalName: string;
  aliases: string[];
  description?: string;
  narrativeImportance: NarrativeImportance;
  modelingLevel: ModelingLevel;
  firstVisibleEventId: string;
  portraitAssetId?: string;
}

export interface CharacterAssignment {
  id: string;
  characterId: string;
  assignedPrinceId: string;
  officialRole: string;
  trueAllegianceId?: string;
  knownAllegianceId?: string;
  fromEventId: string;
  untilEventId?: string;
}

export type CohortProfile = 
  | 'PASSENGERS' 
  | 'MEDICAL_STAFF' 
  | 'WORKERS' 
  | 'MILITARY' 
  | 'VIP_GUESTS' 
  | 'MAFIA_ASSOCIATES';

export interface PopulationCohort {
  id: string;
  label: string;
  locationId: string;
  estimatedCount?: number;
  profile: CohortProfile;
  fromEventId: string;
  untilEventId?: string;
}

export interface CharacterRole {
  id: string;
  characterId: string;
  roleName: string;
  fromEventId: string;
  untilEventId?: string;
}
