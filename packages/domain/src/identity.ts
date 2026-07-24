export type BiologicalState = 'ALIVE' | 'INJURED' | 'UNCONSCIOUS' | 'DEAD' | 'DESTROYED' | 'PRESERVED' | 'UNKNOWN';
export type MentalState = 'ACTIVE' | 'UNCONSCIOUS' | 'TRANSFERRED' | 'SUPPRESSED' | 'DORMANT' | 'DISCONNECTED' | 'DESTROYED' | 'UNKNOWN';

export type BodyType = 'ORIGINAL' | 'CLONE' | 'COPY' | 'CONSTRUCT' | 'UNKNOWN';

export interface Body {
  id: string;
  originalCharacterId?: string;
  label: string;
  bodyType: BodyType;
  firstVisibleEventId: string;
}

export type ConsciousnessType = 'ORIGINAL' | 'COPIED' | 'ARTIFICIAL' | 'NEN_ENTITY' | 'UNKNOWN';

export interface Consciousness {
  id: string;
  originCharacterId?: string;
  label: string;
  consciousnessType: ConsciousnessType;
  firstVisibleEventId: string;
}

export type OccupancyType = 'ORIGINAL' | 'TRANSFERRED' | 'POSSESSED' | 'CONTROLLED' | 'EMPTY' | 'UNKNOWN';
export type CertaintyLevel = 'CONFIRMED' | 'PROBABLE' | 'UNKNOWN';

export interface BodyOccupancy {
  id: string;
  bodyId: string;
  consciousnessId?: string;
  fromEventId: string;
  untilEventId?: string;
  occupancyType: OccupancyType;
  certainty: CertaintyLevel;
  sourceIds?: string[];
}

export interface BodyState {
  id: string;
  bodyId: string;
  state: BiologicalState;
  fromEventId: string;
  untilEventId?: string;
}

export interface ConsciousnessState {
  id: string;
  consciousnessId: string;
  state: MentalState;
  fromEventId: string;
  untilEventId?: string;
}

export type AppearanceCause = 'NATURAL' | 'TRANSFORMATION' | 'DISGUISE' | 'NEN_ABILITY' | 'UNKNOWN';

export interface AppearanceState {
  id: string;
  entityId: string;
  entityType: 'BODY' | 'NEN_ENTITY';
  appearanceCharacterId?: string;
  appearanceAssetId?: string;
  fromEventId: string;
  untilEventId?: string;
  cause: AppearanceCause;
}

export interface PerceivedIdentity {
  observerId: string;
  bodyId: string;
  believedCharacterId?: string;
  fromEventId: string;
  untilEventId?: string;
  confidence: 'CERTAIN' | 'LIKELY' | 'SUSPECTED' | 'UNKNOWN';
}
