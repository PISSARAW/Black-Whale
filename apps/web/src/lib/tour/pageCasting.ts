import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { Ship } from './blueprint'
import { castInTour, otherHand, spendPage, TWO_HANDED_KINDS, type TourWorld } from './hatsu'
import type { Vec2 } from './types'

export type CastHand = 'first' | 'second' | 'third'
export type NenHand = 'sun' | 'moon'
export const AIR_KEYS = { first: 'dance', second: 'bloom', third: 'scatter' } as const

interface CastOptions {
  world: TourWorld
  ship: Ship
  activeKind: HatsuInteractionKind | null
  pages: readonly [HatsuInteractionKind, HatsuInteractionKind] | null
  hands: Record<CastHand, NenHand>
  hand: CastHand
  targetId: string | null
  targetSolidId: string | null
  standingIn: string | null
  at: Vec2
  heading: number
}

const castKind = (options: CastOptions): HatsuInteractionKind | null => {
  if (!options.activeKind) return null
  if (!options.pages) return options.activeKind
  return options.hand === 'second' ? options.pages[1] : options.pages[0]
}

const handMark = (options: CastOptions, kind: HatsuInteractionKind): NenHand | undefined => {
  if (!TWO_HANDED_KINDS.has(kind)) return undefined
  if (options.pages) return options.hands[options.hand === 'third' ? 'first' : options.hand]
  return options.hand === 'second' ? 'moon' : 'sun'
}

export function performTourCast(options: CastOptions) {
  const kind = castKind(options)
  if (!kind) return null
  const mark = handMark(options, kind)
  const result = castInTour(options.world, kind, {
    ship: options.ship,
    targetId: options.targetId,
    targetSolidId: options.targetSolidId,
    standingIn: options.standingIn,
    at: options.at,
    heading: options.heading,
    mark,
    tune: kind === 'melody' ? AIR_KEYS[options.hand] : undefined,
  })
  return { result, mark }
}

export function advanceCastHand(options: {
  hands: Record<CastHand, NenHand>
  hand: CastHand
  mark: NenHand | undefined
  marked: boolean
}): Record<CastHand, NenHand> {
  if (!options.mark || !options.marked) return options.hands
  return { ...options.hands, [options.hand]: otherHand(options.mark) }
}

export function performPageCast(options: {
  world: TourWorld
  kind: HatsuInteractionKind
  ship: Ship
  targetId: string | null
  targetSolidId: string | null
  standingIn: string | null
  at: Vec2
  heading: number
}) {
  const result = castInTour(options.world, options.kind, {
    ship: options.ship,
    targetId: options.targetId,
    targetSolidId: options.targetSolidId,
    standingIn: options.standingIn,
    at: options.at,
    heading: options.heading,
  })
  return { ...result, world: spendPage(result.world, options.kind) }
}
