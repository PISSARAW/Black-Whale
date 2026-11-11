import type { DoorOverride } from './types'

export const CINEPLEX_HALL_SPACES = [
  'tier-3-cineplex-entrance-concourse',
  'tier-3-cineplex-concession',
  'tier-3-cineplex-foyer-port',
  'tier-3-cineplex-screen-corridor',
  'tier-3-cineplex-foyer-starboard',
  'tier-3-cineplex-ticket-desk',
  'tier-3-cineplex-screens-hall',
] as const

const source = 'Chapter 393 draws these zones as one continuous Cineplex concourse.'
const sourceFr = 'Le chapitre 393 dessine ces zones comme un seul hall de cinéma continu.'

const hallOpenings: DoorOverride[] = [
  {
    a: 'tier-3-cineplex-entrance-concourse',
    b: 'tier-3-cineplex-concession',
    at: [-18.75, -7.5],
    width: 12.5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-entrance-concourse',
    b: 'tier-3-cineplex-foyer-port',
    at: [-10, -7.5],
    width: 5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-entrance-concourse',
    b: 'tier-3-cineplex-screen-corridor',
    at: [0, -5],
    width: 15,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-entrance-concourse',
    b: 'tier-3-cineplex-foyer-starboard',
    at: [10, -7.5],
    width: 5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-entrance-concourse',
    b: 'tier-3-cineplex-ticket-desk',
    at: [18.75, -7.5],
    width: 12.5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-concession',
    b: 'tier-3-cineplex-foyer-port',
    at: [-12.5, 0],
    width: 15,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-foyer-port',
    b: 'tier-3-cineplex-screen-corridor',
    at: [-7.5, 1.25],
    width: 12.5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-screen-corridor',
    b: 'tier-3-cineplex-foyer-starboard',
    at: [7.5, 1.25],
    width: 12.5,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-foyer-starboard',
    b: 'tier-3-cineplex-ticket-desk',
    at: [12.5, 0],
    width: 15,
    reason: source,
    reasonFr: sourceFr,
  },
  {
    a: 'tier-3-cineplex-screen-corridor',
    b: 'tier-3-cineplex-screens-hall',
    at: [0, 12.5],
    width: 15,
    reason: source,
    reasonFr: sourceFr,
  },
]

const pairKey = (a: string, b: string) => [a, b].sort().join('|')
const hallOpeningKeys = new Set(hallOpenings.map(({ a, b }) => pairKey(a, b)))

export function cineplexHallDoorOverrides(): DoorOverride[] {
  return hallOpenings.map((opening) => ({ ...opening }))
}

export function isCineplexHallOpening(a: string, b: string): boolean {
  return hallOpeningKeys.has(pairKey(a, b))
}
