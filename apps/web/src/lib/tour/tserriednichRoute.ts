import type { Vec2 } from './types'

export const TSERRIEDNICH_ROUTE_ID = 'tserriednich-419-420'
export const TSERRIEDNICH_ROUTE_START = 'tier-1-royal-residential-sector-room-1004-bedroom'
export const TSERRIEDNICH_EXTERIOR = 'tier-1-exterior-main-deck'

export type RouteEvidence = 'panel' | 'reconstructed'

export interface TserriednichRouteStep {
  id: string
  chapter: 419 | 420
  spaceIds: readonly string[]
  at?: Vec2
  radius?: number
  evidence: RouteEvidence
  title: string
  titleFr: string
  instruction: string
  instructionFr: string
}

/**
 * The walkable reading of chapters 419–420.
 *
 * A step is deliberately explicit about evidence. The chapters establish the
 * order and several rooms, but not a metric plan for the corridors between the
 * retracted Route A and the casino; those joins stay labelled as reconstruction.
 */
export const TSERRIEDNICH_ROUTE: readonly TserriednichRouteStep[] = [
  {
    id: 'bedroom',
    chapter: 419,
    spaceIds: [TSERRIEDNICH_ROUTE_START],
    evidence: 'panel',
    title: 'Start in the master bedroom',
    titleFr: 'Départ dans la chambre du prince',
    instruction: 'Leave the bedroom, cross the training salon and reach the entrance hall.',
    instructionFr: 'Quittez la chambre, traversez le salon d’entraînement et gagnez le vestibule.',
  },
  {
    id: 'room-1004-exit',
    chapter: 419,
    spaceIds: ['tier-1-royal-residential-approach-1004'],
    evidence: 'panel',
    title: 'Leave Room 1004 unseen',
    titleFr: 'Sortez de la chambre 1004 sans être vu',
    instruction: 'Pass door 4 and enter the princes’ starboard corridor.',
    instructionFr: 'Franchissez la porte 4 et entrez dans le couloir tribord des princes.',
  },
  {
    id: 'range-test',
    chapter: 419,
    spaceIds: ['tier-1-princes-front-corridor-starboard'],
    evidence: 'panel',
    title: 'Measure the 36-metre field',
    titleFr: 'Mesurez le champ de 36 mètres',
    instruction:
      'Cross the shared corridor, where the guards outside Room 1006 notice the disguise.',
    instructionFr:
      'Traversez le couloir commun, là où les gardes de la chambre 1006 remarquent le déguisement.',
  },
  {
    id: 'soldier-corner',
    chapter: 419,
    spaceIds: [
      'tier-1-aft-blank-approach',
      'tier-1-royal-residential-corridor-port',
      'tier-1-princes-front-corridor-port',
    ],
    evidence: 'panel',
    title: 'Turn onto the odd-numbered side',
    titleFr: 'Tournez vers le côté des chambres impaires',
    instruction:
      'Round the corner used to test Laplace’s Devil against soldiers entering its field.',
    instructionFr:
      'Contournez l’angle où Laplace’s Devil est testé sur les soldats entrant dans son champ.',
  },
  {
    id: 'recreation-hall',
    chapter: 419,
    spaceIds: ['tier-1-vvip-recreation-hall'],
    evidence: 'panel',
    title: 'Cross the VVIP entertainment hall',
    titleFr: 'Traversez la salle de loisirs VVIP',
    instruction: 'Follow the royal route toward the Tier 2 connection.',
    instructionFr: 'Suivez la voie royale vers la liaison avec le niveau 2.',
  },
  {
    id: 'route-a',
    chapter: 419,
    spaceIds: ['tier-1-route-a-landing'],
    evidence: 'panel',
    title: 'Find Route A retracted',
    titleFr: 'Trouvez la Route A rétractée',
    instruction:
      'Do not cross the gangway: martial law has withdrawn it. Turn back toward the casino.',
    instructionFr:
      'Ne franchissez pas la passerelle : la loi martiale l’a rétractée. Repartez vers le casino.',
  },
  {
    id: 'casino-connection',
    chapter: 419,
    spaceIds: ['tier-1-c-aft-passage'],
    evidence: 'reconstructed',
    title: 'Follow the sealed, empty corridors',
    titleFr: 'Suivez les couloirs évacués et condamnés',
    instruction:
      'Return through the recreation hall, follow the port and U-shaped corridors toward Route B, then take the starboard passage to Tier 1-C. This metric connection is reconstructed.',
    instructionFr:
      'Revenez par la salle de loisirs, suivez les coursives bâbord puis en U vers la Route B, et prenez le passage tribord jusqu’au pont 1-C. Ce raccord métrique est reconstitué.',
  },
  {
    id: 'casino-entry',
    chapter: 420,
    spaceIds: ['tier-1-vip-casino'],
    at: [-49, 8],
    radius: 6,
    evidence: 'panel',
    title: 'Enter the deserted casino',
    titleFr: 'Entrez dans le casino désert',
    instruction: 'Advance between the tall machines and the first patrol corpses.',
    instructionFr: 'Avancez entre les hautes bornes et les premiers corps de la patrouille.',
  },
  {
    id: 'casino-bodies',
    chapter: 420,
    spaceIds: ['tier-1-vip-casino'],
    at: [-49, 20],
    radius: 5,
    evidence: 'panel',
    title: 'Follow the trail of slit throats',
    titleFr: 'Suivez la piste des gorges tranchées',
    instruction: 'Continue toward the distant music without leaving the central aisle.',
    instructionFr: 'Continuez vers la musique lointaine sans quitter l’allée centrale.',
  },
  {
    id: 'swamp-ball',
    chapter: 420,
    spaceIds: ['tier-1-vip-casino'],
    at: [-49, 34],
    radius: 5,
    evidence: 'panel',
    title: 'Reach Hisoka at SWAMP BALL',
    titleFr: 'Rejoignez Hisoka à SWAMP BALL',
    instruction:
      'Approach under cover of the machines, where Laplace’s Devil avoids the predicted death.',
    instructionFr:
      'Approchez à couvert derrière les bornes, là où Laplace’s Devil évite la mort prédite.',
  },
  {
    id: 'emergency-room',
    chapter: 420,
    spaceIds: ['tier-1-vip-casino'],
    at: [-48, 51],
    radius: 5,
    evidence: 'panel',
    title: 'Run to the emergency-exit room',
    titleFr: 'Courez vers la salle de la sortie de secours',
    instruction: 'Follow the remaining bodies to the spiral stair at the far end of the casino.',
    instructionFr: 'Suivez les derniers corps jusqu’à l’escalier en colimaçon au fond du casino.',
  },
  {
    id: 'spiral-stair',
    chapter: 420,
    spaceIds: ['tier-1-vip-casino-emergency-stair'],
    evidence: 'reconstructed',
    title: 'Descend the emergency spiral stair',
    titleFr: 'Descendez l’escalier de secours en colimaçon',
    instruction: 'The stair is attested; its metric drop and landing are reconstructed.',
    instructionFr: 'L’escalier est attesté ; son dénivelé et son palier sont reconstitués.',
  },
  {
    id: 'outside',
    chapter: 420,
    spaceIds: [TSERRIEDNICH_EXTERIOR],
    evidence: 'panel',
    title: 'Emerge onto the exterior main deck',
    titleFr: 'Débouchez sur le pont extérieur principal',
    instruction:
      'Look past the terrace structure toward the soldiers and the missing connecting bridges.',
    instructionFr:
      'Regardez au-delà de la superstructure vers les soldats et les passerelles de liaison absentes.',
  },
]

export function reachesRouteStep(
  step: TserriednichRouteStep,
  spaceId: string | null,
  position: Vec2,
): boolean {
  if (!spaceId || !step.spaceIds.includes(spaceId)) return false
  if (!step.at) return true
  return Math.hypot(position[0] - step.at[0], position[1] - step.at[1]) <= (step.radius ?? 4)
}

export function tserriednichRouteUrl(current: URL): URL {
  const url = new URL(current)
  url.searchParams.delete('deck')
  url.searchParams.delete('mangaView')
  url.searchParams.set('space', TSERRIEDNICH_ROUTE_START)
  url.searchParams.set('route', TSERRIEDNICH_ROUTE_ID)
  return url
}
