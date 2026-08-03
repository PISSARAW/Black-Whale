/**
 * The names canon uses for a room, and the location slug each one means.
 *
 * `shipLocation.room` is prose: it was typed by whoever read the panel, in
 * French or English, with or without accents, sometimes as the wiki spells it.
 * The catalogue's location ids are not. This table is the bridge, and it is a
 * table rather than a rule because the mapping is genuinely arbitrary — no
 * amount of normalising turns "Area 37564" into a deck number.
 */
const NAMED_ROOM_SLUGS: ReadonlyArray<readonly [string, string]> = [
  ['heil-ly secret hideout', 'tier-2-heilly-secret-hideout'],
  ['heilly secret hideout', 'tier-2-heilly-secret-hideout'],
  ['vvip living quarters', 'tier-1-vvip-living-quarters'],
  ['vip living quarters', 'tier-1-vvip-living-quarters'],
  ['vip area', 'tier-1-vvip-living-quarters'],
  ['casino vip', 'tier-1-vip-casino'],
  ['vip casino', 'tier-1-vip-casino'],
  ['vip jail', 'tier-1-vip-jail'],
  ['vvip prison', 'tier-1-vvip-prison-beyond'],
  ['commissariat central', 'tier-3-central-police-station'],
  ['tribunal central', 'tier-3-central-courthouse'],
  ['clinique', 'tier-3-central-hospital'],
  ['hopital', 'tier-3-central-hospital'],
  ['hôpital', 'tier-3-central-hospital'],
  ['passage central tier 4–5', 'tier-4-central-passage'],
  ['passage central tier 4-5', 'tier-4-central-passage'],
  ['réfectoire central', 'tier-5-central-dining-hall'],
  ['refectoire central', 'tier-5-central-dining-hall'],
  ['central dining hall', 'tier-5-central-dining-hall'],
  ['installations de recyclage et d’épuration', 'tier-4-recycling-sewage-facilities'],
  ["installations de recyclage et d'epuration", 'tier-4-recycling-sewage-facilities'],
  ['unités résidentielles', 'tier-3-residential-units'],
  ['unites residentielles', 'tier-3-residential-units'],
  ['residential units', 'tier-3-residential-units'],
  ['cabines standard', 'tier-5-standard-cabins'],
  ['standard cabins', 'tier-5-standard-cabins'],
  ['recycling & sewage facilities', 'tier-4-recycling-sewage-facilities'],
  ['recycling and sewage facilities', 'tier-4-recycling-sewage-facilities'],
  ['central hospital', 'tier-3-central-hospital'],
  ['cha-r family hideout', 'tier-5-cha-r-family-office'],
  ['justice bureau office', 'tier-2-ministry-of-justice'],
  ['secteur résidentiel royal', 'tier-1-royal-residential-sector'],
  ['secteur residentiel royal', 'tier-1-royal-residential-sector'],
  ['royal residential sector', 'tier-1-royal-residential-sector'],
  ["king's living quarters", 'tier-1-king-living-quarters'],
  ['kings living quarters', 'tier-1-king-living-quarters'],
  ['quartiers du roi', 'tier-1-king-living-quarters'],
  ["queens' living quarters", 'tier-1-queens-living-quarters'],
  ['queens’ living quarters', 'tier-1-queens-living-quarters'],
  ['queens living quarters', 'tier-1-queens-living-quarters'],
  ["soldiers' living quarters", 'tier-1-soldiers-living-quarters'],
  ['soldiers living quarters', 'tier-1-soldiers-living-quarters'],
  ['burial chamber', 'tier-1-princes-burial-chamber'],
  ['lifeboat', 'tier-1-lifeboats'],
  ['canot de sauvetage', 'tier-1-lifeboats'],
  ['cineplex', 'tier-3-cineplex'],
  ['cinema', 'tier-3-cineplex'],
  ['cinéma', 'tier-3-cineplex'],
  ['observation deck', 'tier-3-observation-deck'],
  ['warehouse', 'tier-5-warehouse'],
  ['entrepot', 'tier-5-warehouse'],
  ['entrepôt', 'tier-5-warehouse'],
  ['area 37564', 'tier-5-area-37564'],
  ['supreme court', 'tier-1-supreme-court'],
  ['cour supreme', 'tier-1-supreme-court'],
  ['banquet hall', 'tier-1-banquet-hall'],
  ['salle de banquet', 'tier-1-banquet-hall'],
  ['central courthouse', 'tier-3-central-courthouse'],
  ['central police station', 'tier-3-central-police-station'],
  ['first-class residential block', 'tier-3-residential-first-class'],
  ['first class residential block', 'tier-3-residential-first-class'],
  // Gel's science team met in the Tier 3 cabins, which is the first-class block.
  ['cabine scientifique', 'tier-3-residential-first-class'],
  ['standard residential block', 'tier-3-residential-standard'],
  ['heil-ly family office', 'tier-3-heilly-family-office'],
  ['xi-yu family office', 'tier-4-xi-yu-family-office'],
  ['cha-r family office', 'tier-5-cha-r-family-office'],
  ['medical clinic', 'tier-5-medical-clinic'],
  ['bulkhead', 'tier-2-bulkhead'],
]

/** Case, accents and apostrophes all vary in the prose; none of them mean anything. */
export function normalizeRoom(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const NORMALIZED_ROOM_SLUGS: ReadonlyArray<readonly [string, string]> = NAMED_ROOM_SLUGS.map(
  ([label, slug]) => [normalizeRoom(label), slug] as const,
)

export interface ShipPosition {
  tier?: number | null
  room?: string | null
}

/**
 * Every location slug this position could mean, best first.
 *
 * A list rather than one answer, because only the database knows which of them
 * exists: a room the catalogue renamed still resolves through its block, and a
 * block that was never seeded still resolves through its deck. The caller walks
 * the list and takes the first hit.
 *
 * The last candidate is always a bare `tier-N`, and it is a deliberate last
 * resort: a tier is a deck, not a place, so a body dropped on one lands at the
 * tier anchor — open floor between the rooms on every deck plan. canon-lint
 * refuses a catalogue entry that stops there, so this only ever fires for an
 * entry authored while the catalogue is mid-edit.
 */
export function locationCandidates(position: ShipPosition | null | undefined): string[] {
  if (!position || (position.tier == null && !position.room)) return ['black-whale-unknown']

  const room = String(position.room ?? '').trim()
  const deck = position.tier == null ? [] : [`tier-${position.tier}`]

  // The princes' sector numbers its fourteen rooms 1001-1014, and 1000 is the
  // sector itself.
  if (/^10(?:0\d|1[0-4])$/.test(room)) {
    if (room === '1000') return ['tier-1-royal-residential-sector', 'tier-1']
    return [`tier-1-royal-residential-sector-room-${room}`, 'tier-1']
  }

  const normalized = normalizeRoom(room)

  // The queens' block numbers its eight rooms rather than naming them, so they
  // resolve by pattern the way the princes' do. Falling back to the block keeps
  // a queen inside her quarters if the room slug is ever dropped.
  const queenRoom = /^queen[’']?s room (0[1-8])$/.exec(normalized)
  if (queenRoom) {
    return [
      `tier-1-queens-living-quarters-room-${queenRoom[1]}`,
      'tier-1-queens-living-quarters',
      'tier-1',
    ]
  }

  for (const [label, slug] of NORMALIZED_ROOM_SLUGS) {
    if (normalized.includes(label)) return [slug, ...deck]
  }

  return deck
}

export type Precision = 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'

/** How precisely a presence in this kind of place may be drawn. */
export function precisionFor(locationType: string): Precision {
  if (locationType === 'ROOM') return 'EXACT_ROOM'
  if (locationType === 'TIER') return 'TIER'
  if (locationType === 'UNKNOWN') return 'UNKNOWN'
  return 'ZONE'
}

/** The `zoneType` a location declares, as the database's location kind. */
const LOCATION_TYPE_BY_ZONE: Readonly<Record<string, string>> = {
  ship: 'SHIP',
  tier: 'TIER',
  public: 'ZONE',
  administrative: 'ZONE',
  residential: 'ZONE',
  quarters: 'ROOM',
  infrastructure: 'CORRIDOR',
  mafia: 'ZONE',
  medical: 'ZONE',
  prison: 'ROOM',
  military: 'ZONE',
  corridor: 'CORRIDOR',
  zone: 'ZONE',
  room: 'ROOM',
  storage: 'ZONE',
  evacuation: 'ZONE',
  ceremonial: 'ZONE',
}

export function locationType(zoneType: string | null | undefined): string {
  return LOCATION_TYPE_BY_ZONE[String(zoneType ?? '').toLowerCase()] ?? 'UNKNOWN'
}
