import type { Vec2 } from './types'
import type { GangwayPresentation } from './gangwayLockdownView'
import {
  CASINO_LOWER_HALL,
  CASINO_SPACE,
  CASINO_STAIR_LANDING,
  CASINO_STAIR_ROOM,
} from './casinoLayout'

export const TSERRIEDNICH_ROUTE_ID = 'tserriednich-419-420'
export const TSERRIEDNICH_ROUTE_START = 'tier-1-royal-residential-sector-room-1004-bedroom'
export const TSERRIEDNICH_EXTERIOR = 'tier-1-exterior-main-deck'
export const TSERRIEDNICH_HALL = 'tier-1-vvip-recreation-hall'
const TSERRIEDNICH_VESTIBULE = 'tier-1-royal-residential-sector-room-1004-entrance'
const BLOCKADE_FOCUS: Vec2 = [-56, 116]
const BLOCKADE_PITCH = -0.57

export const TSERRIEDNICH_ROUTE_SOURCES = {
  418: 'https://www.viz.com/shonenjump/hunter-x-hunter-chapter-418/chapter/51055?action=read',
  419: 'https://www.viz.com/shonenjump/hunter-x-hunter-chapter-419/chapter/51146',
  420: 'https://mangaplus.shueisha.co.jp/viewer/7002689',
}

export interface TserriednichRouteStep {
  id: string
  chapter: keyof typeof TSERRIEDNICH_ROUTE_SOURCES
  pages: string
  spaceIds: readonly string[]
  at?: Vec2
  radius?: number
  evidence: 'panel' | 'mixed' | 'reconstructed'
  title: string
  titleFr: string
  instruction: string
  instructionFr: string
}

/** Panel evidence applies to the scene or movement, not to its dimensions in the model. */
export const TSERRIEDNICH_ROUTE: readonly TserriednichRouteStep[] = [
  {
    id: 'bedroom',
    chapter: 418,
    pages: '18–19',
    spaceIds: [TSERRIEDNICH_VESTIBULE],
    evidence: 'reconstructed',
    title: 'From the suite to its entrance',
    titleFr: 'De la suite au vestibule',
    instruction:
      'Start in the bedroom and cross the salon. The chapter shows the prince leaving in disguise. The walk from the bedroom to the vestibule is a reconstruction.',
    instructionFr:
      'Partez de la chambre et traversez le salon. Le chapitre montre le prince déguisé au moment de partir. Le trajet de la chambre au vestibule est reconstitué.',
  },
  {
    id: 'room-1004-exit',
    chapter: 419,
    pages: '2–4',
    spaceIds: ['tier-1-royal-residential-approach-1004'],
    evidence: 'panel',
    title: 'Leave Suite 1004',
    titleFr: 'Sortez de la suite 1004',
    instruction:
      'Cross the threshold of 1004, then take the door toward the corridor serving the even-numbered suites. The guards at 1004 let the prince pass under the illusion.',
    instructionFr:
      'Franchissez le seuil de 1004, puis prenez la porte vers le couloir des suites paires. Sous l’effet de l’illusion, les gardes de 1004 laissent passer le prince.',
  },
  {
    id: 'range-test',
    chapter: 419,
    pages: '3–6',
    spaceIds: ['tier-1-princes-front-corridor-starboard'],
    evidence: 'panel',
    title: 'The guards outside 1006',
    titleFr: 'Les gardes devant la 1006',
    instruction:
      'Enter the even-numbered corridor. The guards at 1006 see the disguised prince. His first illusion ends at the doorway into the shared VVIP passage.',
    instructionFr:
      'Entrez dans le couloir des suites paires. Les gardes de 1006 voient le prince déguisé. Sa première illusion prend fin à la porte du couloir commun VVIP.',
  },
  {
    id: 'soldier-corner',
    chapter: 419,
    pages: '5–17',
    spaceIds: ['tier-1-royal-residential-cross-gap-1'],
    evidence: 'mixed',
    title: 'The bend in the VVIP passage',
    titleFr: 'Le virage du couloir commun VVIP',
    instruction:
      'In the manga, the prince rounds the bend past 1002, near the door toward the king’s quarters. In the tour, use the reconstructed passage beside 1002 to reach the corridor on the other side.',
    instructionFr:
      'Dans le manga, le prince tourne au-delà de la 1002, près de l’accès aux quartiers du roi. Dans la visite, prenez la traverse reconstituée près de la 1002 vers le couloir opposé.',
  },
  {
    id: 'recreation-hall',
    chapter: 419,
    pages: '17–19',
    spaceIds: [TSERRIEDNICH_HALL],
    evidence: 'panel',
    title: 'Lockdown in the VVIP hall',
    titleFr: 'Confinement dans le hall VVIP',
    instruction:
      'Enter the VVIP Recreation Hall. The lockdown announcement interrupts the planned descent to Route A. The bridges retract and the prince changes course for the casino.',
    instructionFr:
      'Entrez dans la salle de loisirs VVIP. L’annonce du confinement interrompt la descente prévue vers la Route A. Les passerelles se rétractent et le prince oblique vers le casino.',
  },
  {
    id: 'casino-connection',
    chapter: 419,
    pages: '18–19',
    spaceIds: ['tier-1-c-port-corridor'],
    evidence: 'reconstructed',
    title: 'From the recreation hall to the casino',
    titleFr: 'De la salle de loisirs au casino',
    instruction:
      'Take the side door from the hall into the Casino Passage, then use the crossing at the end. It leads to the casino entrance. The tour reconstructs this short connection between the corridor fragments shown in the panels.',
    instructionFr:
      'Prenez la porte latérale du hall vers le Passage du casino, puis utilisez le passage au fond. Il débouche près de l’entrée du casino. La visite reconstitue ce court raccord entre les fragments dessinés.',
  },
  {
    id: 'casino-entry',
    chapter: 419,
    pages: '19',
    spaceIds: [CASINO_SPACE],
    at: [-49, 8],
    radius: 6,
    evidence: 'mixed',
    title: 'Enter the casino',
    titleFr: 'Entrez dans le casino',
    instruction:
      'Take the door off the port corridor, placed here for the tour. Beyond it, the gallery and stepped gaming floor are drawn in the manga.',
    instructionFr:
      'Prenez la porte aménagée dans la coursive bâbord pour la visite. Au-delà, la galerie et les paliers de jeu sont dessinés dans le manga.',
  },
  {
    id: 'casino-bodies',
    chapter: 420,
    pages: '2–5',
    spaceIds: [CASINO_SPACE],
    at: [-49, 20],
    radius: 5,
    evidence: 'panel',
    title: 'Find the patrol among the machines',
    titleFr: 'Repérez la patrouille entre les machines',
    instruction:
      'Move between the gaming islands. The prince finds dead soldiers before hearing SWAMP BALL.',
    instructionFr:
      'Avancez entre les îlots de jeu. Le prince découvre des soldats morts avant d’entendre SWAMP BALL.',
  },
  {
    id: 'swamp-ball',
    chapter: 420,
    pages: '6–15',
    spaceIds: [CASINO_SPACE],
    at: [-49, 34],
    radius: 5,
    evidence: 'panel',
    title: 'Approach SWAMP BALL',
    titleFr: 'Approchez de SWAMP BALL',
    instruction:
      'Approach the raised machine along the rows of cabinets. Hisoka appears above and behind the prince, who evades the fatal strike he saw in his vision.',
    instructionFr:
      'Approchez de la borne surélevée en longeant les machines. Hisoka surgit en hauteur derrière le prince, qui esquive le coup fatal aperçu dans sa vision.',
  },
  {
    id: 'emergency-room',
    chapter: 420,
    pages: '16–17',
    spaceIds: [CASINO_STAIR_ROOM],
    evidence: 'mixed',
    title: 'Reach the emergency stair room',
    titleFr: 'Rejoignez le local de secours',
    instruction:
      'Head for the plain door at the far end of the gaming area. The manga shows a separate corridor lined with bodies before the stair room. The tour shortens that approach.',
    instructionFr:
      'Rejoignez la porte sobre au bout de la zone de jeu. Dans le manga, le prince traverse d’abord un couloir bordé de corps. La visite raccourcit cet accès au local.',
  },
  {
    id: 'spiral-stair',
    chapter: 420,
    pages: '17',
    spaceIds: [CASINO_STAIR_LANDING],
    evidence: 'mixed',
    title: 'Descend the spiral stair',
    titleFr: 'Descendez le colimaçon de secours',
    instruction:
      'Go down the spiral from the circular opening. The descent is shown. The drop, stair count and lower landing are reconstructed.',
    instructionFr:
      'Descendez le colimaçon depuis la trémie circulaire. La descente est dessinée. Le dénivelé, le nombre de marches et le palier inférieur sont reconstitués.',
  },
  {
    id: 'casino-lower-hall',
    chapter: 420,
    pages: '17',
    spaceIds: [CASINO_LOWER_HALL],
    at: [-51, 58.1],
    radius: 1.5,
    evidence: 'mixed',
    title: 'Take the broad stairs into the lower hall',
    titleFr: 'Descendez le grand escalier du hall inférieur',
    instruction:
      'From the reconstructed landing, go through the opening at the head of the broad straight stair. The panels show the prince reaching the columned hall below.',
    instructionFr:
      'Depuis le palier reconstitué, franchissez l’ouverture en haut du grand escalier droit. La planche montre le prince arriver en bas, dans le hall à colonnes.',
  },
  {
    id: 'outside',
    chapter: 420,
    pages: '18–19',
    spaceIds: [TSERRIEDNICH_EXTERIOR],
    at: [-49, 69.5],
    radius: 0.32,
    evidence: 'reconstructed',
    title: 'Look out over the blockade',
    titleFr: 'Observez le bassin sous blocus',
    instruction:
      'Take the reconstructed exit onto the terrace. Walk to the rail and look down across the water at the military cordon on the quay.',
    instructionFr:
      'Prenez la sortie reconstituée vers la terrasse. Avancez jusqu’au garde-corps et regardez en contrebas, de l’autre côté de l’eau, vers le cordon militaire sur le quai.',
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

export function offersRouteInteriorExit(guided: boolean, spaceId: string): boolean {
  return (
    !guided ||
    !spaceId.startsWith('tier-1-royal-residential-sector-room-1004-') ||
    spaceId === TSERRIEDNICH_VESTIBULE
  )
}

function blockadeHeading([x, z]: Vec2): number {
  return Math.atan2(x - BLOCKADE_FOCUS[0], z - BLOCKADE_FOCUS[1])
}

export function routeCheckpoint(step: TserriednichRouteStep) {
  return {
    spaceId: step.spaceIds[0]!,
    at: step.at ?? null,
    heading: step.id === 'outside' && step.at ? blockadeHeading(step.at) : null,
    pitch: step.id === 'outside' ? BLOCKADE_PITCH : null,
  }
}

interface RouteObservation {
  spaceId: string | null
  position: Vec2
  heading: number
  pitch: number
  gangways: GangwayPresentation
}

export function completesRouteStep(step: TserriednichRouteStep, view: RouteObservation): boolean {
  if (!reachesRouteStep(step, view.spaceId, view.position)) return false
  if (step.id === 'recreation-hall') return view.gangways === 'closed'
  if (step.id !== 'outside') return true
  const turn = view.heading - blockadeHeading(view.position)
  return Math.cos(turn) >= Math.cos(Math.PI / 6) && Math.abs(view.pitch - BLOCKADE_PITCH) <= 0.26
}

export function tserriednichRouteUrl(current: URL): URL {
  const url = new URL(current)
  url.searchParams.delete('deck')
  url.searchParams.delete('mangaView')
  url.searchParams.set('space', TSERRIEDNICH_ROUTE_START)
  url.searchParams.set('route', TSERRIEDNICH_ROUTE_ID)
  return url
}
