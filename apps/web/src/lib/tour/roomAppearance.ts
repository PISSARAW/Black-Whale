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

/** Whether a catalogued location received a deliberate finish in this pass. */
export function hasAuthoredAppearance(locationId: string): boolean {
  return TIER_1_FINISH.has(locationId)
}

export function appearanceOf(space: Space, _tier: Tier): RoomAppearance {
  const finish = space.locationId ? TIER_1_FINISH.get(space.locationId) : undefined
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
