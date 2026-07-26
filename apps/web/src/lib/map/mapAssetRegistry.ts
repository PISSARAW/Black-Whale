import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte';
import Tier1 from '$lib/assets/maps/tier-1.svelte';
import Tier2 from '$lib/assets/maps/tier-2.svelte';
import Tier3 from '$lib/assets/maps/tier-3.svelte';
import Tier4 from '$lib/assets/maps/tier-4.svelte';
import Tier5 from '$lib/assets/maps/tier-5.svelte';
import PrinceApartment from '$lib/assets/maps/local/prince-apartment.svelte';
import Room3101 from '$lib/assets/maps/local/room-3101.svelte';
import HeillyProcessing from '$lib/assets/maps/local/heilly-processing.svelte';
import CentralCourthouse from '$lib/assets/maps/local/central-courthouse.svelte';
import CentralPoliceStation from '$lib/assets/maps/local/central-police-station.svelte';
import GeneralCabins from '$lib/assets/maps/local/general-cabins.svelte';
import RoyalArmyOffice from '$lib/assets/maps/local/royal-army-office.svelte';
import ObservationDeck from '$lib/assets/maps/local/observation-deck.svelte';
import Cineplex from '$lib/assets/maps/local/cineplex.svelte';
import CentralDiningHall from '$lib/assets/maps/local/central-dining-hall.svelte';
import PrincesBurialChamber from '$lib/assets/maps/local/princes-burial-chamber.svelte';
import VvipLivingQuarters from '$lib/assets/maps/local/vvip-living-quarters.svelte';
import QueensLivingQuarters from '$lib/assets/maps/local/queens-living-quarters.svelte';
import SoldiersLivingQuarters from '$lib/assets/maps/local/soldiers-living-quarters.svelte';
import Casino from '$lib/assets/maps/local/casino.svelte';
import Room37564 from '$lib/assets/maps/local/room-37564.svelte';

export const MAP_ASSETS = {
  'black-whale-overview': BlackWhaleOverview,
  'tier-1': Tier1,
  'tier-2': Tier2,
  'tier-3': Tier3,
  'tier-4': Tier4,
  'tier-5': Tier5,
  'prince-apartment': PrinceApartment,
  'room-3101': Room3101,
  'heilly-processing': HeillyProcessing,
  'central-courthouse': CentralCourthouse,
  'central-police-station': CentralPoliceStation,
  'general-cabins': GeneralCabins,
  'royal-army-office': RoyalArmyOffice,
  'observation-deck': ObservationDeck,
  'cineplex': Cineplex,
  'central-dining-hall': CentralDiningHall,
  'princes-burial-chamber': PrincesBurialChamber,
  'vvip-living-quarters': VvipLivingQuarters,
  'queens-living-quarters': QueensLivingQuarters,
  'soldiers-living-quarters': SoldiersLivingQuarters,
  casino: Casino,
  'room-37564': Room37564
} as const;

export type MapAssetKey = keyof typeof MAP_ASSETS;

const LOCATION_ASSETS: Record<string, MapAssetKey> = {
  'room-3101': 'room-3101',
  't3-heilly': 'heilly-processing',
  'heilly-processing': 'heilly-processing',
  'central-courthouse': 'central-courthouse',
  'central-police-station': 'central-police-station',
  'general-cabins': 'general-cabins',
  'royal-army-office': 'royal-army-office',
  'observation-deck': 'observation-deck',
  cineplex: 'cineplex',
  'central-dining-hall': 'central-dining-hall',
  'princes-burial-chamber': 'princes-burial-chamber',
  'vvip-living-quarters': 'vvip-living-quarters',
  'queens-living-quarters': 'queens-living-quarters',
  'soldiers-living-quarters': 'soldiers-living-quarters',
  casino: 'casino',
  'room-37564': 'room-37564'
};

export function resolveMapAssetKey(level: 'OVERVIEW' | 'TIER' | 'LOCAL', tierId: string | null, locationId: string | null): MapAssetKey | null {
  if (level === 'OVERVIEW') return 'black-whale-overview';
  if (level === 'TIER') return tierId && tierId in MAP_ASSETS ? tierId as MapAssetKey : null;
  if (!locationId) return null;
  if (locationId.startsWith('room-10') || locationId.includes('royal-residential-sector-room-10')) return 'prince-apartment';
  return LOCATION_ASSETS[locationId] ?? null;
}

export function getMapAsset(key: MapAssetKey | null) {
  return key ? MAP_ASSETS[key] : null;
}
