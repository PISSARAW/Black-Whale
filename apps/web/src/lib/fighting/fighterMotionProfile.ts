import { fightStance } from './fightStance'
import { fightingStyle } from './fightStyles'
import { fighterDefinition } from './roster'
import type { FighterId } from './types'
import { fighterMovementBible } from './fighterMovementBible'

/** Presentation-only motion tuning derived from each fighter's existing combat identity. */
export interface FighterMotionProfile {
  walk: number
  dash: number
  jump: number
  landing: number
  attack: number
  impact: number
}

const CACHE = new Map<FighterId, FighterMotionProfile>()

export function fighterMotionProfile(id: FighterId): FighterMotionProfile {
  const held = CACHE.get(id)
  if (held) return held
  const definition = fighterDefinition(id)
  const style = fightingStyle(id)
  const stance = fightStance(id)
  const agility = normalise(definition.speed, 0.8, 1.2)
  const power = normalise(definition.power, 0.85, 1.25)
  const mobility = normalise(style.moveScale, 0.82, 1.18)
  const rhythm = normalise(stance?.tempo ?? 1.3, 0.4, 2.6)
  const commitment = normalise(style.heavyThreshold, 0.25, 0.8)
  const bible = fighterMovementBible(id)
  const made = {
    walk: (0.86 + rhythm * 0.16 + mobility * 0.1) * bible.locomotion,
    dash: (0.84 + agility * 0.2 + mobility * 0.12 - power * 0.05) * bible.burst,
    jump: (0.88 + agility * 0.14 + rhythm * 0.06) * bible.air,
    landing: (0.84 + power * 0.22 + commitment * 0.08 - agility * 0.05) * bible.weight,
    attack: (0.84 + power * 0.2 + commitment * 0.12) * bible.commitment,
    impact: (0.84 + power * 0.24 + commitment * 0.08) * bible.weight * bible.exaggeration,
  }
  CACHE.set(id, made)
  return made
}

function normalise(value: number, minimum: number, maximum: number): number {
  return Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)))
}
