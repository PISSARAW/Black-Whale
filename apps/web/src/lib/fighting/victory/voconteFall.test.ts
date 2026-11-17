import { expect, it } from 'vitest'
import { createFight } from '../engine'
import { advanceAirborne } from '../fighterMovement'
import { victoryFallTrajectory } from './nativeFall'

it('drops an elevated body through the real gravity integrator without changing combat state', () => {
  const source = createFight('voconte', 'franklin').opponent,
    before = JSON.stringify(source)
  const samples = victoryFallTrajectory(source, { height: 5, velocityX: 60, velocityY: 0 })
  expect(samples[0].y).toBeCloseTo(5 / 0.12)
  for (let i = 1; i < samples.length; i++) {
    const next = advanceAirborne(samples[i - 1])
    expect(samples[i].y).toBe(next.y)
    expect(samples[i].x).toBe(next.x)
    expect(samples[i].y).toBeLessThanOrEqual(samples[i - 1].y)
  }
  expect(samples.at(-1)!.y).toBe(0)
  expect(samples.at(-1)!.x).toBeGreaterThan(samples[0].x)
  expect(JSON.stringify(source)).toBe(before)
})
it('preserves existing ground-launch trajectories when no initial elevation is supplied', () => {
  const source = createFight('voconte', 'kalluto').opponent
  expect(victoryFallTrajectory(source, { velocityX: 20, velocityY: 16 })).toEqual(
    victoryFallTrajectory(source, { height: 0, velocityX: 20, velocityY: 16 }),
  )
})
