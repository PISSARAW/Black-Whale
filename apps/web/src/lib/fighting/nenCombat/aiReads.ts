import { attackData, attackPhase } from '../frameData'
import { seesCombatBody } from '../fightCounterplay'
import { gyoSight } from './sight'
import { DEFENSIVE_KO_COST } from './guardKo'
import type { ArcadeFighter, FightInput, FightNenZone, FightState } from '../types'

/** Frames of a visible startup before an AI may answer it: no frame-one omniscience. */
export const AI_REACTION_FRAMES = 6
const FOCUSED_DEFENCE_RANGE = 18
const FOCUS_INPUT = {
  head: 'focusHead',
  torso: 'focusTorso',
  hands: 'focusHands',
  feet: 'focusFeet',
} as const satisfies Record<FightNenZone, keyof FightInput>

export function focusInput(zone: FightNenZone): Partial<FightInput> {
  return { [FOCUS_INPUT[zone]]: true }
}

/** In hides aura and Hatsu, never a body: only ocular Gyo reads a concealed technique. */
export function perceivesAttack(observer: ArcadeFighter, attacker: ArcadeFighter): boolean {
  return Boolean(attacker.attack) && (!attacker.attack?.concealed || gyoSight(observer))
}

/** Zone aimed at by a visible strike already past the reaction delay. */
export function incomingTargetZone(
  observer: ArcadeFighter,
  attacker: ArcadeFighter,
  gap: number,
): FightNenZone | null {
  const attack = attacker.attack
  if (!attack || !seesCombatBody(observer) || gap > FOCUSED_DEFENCE_RANGE) return null
  if (!perceivesAttack(observer, attacker)) return null
  if (attack.frame < AI_REACTION_FRAMES || attackPhase(attacker) !== 'startup') return null
  return attackData(attack.kind, attacker).targetZone
}

/** Ryu on the aimed zone; a paid defensive Ko only against a committed heavy blow. */
export function aiFocusedDefence(state: FightState, gap: number): Partial<FightInput> | null {
  const self = state.opponent
  const zone = incomingTargetZone(self, state.player, gap)
  if (!zone) return null
  const heavy = ['heavy', 'special'].includes(state.player.attack?.kind ?? '')
  if (heavy && self.aura >= DEFENSIVE_KO_COST + 30)
    return { aura: true, guard: true, gyo: true, ...focusInput(zone) }
  return self.aura > 28 ? { guard: true, ...focusInput(zone) } : null
}

/** Gyo reads the present distribution only; without ocular Gyo nothing is learned. */
export function readDefensiveKo(
  observer: ArcadeFighter,
  target: ArcadeFighter,
): FightNenZone | null {
  if (!gyoSight(observer) || !seesCombatBody(observer) || target.attack) return null
  return target.nen.ko
}

/** Stable reorder: strikes aimed away from a read Ko are tried first, none is removed. */
export function preferOpenZones<T extends { tuning: { targetZone: FightNenZone } }>(
  moves: readonly T[],
  koZone: FightNenZone | null,
): T[] {
  if (!koZone) return [...moves]
  return [
    ...moves.filter((move) => move.tuning.targetZone !== koZone),
    ...moves.filter((move) => move.tuning.targetZone === koZone),
  ]
}
