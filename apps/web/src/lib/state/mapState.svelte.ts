import type { MapAnchor, MapRegion } from '@black-whale/domain';

export type ZoomLevel = 'OVERVIEW' | 'TIER' | 'LOCAL';

export const mapState = $state({
  currentZoomLevel: 'TIER' as ZoomLevel,
  selectedTier: 'tier-1' as string | null,
  selectedLocationId: null as string | null,
  currentEventIndex: 0,
  filters: {
    factions: [] as string[],
    spoilersEnabled: false,
    showUnknownPositions: false
  },
  
  setZoomLevel(level: ZoomLevel) {
    this.currentZoomLevel = level;
  },
  
  selectTier(tierId: string | null) {
    this.selectedTier = tierId;
    this.currentZoomLevel = tierId ? 'TIER' : 'OVERVIEW';
    this.selectedLocationId = null;
  },
  
  selectLocation(locationId: string | null) {
    this.selectedLocationId = locationId;
    if (locationId) {
      this.currentZoomLevel = 'LOCAL';
    } else {
      this.currentZoomLevel = this.selectedTier ? 'TIER' : 'OVERVIEW';
    }
  },
  
  setEventIndex(index: number) {
    this.currentEventIndex = index;
  },
  
  toggleFactionFilter(factionId: string) {
    if (this.filters.factions.includes(factionId)) {
      this.filters.factions = this.filters.factions.filter(f => f !== factionId);
    } else {
      this.filters.factions.push(factionId);
    }
  }
});
