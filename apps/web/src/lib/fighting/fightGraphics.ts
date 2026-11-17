/** Rendering choices never change simulation, Nen visibility or collision geometry. */
export type FightGraphics = 'performance' | 'balanced' | 'quality'
export const FIGHT_GRAPHICS: readonly FightGraphics[] = ['performance', 'balanced', 'quality']

const PROFILES = {
  performance: { pixelRatio: 1, samples: 0, bloom: false, antialias: false },
  balanced: { pixelRatio: 1.25, samples: 2, bloom: true, antialias: true },
  quality: { pixelRatio: 1.75, samples: 4, bloom: true, antialias: true },
} as const

export function fightGraphics(value: unknown) {
  const key = FIGHT_GRAPHICS.find((candidate) => candidate === value) ?? 'quality'
  return PROFILES[key]
}

export function fightPixelRatio(deviceRatio: number, graphics?: FightGraphics): number {
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1
  return Math.min(ratio, fightGraphics(graphics).pixelRatio)
}
