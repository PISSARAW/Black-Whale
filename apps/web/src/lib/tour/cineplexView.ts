import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  CineplexSurface,
  dressMoviePosterLightbox,
  CINE_CARPET,
  CINE_POSTER_ART,
} from './cineplexDetailSurface'
import { dressConcessionCounter, dressSeatingIsland } from './cineplexConcession'
import { dressTicketWindows } from './cineplexTicketDesk'
import {
  dressDescendingRamp,
  dressFeaturePosterMarquee,
  dressConcoursePillar,
} from './cineplexScreenCorridor'
import type { Structure } from './types'

export const CINEPLEX_CONCESSION = 'tier-3-cineplex-concession'
export const CINEPLEX_SCREEN_CORRIDOR = 'tier-3-cineplex-screen-corridor'
export const CINEPLEX_TICKET_DESK = 'tier-3-cineplex-ticket-desk'
export const CINEPLEX_FOYER_PORT = 'tier-3-cineplex-foyer-port'
export const CINEPLEX_FOYER_STARBOARD = 'tier-3-cineplex-foyer-starboard'
export const CINEPLEX_SCREENS_HALL = 'tier-3-cineplex-screens-hall'

const CINEPLEX_SPACES = new Set([
  CINEPLEX_CONCESSION,
  CINEPLEX_SCREEN_CORRIDOR,
  CINEPLEX_TICKET_DESK,
  CINEPLEX_FOYER_PORT,
  CINEPLEX_FOYER_STARBOARD,
  CINEPLEX_SCREENS_HALL,
])

export function isCineplexSpace(spaceId: string): boolean {
  return CINEPLEX_SPACES.has(spaceId)
}

export function hasCineplexModel(structure: Structure): boolean {
  return (
    structure.id === 'tier-3-cineplex-food-counter' ||
    structure.id === 'tier-3-cineplex-seating-island' ||
    structure.id === 'tier-3-cineplex-screen-corridor-poster' ||
    structure.id === 'tier-3-cineplex-concourse-pillar' ||
    structure.id === 'tier-3-cineplex-ticket-windows'
  )
}

/** Omit coarse blueprint blocks from walked plan while retaining collision */
export function cineplexSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => isCineplexSpace(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasCineplexModel(structure)),
  }
}

function dressFoyerDetails(into: BanquetDetailBuilder, floor: number, side: 'port' | 'starboard'): void {
  const x = side === 'port' ? -10 : 10
  // Runner carpet
  into.box([4.4, 0.02, 14.0], {
    at: [x, floor + 0.01, 0],
    rotation: [0, 0, 0],
    colour: CINE_CARPET,
  })
  // Movie poster lightboxes along side walls
  const wallX = side === 'port' ? -12.4 : 12.4
  const posterRotation: [number, number, number] = [0, side === 'port' ? Math.PI / 2 : -Math.PI / 2, 0]
  for (const z of [-4, 0, 4]) {
    dressMoviePosterLightbox({
      into,
      at: [wallX, floor + 2.2, z],
      size: [1.2, 1.8],
      rotation: posterRotation,
      artColour: CINE_POSTER_ART,
    })
  }
}

interface SpaceDressContext {
  into: BanquetDetailBuilder
  floor: number
  structures: Structure[]
}

function dressConcessionSpace({ into, floor, structures }: SpaceDressContext): Three.Group | null {
  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-food-counter')) dressConcessionCounter(surface)
    else if (structure.id.endsWith('-seating-island')) dressSeatingIsland(surface)
  }
  return into.finish('cineplex-concession-manga-details')
}

function dressTicketDeskSpace({ into, floor, structures }: SpaceDressContext): Three.Group | null {
  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-ticket-windows')) dressTicketWindows(surface)
  }
  return into.finish('cineplex-tickets-manga-details')
}

function dressScreenCorridorSpace({ into, floor, structures }: SpaceDressContext): Three.Group | null {
  dressDescendingRamp(into, floor)
  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-screen-corridor-poster')) dressFeaturePosterMarquee(surface)
    else if (structure.id.endsWith('-concourse-pillar')) dressConcoursePillar(surface)
  }
  return into.finish('cineplex-screen-corridor-manga-details')
}

function dressFoyerPortSpace({ into, floor }: SpaceDressContext): Three.Group | null {
  dressFoyerDetails(into, floor, 'port')
  return into.finish('cineplex-foyer-port-manga-details')
}

function dressFoyerStarboardSpace({ into, floor }: SpaceDressContext): Three.Group | null {
  dressFoyerDetails(into, floor, 'starboard')
  return into.finish('cineplex-foyer-starboard-manga-details')
}

const SPACE_BUILDERS: Record<string, (ctx: SpaceDressContext) => Three.Group | null> = {
  [CINEPLEX_CONCESSION]: dressConcessionSpace,
  [CINEPLEX_TICKET_DESK]: dressTicketDeskSpace,
  [CINEPLEX_SCREEN_CORRIDOR]: dressScreenCorridorSpace,
  [CINEPLEX_FOYER_PORT]: dressFoyerPortSpace,
  [CINEPLEX_FOYER_STARBOARD]: dressFoyerStarboardSpace,
}

/** Reconstructed Cineplex Concourse from Chapter 393 (food stall, ticket desk, ramp) */
export function buildCineplexDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !isCineplexSpace(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  const builder = SPACE_BUILDERS[spaceId]
  if (!space || !builder) return null

  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)
  const into = new BanquetDetailBuilder(THREE)
  return builder({ into, floor, structures })
}
