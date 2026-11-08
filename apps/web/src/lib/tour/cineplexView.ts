import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { CineplexSurface } from './cineplexDetailSurface'
import { dressConcourseCeiling, dressSuspendedDirectionalSigns } from './cineplexCeiling'
import { dressConcourseFloor } from './cineplexFloor'
import { dressConcourseWallSpan, dressWallPosters } from './cineplexWalls'
import { dressConcessionCounter, dressSeatingIsland } from './cineplexConcession'
import { dressTicketWindows } from './cineplexTicketDesk'
import {
  dressDescendingRamp,
  dressFeaturePosterMarquee,
  dressConcoursePillar,
} from './cineplexScreenCorridor'
import { dressScreensHallConcourse } from './cineplexScreensHall'
import { dressCinemaAuditorium } from './cineplexAuditorium'
import type { Space, Structure } from './types'

export const CINEPLEX_CONCESSION = 'tier-3-cineplex-concession'
export const CINEPLEX_SCREEN_CORRIDOR = 'tier-3-cineplex-screen-corridor'
export const CINEPLEX_TICKET_DESK = 'tier-3-cineplex-ticket-desk'
export const CINEPLEX_FOYER_PORT = 'tier-3-cineplex-foyer-port'
export const CINEPLEX_FOYER_STARBOARD = 'tier-3-cineplex-foyer-starboard'
export const CINEPLEX_SCREENS_HALL = 'tier-3-cineplex-screens-hall'

export const CINEPLEX_SCREENS = [
  'tier-3-cineplex-screen-1',
  'tier-3-cineplex-screen-2',
  'tier-3-cineplex-screen-3',
  'tier-3-cineplex-screen-4',
  'tier-3-cineplex-screen-5',
  'tier-3-cineplex-screen-6',
  'tier-3-cineplex-screen-7',
  'tier-3-cineplex-screen-8',
] as const

const CINEPLEX_SPACES = new Set<string>([
  CINEPLEX_CONCESSION,
  CINEPLEX_SCREEN_CORRIDOR,
  CINEPLEX_TICKET_DESK,
  CINEPLEX_FOYER_PORT,
  CINEPLEX_FOYER_STARBOARD,
  CINEPLEX_SCREENS_HALL,
  ...CINEPLEX_SCREENS,
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

interface SpaceDressContext {
  into: BanquetDetailBuilder
  space: Space
  floor: number
  ceiling: number
  structures: Structure[]
}

function dressConcessionSpace({
  into,
  floor,
  ceiling,
  structures,
}: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: -25, xMax: -12.5, zMin: -7.5, zMax: 7.5 }
  dressConcourseFloor(into, bounds, floor)
  dressConcourseCeiling(into, bounds, ceiling)
  dressConcourseWallSpan({ into, from: [-25, -7.5], to: [-25, 7.5], floor, ceiling })
  dressConcourseWallSpan({ into, from: [-25, -7.5], to: [-12.5, -7.5], floor, ceiling })

  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-food-counter')) dressConcessionCounter(surface)
    else if (structure.id.endsWith('-seating-island')) dressSeatingIsland(surface)
  }
  return into.finish('cineplex-concession-manga-details')
}

function dressTicketDeskSpace({
  into,
  floor,
  ceiling,
  structures,
}: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: 12.5, xMax: 25, zMin: -7.5, zMax: 7.5 }
  dressConcourseFloor(into, bounds, floor)
  dressConcourseCeiling(into, bounds, ceiling)
  dressConcourseWallSpan({ into, from: [25, 7.5], to: [25, -7.5], floor, ceiling })
  dressConcourseWallSpan({ into, from: [12.5, -7.5], to: [25, -7.5], floor, ceiling })

  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-ticket-windows')) dressTicketWindows(surface)
  }
  return into.finish('cineplex-tickets-manga-details')
}

function dressScreenCorridorSpace({
  into,
  floor,
  ceiling,
  structures,
}: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: -7.5, xMax: 7.5, zMin: -5, zMax: 12.5 }
  dressConcourseCeiling(into, bounds, ceiling)
  dressSuspendedDirectionalSigns(into, ceiling)
  dressDescendingRamp(into, floor)

  for (const structure of structures) {
    const surface = new CineplexSurface(into, structure, floor)
    if (structure.id.endsWith('-screen-corridor-poster')) dressFeaturePosterMarquee(surface)
    else if (structure.id.endsWith('-concourse-pillar')) dressConcoursePillar(surface)
  }
  return into.finish('cineplex-screen-corridor-manga-details')
}

function dressFoyerPortSpace({ into, floor, ceiling }: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: -12.5, xMax: -7.5, zMin: -7.5, zMax: 7.5 }
  dressConcourseFloor(into, bounds, floor)
  dressConcourseCeiling(into, bounds, ceiling)
  dressWallPosters({ into, from: [-12.4, -6.0], to: [-12.4, 6.0], floor })
  return into.finish('cineplex-foyer-port-manga-details')
}

function dressFoyerStarboardSpace({ into, floor, ceiling }: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: 7.5, xMax: 12.5, zMin: -7.5, zMax: 7.5 }
  dressConcourseFloor(into, bounds, floor)
  dressConcourseCeiling(into, bounds, ceiling)
  dressWallPosters({ into, from: [12.4, -6.0], to: [12.4, 6.0], floor })
  return into.finish('cineplex-foyer-starboard-manga-details')
}

function dressScreensHallSpace({ into, floor, ceiling }: SpaceDressContext): Three.Group | null {
  const bounds = { xMin: -28, xMax: 28, zMin: 12.5, zMax: 17.5 }
  dressConcourseCeiling(into, bounds, ceiling)
  dressScreensHallConcourse(into, floor)
  return into.finish('cineplex-screens-hall-manga-details')
}

function dressAuditoriumSpace({ into, space, floor }: SpaceDressContext): Three.Group | null {
  dressCinemaAuditorium(into, space, floor)
  return into.finish(`cineplex-${space.id}-manga-details`)
}

const SPACE_BUILDERS: Record<string, (ctx: SpaceDressContext) => Three.Group | null> = {
  [CINEPLEX_CONCESSION]: dressConcessionSpace,
  [CINEPLEX_TICKET_DESK]: dressTicketDeskSpace,
  [CINEPLEX_SCREEN_CORRIDOR]: dressScreenCorridorSpace,
  [CINEPLEX_FOYER_PORT]: dressFoyerPortSpace,
  [CINEPLEX_FOYER_STARBOARD]: dressFoyerStarboardSpace,
  [CINEPLEX_SCREENS_HALL]: dressScreensHallSpace,
}

for (const screenId of CINEPLEX_SCREENS) {
  SPACE_BUILDERS[screenId] = dressAuditoriumSpace
}

/** Reconstructed Cineplex from Chapter 393 (food stall, ticket desk, ramp, screens hall and 8 auditoriums) */
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
  const ceilingHeight = ceilingOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)
  const into = new BanquetDetailBuilder(THREE)
  return builder({
    into,
    space,
    floor,
    ceiling: floor + ceilingHeight,
    structures,
  })
}
