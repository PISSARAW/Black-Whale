import type { Ship } from './blueprint'
import {
  ageTheOwl, catStep, fishBite, flyTheEye, flyTheOwl, gasStep, polarityStep,
  reelStep, smokeStep, takeTheCoin, type TourReport, type TourWorld,
} from './hatsu'
import type { Vec2 } from './types'

export interface WorldStep { world: TourWorld; report: TourReport | null }

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

export function stepBeast(options: { world: TourWorld; ship: Ship; position: Vec2 }): WorldStep | null {
  let world = options.world
  let report: TourReport | null = null
  const steps = [gasStep(world, options.ship), reelStep(world, options.ship, options.position), catStep(world, options.ship)]
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

export function stepPolarity(options: { world: TourWorld; ship: Ship; seconds: number; delta: number }): WorldStep | null {
  const step = polarityStep(options.world, options.ship, { seconds: options.seconds, delta: options.delta })
  return step?.report ? { world: step.world, report: step.report } : null
}

export const stepOwl = (options: { world: TourWorld; ship: Ship }): WorldStep | null =>
  flyTheOwl(options.world, options.ship)

export const stepScout = (options: { world: TourWorld; ship: Ship }): WorldStep | null =>
  flyTheEye(options.world, options.ship)

export function stepOwlAge(world: TourWorld): WorldStep | null {
  const step = ageTheOwl(world)
  return step?.report ? { world: step.world, report: step.report } : null
}
