import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte'
import Tier1 from '$lib/assets/maps/tier-1.svelte'
import Tier1B from '$lib/assets/maps/tier-1-b.svelte'
import Tier1C from '$lib/assets/maps/tier-1-c.svelte'
import Tier2 from '$lib/assets/maps/tier-2.svelte'
import Tier3 from '$lib/assets/maps/tier-3.svelte'
import Tier3B from '$lib/assets/maps/tier-3-b.svelte'
import Tier3C from '$lib/assets/maps/tier-3-c.svelte'
import Tier4 from '$lib/assets/maps/tier-4.svelte'
import Tier4B from '$lib/assets/maps/tier-4-b.svelte'
import Tier5 from '$lib/assets/maps/tier-5.svelte'
import Tier5B from '$lib/assets/maps/tier-5-b.svelte'
import PrinceApartment from '$lib/assets/maps/local/prince-apartment.svelte'
import Room3101 from '$lib/assets/maps/local/room-3101.svelte'
import HeillyProcessing from '$lib/assets/maps/local/heilly-processing.svelte'
import CentralCourthouse from '$lib/assets/maps/local/central-courthouse.svelte'
import CentralPoliceStation from '$lib/assets/maps/local/central-police-station.svelte'
import GeneralCabins from '$lib/assets/maps/local/general-cabins.svelte'
import RoyalArmyOffice from '$lib/assets/maps/local/royal-army-office.svelte'
import ObservationDeck from '$lib/assets/maps/local/observation-deck.svelte'
import Cineplex from '$lib/assets/maps/local/cineplex.svelte'
import CentralDiningHall from '$lib/assets/maps/local/central-dining-hall.svelte'
import PrincesBurialChamber from '$lib/assets/maps/local/princes-burial-chamber.svelte'
import VvipLivingQuarters from '$lib/assets/maps/local/vvip-living-quarters.svelte'
import QueensLivingQuarters from '$lib/assets/maps/local/queens-living-quarters.svelte'
import SoldiersLivingQuarters from '$lib/assets/maps/local/soldiers-living-quarters.svelte'
import Casino from '$lib/assets/maps/local/casino.svelte'
import Room37564 from '$lib/assets/maps/local/room-37564.svelte'
import BanquetHall from '$lib/assets/maps/local/banquet-hall.svelte'
import BeyondCell from '$lib/assets/maps/local/beyond-cell.svelte'
import Bulkhead from '$lib/assets/maps/local/bulkhead.svelte'
import Lifeboats from '$lib/assets/maps/local/lifeboats.svelte'
import Tier3Cabins from '$lib/assets/maps/local/tier3-cabins.svelte'
import VipDetention from '$lib/assets/maps/local/vip-detention.svelte'
import KingQuarters from '$lib/assets/maps/local/king-quarters.svelte'
import SupremeCourt from '$lib/assets/maps/local/supreme-court.svelte'
import JusticeBureau from '$lib/assets/maps/local/justice-bureau.svelte'
import HeillyOffice from '$lib/assets/maps/local/heilly-office.svelte'
import HeillyHideout from '$lib/assets/maps/local/heilly-hideout.svelte'
import CentralHospital from '$lib/assets/maps/local/central-hospital.svelte'
import XiYuOffice from '$lib/assets/maps/local/xi-yu-office.svelte'
import ChaROffice from '$lib/assets/maps/local/cha-r-office.svelte'
import Warehouse from '$lib/assets/maps/local/warehouse.svelte'
import ScreeningRoom from '$lib/assets/maps/local/screening-room.svelte'

export const MAP_ASSETS = {
  'black-whale-overview': BlackWhaleOverview,
  'tier-1': Tier1,
  'tier-1-b': Tier1B,
  'tier-1-c': Tier1C,
  'tier-2': Tier2,
  'tier-3': Tier3,
  'tier-3-b': Tier3B,
  'tier-3-c': Tier3C,
  'tier-4': Tier4,
  'tier-4-b': Tier4B,
  'tier-5': Tier5,
  'tier-5-b': Tier5B,
  'prince-apartment': PrinceApartment,
  'room-3101': Room3101,
  'heilly-processing': HeillyProcessing,
  'central-courthouse': CentralCourthouse,
  'central-police-station': CentralPoliceStation,
  'general-cabins': GeneralCabins,
  'royal-army-office': RoyalArmyOffice,
  'observation-deck': ObservationDeck,
  cineplex: Cineplex,
  'central-dining-hall': CentralDiningHall,
  'princes-burial-chamber': PrincesBurialChamber,
  'vvip-living-quarters': VvipLivingQuarters,
  'queens-living-quarters': QueensLivingQuarters,
  'soldiers-living-quarters': SoldiersLivingQuarters,
  casino: Casino,
  'room-37564': Room37564,
  'banquet-hall': BanquetHall,
  'beyond-cell': BeyondCell,
  bulkhead: Bulkhead,
  lifeboats: Lifeboats,
  'tier3-cabins': Tier3Cabins,
  'vip-detention': VipDetention,
  'king-quarters': KingQuarters,
  'supreme-court': SupremeCourt,
  'justice-bureau': JusticeBureau,
  'heilly-office': HeillyOffice,
  'heilly-hideout': HeillyHideout,
  'central-hospital': CentralHospital,
  'xi-yu-office': XiYuOffice,
  'cha-r-office': ChaROffice,
  warehouse: Warehouse,
  'screening-room': ScreeningRoom,
} as const

export type MapAssetKey = keyof typeof MAP_ASSETS

const LOCATION_ASSETS: Record<string, MapAssetKey> = {
  'room-3101': 'room-3101',
  'heilly-processing': 'heilly-processing',
  'central-courthouse': 'central-courthouse',
  'central-police-station': 'central-police-station',
  'general-cabins': 'general-cabins',
  'royal-army-office': 'royal-army-office',
  'observation-deck': 'observation-deck',
  cineplex: 'cineplex',
  't3-cinema': 'cineplex',
  'central-dining-hall': 'central-dining-hall',
  'princes-burial-chamber': 'princes-burial-chamber',
  'vvip-living-quarters': 'vvip-living-quarters',
  'queens-living-quarters': 'queens-living-quarters',
  'soldiers-living-quarters': 'soldiers-living-quarters',
  casino: 'casino',
  'room-37564': 'room-37564',
  'banquet-hall': 'banquet-hall',
  'beyond-cell': 'beyond-cell',
  'vip-detention': 'vip-detention',
  lifeboats: 'lifeboats',
  't2-security': 'bulkhead',
  't2-vip': 'heilly-hideout',
  't2-screening-room': 'screening-room',
  't5-residential': 'general-cabins',
  't3-residential-1st': 'tier3-cabins',
  't3-residential-ord': 'general-cabins',
  't3-obs-deck': 'observation-deck',
  'king-quarters': 'king-quarters',
  'supreme-court': 'supreme-court',
  't2-justice': 'justice-bureau',
  'heilly-hideout': 'heilly-hideout',
  't3-heilly': 'heilly-office',
  't3-hospital': 'central-hospital',
  't3-access-t2': 'bulkhead',
  't4-xiyu': 'xi-yu-office',
  't5-char': 'cha-r-office',
  't5-warehouses': 'warehouse',
}

/// The deck SVGs name their clickable regions themselves, and those names are
/// not the catalogue's location slugs: the region is `king-quarters` where the
/// archive stores `tier-1-king-living-quarters`, `t5-warehouses` where it stores
/// `tier-5-warehouse`. Consumers used to bridge the two with a suffix match,
/// which silently succeeded for `banquet-hall` and silently failed for every
/// region whose name is not a suffix of its slug — those rooms rendered empty
/// however many people the archive placed in them. This table is the bridge:
/// every clickable region resolves here or nowhere.
///
/// A `null` means the region is drawn but has no catalogued location behind it
/// yet, so clicking it shows the deck without inventing an occupant.
const REGION_LOCATION_SLUGS: Record<string, string | null> = {
  // Tier 1
  'banquet-hall': 'tier-1-banquet-hall',
  'beyond-cell': 'tier-1-vvip-prison-beyond',
  casino: 'tier-1-vip-casino',
  'king-quarters': 'tier-1-king-living-quarters',
  lifeboats: 'tier-1-lifeboats',
  'princes-burial-chamber': 'tier-1-princes-burial-chamber',
  'queens-living-quarters': 'tier-1-queens-living-quarters',
  'soldiers-living-quarters': 'tier-1-soldiers-living-quarters',
  'supreme-court': 'tier-1-supreme-court',
  'vip-detention': 'tier-1-vip-jail',
  'vvip-living-quarters': 'tier-1-vvip-living-quarters',
  // Tier 2
  't2-justice': 'tier-2-ministry-of-justice',
  't2-screening-room': 'tier-2-screening-room',
  't2-security': 'tier-2-bulkhead',
  't2-vip': 'tier-2-heilly-secret-hideout',
  // Tier 3
  'central-courthouse': 'tier-3-central-courthouse',
  'central-police-station': 'tier-3-central-police-station',
  'room-3101': 'tier-3-residential-room-3101',
  't3-access-t2': 'tier-2-bulkhead',
  't3-cinema': 'tier-3-cineplex',
  't3-heilly': 'tier-3-heilly-family-office',
  't3-hospital': 'tier-3-central-hospital',
  't3-obs-deck': 'tier-3-observation-deck',
  't3-residential-1st': 'tier-3-residential-first-class',
  't3-residential-ord': 'tier-3-residential-standard',
  // Tier 4
  'royal-army-office': 'tier-4-royal-army-conference-room',
  't4-dist-center': null,
  't4-dist-east': null,
  't4-dist-west': null,
  't4-medical-limited': null,
  't4-recycling': 'tier-4-recycling-sewage-facilities',
  't4-xiyu': 'tier-4-xi-yu-family-office',
  // Tier 5
  'central-dining-hall': 'tier-5-central-dining-hall',
  'room-37564': 'tier-5-area-37564',
  't5-char': 'tier-5-cha-r-family-office',
  't5-medical-none': 'tier-5-medical-clinic',
  't5-recycling': 'tier-4-recycling-sewage-facilities',
  't5-residential': 'tier-5-standard-cabins',
  't5-warehouses': 'tier-5-warehouse',
}

/// Prince apartments are drawn from one shared asset, so their region ids carry
/// the room number instead of appearing in the table above.
export function resolveRegionLocationSlug(regionId: string | null): string | null {
  if (!regionId) return null
  const princeRoom = regionId.match(/room-(10(?:0[1-9]|1[0-4]))$/)
  if (princeRoom) return `tier-1-royal-residential-sector-room-${princeRoom[1]}`
  if (regionId in REGION_LOCATION_SLUGS) return REGION_LOCATION_SLUGS[regionId]
  return regionId
}

export function resolveMapAssetKey(
  level: 'OVERVIEW' | 'TIER' | 'LOCAL',
  tierId: string | null,
  locationId: string | null,
): MapAssetKey | null {
  if (level === 'OVERVIEW') return 'black-whale-overview'
  if (level === 'TIER') return tierId && tierId in MAP_ASSETS ? (tierId as MapAssetKey) : null
  if (!locationId) return null
  if (locationId.startsWith('room-10') || locationId.includes('royal-residential-sector-room-10'))
    return 'prince-apartment'
  return LOCATION_ASSETS[locationId] ?? null
}

export function getMapAsset(key: MapAssetKey | null) {
  return key ? MAP_ASSETS[key] : null
}
