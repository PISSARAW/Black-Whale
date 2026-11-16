import { createVisitHatsuModel } from './visitHatsuModel'

/** Shared visit symbols, sized and mounted on a combat prop's front surface. */
export function createSunMoonMarks(THREE: typeof import('three')) {
  const sunModel = createVisitHatsuModel(THREE, { model: 'sun-mark' })
  const moonModel = createVisitHatsuModel(THREE, { model: 'moon-mark' })
  const sun = sunModel.fit({ width: 0.24, height: 0.24 })
  const moon = moonModel.fit({ width: 0.24, height: 0.24 })
  sun.position.set(-0.16, 0.65, 0.34)
  moon.position.set(0.16, 0.65, 0.34)
  return { sun, moon, dispose() { sunModel.dispose(); moonModel.dispose() } }
}

export type SunMoonMarks = ReturnType<typeof createSunMoonMarks>
