/** The audited location-to-finish registry, split from the palette values. */
import type { Finish } from './roomAppearanceTypes'

const TIER_1_FINISH = new Map<string, Finish>([
  ['tier-1-banquet-hall', 'gilded-hall'],
  ['tier-1-king-living-quarters', 'royal-salon'],
  ['tier-1-lifeboats', 'evacuation'],
  ['tier-1-princes-burial-chamber', 'funerary'],
  ['tier-1-queens-living-quarters', 'royal-passage'],
  ...Array.from(
    { length: 8 },
    (_, index) =>
      [
        `tier-1-queens-living-quarters-room-${String(index + 1).padStart(2, '0')}`,
        'royal-suite' as const,
      ] as const,
  ),
  ['tier-1-royal-residential-sector', 'royal-passage'],
  ...Array.from(
    { length: 14 },
    (_, index) =>
      [`tier-1-royal-residential-sector-room-${1001 + index}`, 'royal-suite' as const] as const,
  ),
  ['tier-1-soldiers-living-quarters', 'barracks'],
  ['tier-1-supreme-court', 'court'],
  ['tier-1-vip-casino', 'casino'],
  ['tier-1-vip-jail', 'secure'],
  ['tier-1-vvip-living-quarters', 'royal-passage'],
  ['tier-1-vvip-prison-beyond', 'secure'],
])

const TIER_2_FINISH = new Map<string, Finish>([
  ['tier-2-bulkhead', 'bulkhead'],
  ['tier-2-heilly-secret-hideout', 'concealed'],
  ['tier-2-ministry-of-justice', 'government'],
  ['tier-2-screening-room', 'screening'],
  ['tier-2-vip-witness-protection-area', 'protected'],
])

const TIER_3_FINISH = new Map<string, Finish>([
  ['tier-3-central-courthouse', 'civic'],
  ['tier-3-central-hospital', 'clinical'],
  ['tier-3-central-police-station', 'police'],
  ['tier-3-cineplex', 'cineplex'],
  ['tier-3-heilly-family-office', 'mafia-office'],
  ['tier-3-observation-deck', 'observation'],
  ['tier-3-residential-first-class', 'first-class'],
  ['tier-3-residential-room-3101', 'standard-cabin'],
  ['tier-3-residential-standard', 'standard-cabin'],
  ['tier-3-residential-units', 'dormitory'],
])

const TIER_4_FINISH = new Map<string, Finish>([
  ['tier-4-central-passage', 'service-passage'],
  ['tier-4-ei-i-family-office', 'ei-i-office'],
  ['tier-4-recycling-sewage-facilities', 'recycling'],
  ['tier-4-royal-army-conference-room', 'briefing'],
  ['tier-4-xi-yu-family-office', 'xi-yu-office'],
])

const TIER_5_FINISH = new Map<string, Finish>([
  ['tier-5-area-37564', 'assembly-bay'],
  ['tier-5-central-dining-hall', 'mess-hall'],
  ['tier-5-cha-r-family-office', 'cha-r-office'],
  ['tier-5-hangar-entrance', 'hangar'],
  ['tier-5-medical-clinic', 'hold-clinic'],
  ['tier-5-standard-cabins', 'fifth-class'],
  ['tier-5-warehouse', 'warehouse'],
])

const AUTHORED_FINISH = new Map([
  ...TIER_1_FINISH,
  ...TIER_2_FINISH,
  ...TIER_3_FINISH,
  ...TIER_4_FINISH,
  ...TIER_5_FINISH,
])

export const hasAuthoredFinish = (locationId: string): boolean => AUTHORED_FINISH.has(locationId)

export const authoredFinishOf = (locationId: string): Finish | undefined =>
  AUTHORED_FINISH.get(locationId)
