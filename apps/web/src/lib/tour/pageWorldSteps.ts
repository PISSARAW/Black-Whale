import type { Ship } from './blueprint'
import {
  ageTheOwl,
  catStep,
  fishBite,
  flyTheEye,
  flyTheOwl,
  gasStep,
  polarityStep,
  reelStep,
  smokeStep,
  takeTheCoin,
  type TourReport,
  type TourWorld,
} from './hatsu'
import { daysLeft, isDeciphered, oneDayBeside, oneDayBuilding } from './decipher'
import type { Vec2 } from './types'

export interface WorldStep {
  world: TourWorld
  report: TourReport | null
}

export function stepFish(options: { world: TourWorld; ship: Ship }): WorldStep | null {
  let world = options.world
  let report: TourReport | null = null
  for (const spaceId of options.world.devouring) {
    const bite = fishBite(world, options.ship, spaceId)
    if (!bite) continue
    world = bite.world
    report = bite.report
  }
  return report ? { world, report } : null
}

export function stepBeast(options: {
  world: TourWorld
  ship: Ship
  position: Vec2
}): WorldStep | null {
  let world = options.world
  let report: TourReport | null = null
  const steps = [
    gasStep(world, options.ship),
    reelStep(world, options.ship, options.position),
    catStep(world, options.ship),
  ]
  for (const step of steps) {
    if (!step) continue
    world = step.world
    report = step.report
  }
  const smoke = smokeStep(world)
  if (smoke) ({ world, report } = smoke)
  return report ? { world, report } : null
}

export const stepCoin = (world: TourWorld): WorldStep | null => takeTheCoin(world)

export function stepPolarity(options: {
  world: TourWorld
  ship: Ship
  seconds: number
  delta: number
}): WorldStep | null {
  const step = polarityStep(options.world, options.ship, {
    seconds: options.seconds,
    delta: options.delta,
  })
  return step?.report ? { world: step.world, report: step.report } : null
}

export const stepOwl = (options: { world: TourWorld; ship: Ship }): WorldStep | null =>
  flyTheOwl(options.world, options.ship)

export const stepScout = (options: { world: TourWorld; ship: Ship }): WorldStep | null =>
  flyTheEye(options.world, options.ship)

/**
 * One day of the walk on Furykov's console: the reading, then the bench.
 *
 * Both halves are advanced on the same beat and answer it in opposite ways —
 * the reading banks the day only when the visitor is in the room with whoever
 * it is on, and the bench is destroyed outright by any other room. That is the
 * asymmetry `decipher.ts` argues, and this is the one place the walk applies
 * it: nothing else in the tour reads the two together.
 *
 * A day of the walk, and never of the reader's clock — the beat is the page's
 * own second, the same one the holds expire on.
 */
export function stepConsole(scene: {
  world: TourWorld
  standingIn: string | null
}): WorldStep | null {
  const { world, standingIn } = scene
  let next = world
  let report: TourReport | null = null

  if (world.decipher && !isDeciphered(world.decipher)) {
    const beside = standingIn !== null && world.decipher.characterId === standingIn
    const worked = oneDayBeside(world.decipher, beside)
    if (worked !== world.decipher) {
      next = { ...next, decipher: worked }
      report = isDeciphered(worked)
        ? { kind: 'deciphered', characterId: worked.characterId, days: worked.days }
        : {
            kind: 'decipher-advanced',
            characterId: worked.characterId,
            left: daysLeft(worked),
          }
    }
  }

  if (world.fabrication) {
    const bench = oneDayBuilding(world.fabrication, standingIn)
    if (bench === null) {
      // Leaving costs every day of it, which is the half of the menu that the
      // walk out of the door punishes.
      next = { ...next, fabrication: null }
      report = {
        kind: 'fabrication-lost',
        slot: world.fabrication.slot,
        days: world.fabrication.days,
      }
    } else if (bench !== world.fabrication) {
      next = { ...next, fabrication: bench }
    }
  }

  return next === world ? null : { world: next, report }
}

export function stepOwlAge(world: TourWorld): WorldStep | null {
  const step = ageTheOwl(world)
  return step?.report ? { world: step.world, report: step.report } : null
}
