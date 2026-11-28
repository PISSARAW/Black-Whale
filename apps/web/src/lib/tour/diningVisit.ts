import type { TourDetailTag } from './detailTag'
import type { Vec2 } from './types'

export const DINING_VISIT = 'decks-4-5'
export const DINING_VISIT_SPACES = {
  start: 'tier-4-starboard-corridor',
  passage: 'tier-4-central-passage',
  landing: 'tier-5-main-corridor',
  transverse: 'tier-5-transverse-corridor',
  hall: 'tier-5-central-dining-hall',
} as const

export const DINING_VISIT_START: Vec2 = [56.8, -28]
export const DINING_VISIT_HEADING = Math.PI
export const DINING_VISIT_STAIR: Vec2 = [-42, -17.5]
export const DINING_VISIT_UPPER_LANE = -15.75
export const DINING_VISIT_LOWER_LANE = -40
export const DINING_VISIT_TABLE = `${DINING_VISIT_SPACES.hall}-franklin-table`

export function diningVisitUrl(current: URL): URL {
  const url = new URL(current)
  for (const key of ['deck', 'eventId', 'mangaView', 'hatsu', 'concert'])
    url.searchParams.delete(key)
  url.searchParams.set('route', DINING_VISIT)
  url.searchParams.set('space', DINING_VISIT_SPACES.start)
  url.searchParams.set('world', 'free')
  return url
}

export function isDiningVisitStart(url: URL): boolean {
  return (
    url.searchParams.get('route') === DINING_VISIT &&
    url.searchParams.get('space') === DINING_VISIT_SPACES.start
  )
}

export const DINING_STAIR_SOURCE: TourDetailTag = {
  id: 'dining-visit-stair',
  spaceId: DINING_VISIT_SPACES.passage,
  name: 'Central passage between decks 4 and 5',
  nameFr: 'Passage central entre les ponts 4 et 5',
  provenance: 'panel',
  reconstructionRole: 'functional-reconstruction',
  source:
    'Ch. 380 identifies this passage as the connection between decks 4 and 5. The precise position of the stairs, the landing and the signs are reconstructed.',
  sourceFr:
    'Le chap. 380 identifie ce passage comme la liaison entre les ponts 4 et 5. La position exacte de l’escalier, le palier et les panneaux sont reconstitués.',
}

export const DINING_TABLE_SOURCE: TourDetailTag = {
  id: DINING_VISIT_TABLE,
  spaceId: DINING_VISIT_SPACES.hall,
  name: 'Franklin’s table and mealtimes on deck 5',
  nameFr: 'La table de Franklin et les repas au pont 5',
  provenance: 'panel',
  reconstructionRole: 'metric-estimate',
  source:
    'Ch. 358 mentions the Buor meal toll. Ch. 371 shows the refectory full at mealtime. Ch. 379–380 show Franklin at a table by the vending machines. The tabletop dimensions and finishes are estimates.',
  sourceFr:
    'Le chap. 358 mentionne la taxe Buor sur les repas. Le chap. 371 montre le réfectoire plein à l’heure du repas. Les chap. 379–380 montrent Franklin à table près des distributeurs. Les dimensions et les finitions de la table sont estimées.',
}
