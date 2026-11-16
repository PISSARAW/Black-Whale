import { impactPresentation } from './fightImpactPresentation'
import type { FightState, FighterId } from './types'

export interface FightComfort {
  shake: 0 | 0.5 | 1
  flashes: boolean
  highContrast: boolean
}
const STORAGE_KEY = 'black-whale:clash-comfort:v1'
export const defaultFightComfort = (): FightComfort => ({
  shake: 1,
  flashes: true,
  highContrast: false,
})

export function readFightComfort(storage?: Pick<Storage, 'getItem'>): FightComfort {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    if (
      !value ||
      ![0, 0.5, 1].includes(value.shake) ||
      typeof value.flashes !== 'boolean' ||
      typeof value.highContrast !== 'boolean'
    )
      return defaultFightComfort()
    return { shake: value.shake, flashes: value.flashes, highContrast: value.highContrast }
  } catch {
    return defaultFightComfort()
  }
}
export function saveFightComfort(value: FightComfort, storage?: Pick<Storage, 'setItem'>): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* Session settings remain usable. */
  }
}
export function effectiveFightComfort(value: FightComfort, reducedMotion: boolean): FightComfort {
  return reducedMotion ? { ...value, shake: 0, flashes: false } : value
}
export function comfortableImpact(options: {
  impact: NonNullable<FightState['impact']>
  attacker: FighterId
  comfort: FightComfort
}) {
  const profile = impactPresentation(options.impact, options.attacker)
  return {
    ...profile,
    shakeMs: profile.shakeMs * options.comfort.shake,
    shakeX: profile.shakeX * options.comfort.shake,
    shakeY: profile.shakeY * options.comfort.shake,
    sparks: options.comfort.flashes ? profile.sparks : 0,
  }
}
