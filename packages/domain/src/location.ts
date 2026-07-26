export type ZoneType = 'quarters' | 'corridor' | 'medical' | 'military' | 'utility' | 'external' | 'unknown';
export type LocationType = 'SHIP' | 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN';

export interface Location {
  id: string;
  slug: string;
  name: string;
  parentLocationId?: string;
  type: LocationType;
  mapElementId?: string;
  firstVisibleEventId: string;
}

export type SpatialEntityType = 'BODY' | 'NEN_BEAST' | 'CLONE' | 'OBJECT' | 'AURA_ENTITY' | 'COHORT';
export type PresencePrecision = 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN';
export type PresenceCertainty = 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN';

export interface Presence {
  id: string;
  entityType: SpatialEntityType;
  entityId: string;
  locationId?: string;
  fromEventId: string;
  untilEventId?: string;
  precision: PresencePrecision;
  certainty: PresenceCertainty;
  sourceIds?: string[];
}

export interface MapAnchor {
  locationId: string;
  tierId: string;
  x: number;
  y: number;
}

export interface MapRegion {
  locationId: string;
  polygon: Array<[number, number]>;
}
