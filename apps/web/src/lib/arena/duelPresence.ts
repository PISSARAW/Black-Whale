import { readAura } from '../combat/perception'
import type { CombatSide, CombatState, FighterState } from '../combat/types'
import { renExpression, type RenExpression } from '../fighting/nenRenPresentation'
import { nenPsychologyProfile } from '../fighting/nenPsychologyProfiles'
import type { FighterId } from '../fighting/types'
import type { HumanExpression } from '../tour/humanAppearance'
import type { ArenaCombatMotion } from './presentation'

export type ArenaPressureBand = 'silent' | 'low' | 'high' | 'overwhelming'

export interface ArenaDuelPresence {
  expression: HumanExpression
  ren: RenExpression
  pressure: ArenaPressureBand
  detail: null | { stability: 'steady' | 'wavering'; intent: 'guarded' | 'hostile' }
}

interface PresenceInput {
  state: CombatState
  subject: CombatSide
  fighterId: FighterId
  motion: ArenaCombatMotion
}

/** POV-only projection: character tuning shapes visible bearing, never canonical combat state. */
export function arenaDuelPresence(input: PresenceInput): ArenaDuelPresence {
  const { state, subject, fighterId, motion } = input
  const viewer = state[subject === 'player' ? 'opponent' : 'player']
  const fighter = state[subject]
  const profile = nenPsychologyProfile(fighterId)
  const reading = readAura(viewer, fighter)
  const stability = visibleStability(fighter, profile.composure, motion)
  const intent = visibleIntent(fighter, profile.auraResponse, motion)
  const pressure = reading.presenceDetected
    ? visiblePressure(fighter, profile.resolve, stability)
    : 0
  const ren = renExpression({ pressure, stability, intent })
  return {
    expression: visibleExpression(fighter, motion, { stability, intent }),
    ren,
    pressure: pressureBand(pressure),
    detail: viewer.gyo
      ? {
          stability: stability >= 0.55 ? 'steady' : 'wavering',
          intent: intent >= 0.55 ? 'hostile' : 'guarded',
        }
      : null,
  }
}

function visiblePressure(fighter: FighterState, resolve: number, stability: number): number {
  if (fighter.mode === 'zetsu') return 0
  const mode = fighter.mode === 'ren' ? 0.7 : 0.25
  const reserves = Math.max(0, Math.min(1, fighter.aura / Math.max(1, fighter.capacity)))
  const force = mode * (0.75 + (resolve / 10_000) * 0.25) * (0.7 + stability * 0.3)
  return Math.round(100 * force * (0.65 + reserves * 0.35))
}

function visibleStability(
  fighter: FighterState,
  composure: number,
  motion: ArenaCombatMotion,
): number {
  const reserves = fighter.aura / Math.max(1, fighter.capacity)
  const condition =
    fighter.condition === 'ready' ? 0 : fighter.condition === 'staggered' ? 0.2 : 0.4
  const hit = motion === 'hit' || motion === 'down' ? 0.28 : 0
  return clamp01(composure / 10_000 - condition - hit - Math.max(0, 0.2 - reserves))
}

function visibleIntent(
  fighter: FighterState,
  response: 'observe' | 'guard' | 'press',
  motion: ArenaCombatMotion,
): number {
  return clamp01(
    Number(Boolean(fighter.intent)) * 0.55 +
      Number(motion === 'attack') * 0.25 +
      Number(fighter.mode === 'ren') * 0.12 +
      Number(response === 'press') * 0.08,
  )
}

function visibleExpression(
  fighter: FighterState,
  motion: ArenaCombatMotion,
  read: { stability: number; intent: number },
): HumanExpression {
  if (fighter.condition === 'ko' || fighter.condition === 'down' || motion === 'hit')
    return 'anxious'
  if (fighter.aura / Math.max(1, fighter.capacity) < 0.15) return 'tired'
  if (read.intent >= 0.55 || motion === 'attack') return 'hostile'
  if (motion === 'guard' || read.stability >= 0.72) return 'severe'
  return 'neutral'
}

function pressureBand(pressure: number): ArenaPressureBand {
  if (pressure <= 0) return 'silent'
  if (pressure < 35) return 'low'
  if (pressure < 70) return 'high'
  return 'overwhelming'
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
