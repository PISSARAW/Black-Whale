import type { SourceBoundInteriorStyle } from './sourceBoundInteriorStyles'
import type { RoomAppearance } from './roomAppearanceTypes'
import type { Space } from './types'

export const SOLDIERS_QUARTERS = 'tier-1-soldiers-living-quarters'
export const ROYAL_ARMY_LOCAL_SECTION = 'tier-3-royal-army-local-section'

/** Neutral reconstruction: neither primary page establishes colours or finishes. */
export const ROYAL_ARMY_ROOM_APPEARANCE: RoomAppearance = {
  floor: 0xa4a49b,
  wall: 0xd1d0c5,
  ceiling: 0xc8c7bd,
  column: 0xbabbb2,
  wood: 0x777b73,
  metal: 0x777e7a,
  fabric: 0xa5aaa0,
  accent: 0xb6b8af,
}

export function royalArmyRoomsAppearance(space: Space): RoomAppearance | undefined {
  if (space.locationId === SOLDIERS_QUARTERS || space.id === ROYAL_ARMY_LOCAL_SECTION)
    return ROYAL_ARMY_ROOM_APPEARANCE
  return undefined
}

const common = {
  ...ROYAL_ARMY_ROOM_APPEARANCE,
  floorPattern: 'plain',
  ceilingPattern: 'plain',
  roles: {
    envelope: 'metric-estimate',
    furniture: 'metric-estimate',
    finish: 'functional-reconstruction',
  },
  triangleBudget: 150_000,
} as const

export const ROYAL_ARMY_ROOM_STYLES: SourceBoundInteriorStyle[] = [
  {
    ...common,
    locationId: SOLDIERS_QUARTERS,
    name: 'soldiers-quarters',
    evidence: {
      provenance: 'map',
      source:
        'Ch. 363, opening residential diagram: arrow towards soldiers/associates quarters and the lower-deck access. No dormitory interior is drawn. The /ship reconstruction supplies eight rooms and twelve bed symbols per room; neither count is established by that manga page. Bed profiles, dimensions, finishes and lights are reconstructed.',
      sourceFr:
        'Chap. 363, schéma résidentiel initial : flèche vers les quartiers des soldats/associés et l’accès aux ponts inférieurs. Aucun intérieur de chambrée n’est dessiné. La reconstruction /ship fournit huit salles et douze symboles de couchettes par salle ; ces deux comptes ne sont pas établis par cette page du manga. Profils des lits, métriques, finitions et éclairage reconstitués.',
    },
  },
  {
    ...common,
    locationId: ROYAL_ARMY_LOCAL_SECTION,
    name: 'royal-army-local-section',
    evidence: {
      provenance: 'panel',
      source:
        'Ch. 380, annotated ship cutaway (reading p. 10): Royal Army branch within the Tier 3 political ward. The label locates the service but provides no separate room plan or furniture. Envelope dimensions, access, plain surfaces and lights are reconstructed. This is not the central police reception shown at the end of the chapter.',
      sourceFr:
        'Chap. 380, coupe annotée du navire (page de lecture 10) : section de l’armée royale dans la zone gouvernementale du pont 3. La légende situe le service sans plan de pièce ni mobilier. Dimensions, accès, surfaces unies et éclairage reconstitués. Il ne s’agit pas de l’accueil du commissariat montré en fin de chapitre.',
    },
  },
]
