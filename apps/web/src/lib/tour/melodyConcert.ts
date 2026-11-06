import fixture from '../../../../../data/ship/melody-concert.json'
import type { Ship } from './blueprint'
import { castInTour, type TourWorld } from './hatsu'
import type { Post } from './cast/types'
import type { Vec2 } from './types'
import { BANQUET_SERVICE, BANQUET_SPACE } from './banquetView'

export const MELODY_CONCERT = fixture
export const CONCERT_ROOMS = [BANQUET_SPACE, BANQUET_SERVICE] as const
export interface ConcertPerformance {
  mode: 'melody' | 'self' | null
  playing: boolean
}

export function concertCast(
  posts: readonly Post[],
  options: {
    ship: Ship
    performance: ConcertPerformance
    cap: number | null
  },
): Post[] {
  const { performance, cap, ship } = options
  if (performance.mode === null) return [...posts]
  const existing = posts.find(({ member }) => member.characterId === fixture.performer.characterId)
  const rest = posts.filter(
    ({ member, spaceId }) =>
      member.characterId !== fixture.performer.characterId ||
      (performance.mode === 'self' && !CONCERT_ROOMS.some((id) => id === spaceId)),
  )
  if (performance.mode === 'self' || (cap !== null && cap < fixture.chapter)) return rest
  const performer = fixture.performer
  const room = ship.spaces.get(performer.spaceId)!
  // Explicitly requested, source-backed reconstruction; also works when the timeline is offline.
  const member = existing?.member ?? {
    characterId: performer.characterId,
    name: performer.name,
    role: performer.role,
    locations: [BANQUET_SPACE],
    since: `ch-${fixture.chapter}`,
    nen: performer.nen,
    hatsu: performer.hatsu,
    beast: null,
  }
  return [
    ...rest,
    {
      member,
      spaceId: room.id,
      tierId: room.tierId,
      inside: true,
      at: [performer.at[0], performer.at[1]],
      heading: performer.heading,
      pose: performance.playing ? 'flute' : 'idle',
      costume: { role: 'hunter', dress: 'suit' },
    },
  ]
}

/** The concert is a temporary visual projection; ordinary room effects survive its end. */
export function concertWorld(world: TourWorld, performance: ConcertPerformance): TourWorld {
  if (!performance.playing) return world
  return {
    ...world,
    flowered: [...new Set([...world.flowered, ...CONCERT_ROOMS])],
    body: { ...world.body, soothed: true },
  }
}

export interface PlayerConcertRestore {
  flowered: boolean
  playing: TourWorld['body']['playing']
  soothed: boolean
}

export function beginPlayerConcert(world: TourWorld, ship: Ship) {
  const restore: PlayerConcertRestore = {
    flowered: world.flowered.includes(BANQUET_SERVICE),
    playing: world.body.playing,
    soothed: world.body.soothed,
  }
  const held = { ...world, holding: 'melody' as const }
  const next = restore.flowered
    ? held
    : castInTour(held, 'melody', {
        ship,
        targetId: null,
        at: concertPosition(),
        standingIn: BANQUET_SERVICE,
        tune: 'bloom',
      }).world
  return {
    restore,
    world: { ...next, body: { ...next.body, playing: 'bloom' as const, soothed: true } },
  }
}

export function endPlayerConcert(world: TourWorld, restore: PlayerConcertRestore): TourWorld {
  const body =
    world.holding === 'melody' && world.body.playing === 'bloom'
      ? { ...world.body, playing: restore.playing, soothed: restore.soothed }
      : world.body
  return {
    ...world,
    body,
    flowered: restore.flowered
      ? world.flowered
      : world.flowered.filter((room) => room !== BANQUET_SERVICE),
  }
}

export const concertPosition = (): Vec2 => [fixture.performer.at[0], fixture.performer.at[1]]
