export interface PerspectiveRequest {
  observerCharacterId: string;
  eventId: string;
  spoilerLimit: number;
}

export interface KnownPosition {
  locationId?: string;
  knowledgeType: 'CURRENT_CONFIRMED' | 'CURRENT_BELIEVED' | 'LAST_KNOWN' | 'UNKNOWN';
  knownAtEventId?: string;
  confidence?: number;
}

export interface PerspectiveDifference {
  subjectId: string;
  subjectType: string;
  dimension: 'EXISTENCE' | 'IDENTITY' | 'POSITION' | 'BIOLOGICAL_STATE' | 'ABILITY' | 'AFFILIATION' | 'EVENT' | 'BELIEF';
  leftValue: unknown;
  rightValue: unknown;
  differenceType: 'LEFT_ONLY' | 'RIGHT_ONLY' | 'CONTRADICTION' | 'CONFIDENCE_GAP' | 'SAME';
}

export interface PerspectiveObserver {
  characterId: string;
  consciousnessId: string;
  currentBodyId: string;
  currentBodyOwnerCharacterId?: string;
  apparentCharacterId?: string;
  isDissonant?: boolean;
}

export interface PerspectiveState {
  observer: PerspectiveObserver;
  visibleBodies: any[];
  knownCharacters: any[];
  knownLocations: any[];
  knownEvents: any[];
  knownFacts: any[];
  beliefs: any[];
  unknownElements: any[];
  currentBodyId?: string;
  currentConsciousnessId?: string;
}
