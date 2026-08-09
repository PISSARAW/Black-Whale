/**
 * The interpretive finish of a room, kept separate from its canonical contents.
 *
 * `blueprint.json` says which objects a panel or a published plan supports. It
 * does not claim a paint colour for a wall whose ink is black and white. These
 * palettes therefore never add geometry: they give the already-audited floor,
 * bulkheads, ceiling and solids a visual register appropriate to the place.
 */
import type { Space, SpaceCategory, StructureKind, Tier } from './types'

export interface RoomAppearance {
  floor: number
  wall: number
  ceiling: number
  column: number
  wood: number
  metal: number
  fabric: number
  accent: number
}

type Finish =
  | 'legacy'
  | 'royal-salon'
  | 'gilded-hall'
  | 'royal-suite'
  | 'royal-passage'
  | 'funerary'
  | 'evacuation'
  | 'court'
  | 'casino'
  | 'barracks'
  | 'secure'
  | 'government'
  | 'screening'
  | 'concealed'
  | 'protected'
  | 'bulkhead'
  | 'civic'
  | 'clinical'
  | 'police'
  | 'cineplex'
  | 'mafia-office'
  | 'observation'
  | 'first-class'
  | 'standard-cabin'
  | 'dormitory'
  | 'service-passage'
  | 'recycling'
  | 'briefing'
  | 'ei-i-office'
  | 'xi-yu-office'

const LEGACY: RoomAppearance = {
  floor: 0x2a1f1f,
  wall: 0x4a4038,
  ceiling: 0x0b0909,
  column: 0x6a5a4a,
  wood: 0x33291f,
  metal: 0x555b61,
  fabric: 0x4a4642,
  accent: 0x4c3a17,
}

/** The previous category floor is the fallback for uncatalogued circulation. */
const CATEGORY_FLOOR: Record<SpaceCategory, number> = {
  room: 0x2a1f1f,
  corridor: 0x1a1414,
  quarters: 0x3a2418,
  residential: 0x2e211c,
  public: 0x3d2a16,
  military: 0x1f2a1f,
  administrative: 0x1c2430,
  medical: 0x1b2a30,
  mafia: 0x2c1c2e,
  prison: 0x2a1414,
  ceremonial: 0x3a2e10,
  evacuation: 0x14262a,
  infrastructure: 0x1e1e1e,
  storage: 0x24211a,
}

/** Tier 1: warm timber, stone, lacquer and brass, varied by the audited use. */
const FINISHES: Record<Finish, RoomAppearance> = {
  legacy: LEGACY,
  'royal-salon': {
    floor: 0x3a261d,
    wall: 0x72533b,
    ceiling: 0x20130f,
    column: 0x9a7954,
    wood: 0x4b281d,
    metal: 0xb08a4a,
    fabric: 0x692b31,
    accent: 0xb18b4f,
  },
  'gilded-hall': {
    floor: 0x4a321a,
    wall: 0x765936,
    ceiling: 0x1c120b,
    column: 0xa1804b,
    wood: 0x4d2d18,
    metal: 0xb39150,
    fabric: 0x7b2028,
    accent: 0xc29a46,
  },
  'royal-suite': {
    floor: 0x3b2b24,
    wall: 0x665247,
    ceiling: 0x191211,
    column: 0x806857,
    wood: 0x472c21,
    metal: 0x9b805a,
    fabric: 0x5f3435,
    accent: 0x9d7b48,
  },
  'royal-passage': {
    floor: 0x302721,
    wall: 0x594b42,
    ceiling: 0x121010,
    column: 0x746356,
    wood: 0x3d2a21,
    metal: 0x806f5b,
    fabric: 0x4e3432,
    accent: 0x856b43,
  },
  funerary: {
    floor: 0x211b1b,
    wall: 0x443a3b,
    ceiling: 0x090809,
    column: 0x66595a,
    wood: 0x241719,
    metal: 0x75645c,
    fabric: 0x3d2026,
    accent: 0x74513c,
  },
  evacuation: {
    floor: 0x1d3033,
    wall: 0x4c5d60,
    ceiling: 0x0b1214,
    column: 0x718085,
    wood: 0x354044,
    metal: 0x98a3a7,
    fabric: 0x59666a,
    accent: 0xb65b38,
  },
  court: {
    floor: 0x33291f,
    wall: 0x625747,
    ceiling: 0x151210,
    column: 0x81735c,
    wood: 0x493421,
    metal: 0x8d826c,
    fabric: 0x483d35,
    accent: 0xa8894f,
  },
  casino: {
    floor: 0x3c2026,
    wall: 0x6b3b42,
    ceiling: 0x160b11,
    column: 0x8d5c58,
    wood: 0x4b271f,
    metal: 0xc09a4e,
    fabric: 0x762b43,
    accent: 0xd0a34c,
  },
  barracks: {
    floor: 0x29302b,
    wall: 0x505950,
    ceiling: 0x101310,
    column: 0x697368,
    wood: 0x403b2c,
    metal: 0x778078,
    fabric: 0x4c5148,
    accent: 0x6f7652,
  },
  secure: {
    floor: 0x25272a,
    wall: 0x4c5054,
    ceiling: 0x0c0e10,
    column: 0x686e73,
    wood: 0x34302b,
    metal: 0x7f878d,
    fabric: 0x42464a,
    accent: 0x765047,
  },
  government: {
    floor: 0x29302d,
    wall: 0x56605a,
    ceiling: 0x101412,
    column: 0x707c74,
    wood: 0x3e3528,
    metal: 0x7f8984,
    fabric: 0x45504b,
    accent: 0x7d7252,
  },
  screening: {
    floor: 0x241c28,
    wall: 0x4d4052,
    ceiling: 0x09070b,
    column: 0x67566d,
    wood: 0x352a34,
    metal: 0x6e6875,
    fabric: 0x4d354e,
    accent: 0x755270,
  },
  concealed: {
    floor: 0x2b2420,
    wall: 0x51463e,
    ceiling: 0x100d0b,
    column: 0x695d52,
    wood: 0x3f2c20,
    metal: 0x716c65,
    fabric: 0x4b3c34,
    accent: 0x805b34,
  },
  protected: {
    floor: 0x252c30,
    wall: 0x505b61,
    ceiling: 0x0d1113,
    column: 0x69767c,
    wood: 0x37342f,
    metal: 0x7c898f,
    fabric: 0x46535a,
    accent: 0x567280,
  },
  bulkhead: {
    floor: 0x292b2c,
    wall: 0x53585a,
    ceiling: 0x0e1011,
    column: 0x73787a,
    wood: 0x3b3934,
    metal: 0x858b8e,
    fabric: 0x4a4d4f,
    accent: 0x826a45,
  },
  civic: {
    floor: 0x293037,
    wall: 0x53616a,
    ceiling: 0x0e1215,
    column: 0x6c7b84,
    wood: 0x3c352d,
    metal: 0x7c8990,
    fabric: 0x46515a,
    accent: 0x6e755c,
  },
  clinical: {
    floor: 0x263538,
    wall: 0x587075,
    ceiling: 0x101719,
    column: 0x71888c,
    wood: 0x405052,
    metal: 0x8ca0a3,
    fabric: 0x547076,
    accent: 0x5b8884,
  },
  police: {
    floor: 0x252d34,
    wall: 0x4c5c68,
    ceiling: 0x0c1115,
    column: 0x657580,
    wood: 0x373735,
    metal: 0x778790,
    fabric: 0x414e57,
    accent: 0x536c80,
  },
  cineplex: {
    floor: 0x261b2a,
    wall: 0x503951,
    ceiling: 0x080609,
    column: 0x6a4c68,
    wood: 0x35252f,
    metal: 0x706270,
    fabric: 0x5d2f52,
    accent: 0x835276,
  },
  'mafia-office': {
    floor: 0x2e241f,
    wall: 0x594a40,
    ceiling: 0x110d0b,
    column: 0x716054,
    wood: 0x443023,
    metal: 0x766e65,
    fabric: 0x503a31,
    accent: 0x885d32,
  },
  observation: {
    floor: 0x243039,
    wall: 0x536b78,
    ceiling: 0x10171c,
    column: 0x718894,
    wood: 0x39454a,
    metal: 0x8397a0,
    fabric: 0x435d68,
    accent: 0x4f8298,
  },
  'first-class': {
    floor: 0x34302c,
    wall: 0x61594f,
    ceiling: 0x151210,
    column: 0x7b7164,
    wood: 0x49382b,
    metal: 0x827b70,
    fabric: 0x5d4b42,
    accent: 0x846a48,
  },
  'standard-cabin': {
    floor: 0x2d3030,
    wall: 0x565d5c,
    ceiling: 0x111414,
    column: 0x6d7674,
    wood: 0x403c35,
    metal: 0x79817f,
    fabric: 0x4b514f,
    accent: 0x657067,
  },
  dormitory: {
    floor: 0x292e2d,
    wall: 0x505a57,
    ceiling: 0x0f1312,
    column: 0x68726f,
    wood: 0x3c3a31,
    metal: 0x737d79,
    fabric: 0x454d49,
    accent: 0x626b57,
  },
  'service-passage': {
    floor: 0x292b2b,
    wall: 0x4e5455,
    ceiling: 0x0d0f10,
    column: 0x686e6f,
    wood: 0x393733,
    metal: 0x737a7b,
    fabric: 0x444849,
    accent: 0x746343,
  },
  recycling: {
    floor: 0x252b28,
    wall: 0x48544e,
    ceiling: 0x0b0f0d,
    column: 0x626d67,
    wood: 0x343b33,
    metal: 0x6e7b74,
    fabric: 0x3e4943,
    accent: 0x6f7048,
  },
  briefing: {
    floor: 0x282e31,
    wall: 0x505c61,
    ceiling: 0x0e1214,
    column: 0x69767b,
    wood: 0x3b3933,
    metal: 0x78848a,
    fabric: 0x465155,
    accent: 0x647064,
  },
  'ei-i-office': {
    floor: 0x2d2226,
    wall: 0x57434b,
    ceiling: 0x100b0e,
    column: 0x705862,
    wood: 0x422b31,
    metal: 0x756a70,
    fabric: 0x51333f,
    accent: 0x874052,
  },
  'xi-yu-office': {
    floor: 0x292621,
    wall: 0x544d41,
    ceiling: 0x0f0d0a,
    column: 0x6d6454,
    wood: 0x403225,
    metal: 0x736f65,
    fabric: 0x4b4136,
    accent: 0x7e633a,
  },
}

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

const AUTHORED_FINISH = new Map([
  ...TIER_1_FINISH,
  ...TIER_2_FINISH,
  ...TIER_3_FINISH,
  ...TIER_4_FINISH,
])

/** Whether a catalogued location received a deliberate finish in this pass. */
export function hasAuthoredAppearance(locationId: string): boolean {
  return AUTHORED_FINISH.has(locationId)
}

export function appearanceOf(space: Space, _tier: Tier): RoomAppearance {
  const finish = space.locationId ? AUTHORED_FINISH.get(space.locationId) : undefined
  return finish ? FINISHES[finish] : { ...LEGACY, floor: CATEGORY_FLOOR[space.category] }
}

/** Material families keep audited objects legible without changing their shape. */
export function structureColourOf(kind: StructureKind, appearance: RoomAppearance): number {
  switch (kind) {
    case 'table':
    case 'cabinet':
    case 'painting':
      return appearance.wood
    case 'bed':
    case 'seat':
      return appearance.fabric
    case 'platform':
    case 'counter':
    case 'casket':
      return appearance.accent
    default:
      return appearance.metal
  }
}
