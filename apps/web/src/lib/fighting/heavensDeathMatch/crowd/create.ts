import { STAND_WIDTH, TIERS, tierTop, tierZ } from '../../heavensArenaLayout'
import { inAisle } from '../stands/geometry'
import { NO_MARKS, type CrowdState, type Spectator } from './types'

export const SEAT_SPACING = 0.62
export const DEFAULT_CROWD_SIZE = 260

/** Same LCG as the drawn crowd: a fixed seed seats the same people on every visit. */
export function nextRandom(state: number): [value: number, state: number] {
  const next = (Math.imul(state, 1664525) + 1013904223) >>> 0
  return [next / 0x100000000, next]
}

export function crowdRandom(crowd: CrowdState): [value: number, crowd: CrowdState] {
  const [value, rng] = nextRandom(crowd.rng)
  return [value, { ...crowd, rng }]
}

function allSeats(): { tier: number; x: number }[] {
  const seats: { tier: number; x: number }[] = []
  const perRow = Math.floor(STAND_WIDTH / SEAT_SPACING)
  for (let tier = 0; tier < TIERS; tier += 1)
    for (let seat = 0; seat < perRow; seat += 1) {
      const x = -STAND_WIDTH / 2 + 0.4 + seat * SEAT_SPACING
      if (!inAisle(x)) seats.push({ tier, x })
    }
  return seats
}

export interface CrowdOptions {
  count?: number
  seed?: number
}

/** A seated crowd of real people, with deterministic seats and looks. */
export function createCrowd(options: CrowdOptions = {}): CrowdState {
  const count = options.count ?? DEFAULT_CROWD_SIZE
  let rng = (options.seed ?? 1999) >>> 0
  const roll = () => {
    const [value, next] = nextRandom(rng)
    rng = next
    return value
  }
  const seats = allSeats()
  // Deterministic shuffle, then the first `count` seats are taken.
  for (let index = seats.length - 1; index > 0; index -= 1) {
    const other = Math.floor(roll() * (index + 1))
    ;[seats[index], seats[other]] = [seats[other], seats[index]]
  }
  const spectators = seats.slice(0, count).map((seat, index): Spectator => {
    const at = { x: seat.x, y: tierTop(seat.tier), z: tierZ(seat.tier) }
    return {
      id: `s${index}`,
      look: {
        palette: Math.floor(roll() * 7),
        height: 1.55 + roll() * 0.35,
        build: roll(),
        hair: Math.floor(roll() * 5),
      },
      face: 'own',
      seat: at,
      at,
      velocity: { x: 0, y: 0, z: 0 },
      posture: 'seated',
      health: 100,
      nature: 'human',
      marks: NO_MARKS,
      route: [],
      routeIndex: 0,
      fear: 0,
      gum: false,
      revealedToHisoka: false,
    }
  })
  return { frame: 0, rng, spectators, nextId: spectators.length }
}

export function spectatorById(crowd: CrowdState, id: string): Spectator | undefined {
  return crowd.spectators.find((spectator) => spectator.id === id)
}

/** Replaces one spectator through `change`; an unknown id leaves the crowd unchanged. */
export function updateSpectator(
  crowd: CrowdState,
  id: string,
  change: (spectator: Spectator) => Spectator,
): CrowdState {
  const index = crowd.spectators.findIndex((spectator) => spectator.id === id)
  if (index < 0) return crowd
  const spectators = crowd.spectators.slice()
  spectators[index] = change(spectators[index])
  return { ...crowd, spectators }
}
