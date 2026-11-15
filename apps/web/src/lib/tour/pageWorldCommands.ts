import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { Ship } from './blueprint'
import {
  EMPTY_WORLD,
  looseTheFlock,
  nextDoubleMode,
  nextEyeMode,
  nextOwlMode,
  openTheBook,
  twoPages,
  type TourReport,
  type TourWorld,
} from './hatsu'
import { bodyAfterAuraEnds } from './cast/pain'
import type { Vec2 } from './types'

export function activateTourWorld(options: {
  world: TourWorld
  kind: HatsuInteractionKind | null
  ship: Ship
  position: Vec2
  spaceId: string | null
}): TourWorld | null {
  if (options.world.holding === options.kind) return null
  const world = { ...options.world, holding: options.kind }
  if (options.kind === 'guardian') {
    world.double = options.spaceId
    world.doubleMode = options.world.doubleMode ?? 'follow'
  }
  if (options.kind === 'solicitation') {
    const loose = looseTheFlock(world, options.ship, {
      at: options.position,
      standingIn: options.spaceId,
    })
    if (loose) world.menagerie = loose.world.menagerie
  }
  if (options.kind === 'bookmark' && !twoPages(options.world.book)) world.book = openTheBook()
  return world
}

export function cycleTourMode(options: {
  world: TourWorld
  requested: HatsuInteractionKind
  active: HatsuInteractionKind | null
}): { world: TourWorld; report: TourReport } | null {
  if (options.active !== options.requested) return null
  if (options.requested === 'guardian') {
    const mode = nextDoubleMode(options.world.doubleMode)
    return {
      world: { ...options.world, doubleMode: mode },
      report: { kind: 'double-mode-changed', mode },
    }
  }
  if (options.requested === 'surveillance') {
    const mode = nextOwlMode(options.world.owlMode)
    return {
      world: { ...options.world, owlMode: mode },
      report: { kind: 'owl-mode-changed', mode },
    }
  }
  if (options.requested === 'scout') {
    const mode = nextEyeMode(options.world.eyeMode)
    return {
      world: { ...options.world, eyeMode: mode },
      report: { kind: 'eye-mode-changed', mode },
    }
  }
  return null
}

export function releaseTourWorld(world: TourWorld): { world: TourWorld; rebound: boolean } {
  return {
    rebound: Boolean(world.snakes && !world.snakes.fed),
    world: {
      ...EMPTY_WORLD,
      body: bodyAfterAuraEnds(world.body),
      holding: world.holding,
      book: world.holding === 'bookmark' ? openTheBook() : EMPTY_WORLD.book,
    },
  }
}
