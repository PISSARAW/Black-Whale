import { enProfile } from './en/profiles'
import { seesCombatBody } from './fightCounterplay'
import { insideEn } from './nenPerception'
import { shuObject } from './nenAdvanced'
import { applyAuraContext } from './nen'
import { doctrineOpponentNen } from './nenDoctrineActions'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

/** Decisions depend on perceived threats. En never grants an automatic dodge. */
export function advancedOpponentNen(state: FightState): FightState | null {
  return defaultOpponentNen(state) ?? doctrineOpponentNen(state)
}

function defaultOpponentNen(state: FightState): FightState | null {
  const fighter = state.opponent
  const target = state.player
  if (!canMaintain(fighter)) return null
  if (!seesCombatBody(fighter))
    return enProfile(fighter).radiusUnits !== null && state.frame % 180 < 24
      ? hold(state, { en: true })
      : null
  if (hiddenThreat(state)) return hold(state, { gyo: true })
  if (fighter.aura > 48 && shuObject(fighter) !== 'stone')
    return hold(state, { aura: true, shu: true })
  if (insideEn(fighter, target) && fighter.blocking) return hold(state, { en: true, guard: true })
  return null
}

function hiddenThreat(state: FightState): boolean {
  // A visible gesture or a held guard is a reason to look with Gyo; the hidden
  // In flag and undiscovered projectiles are never inspected to choose it.
  const cue = state.player.pose === 'special' || state.player.blocking
  return (seesCombatBody(state.opponent) && cue) || state.frame % 180 < 24
}

function hold(state: FightState, input: Partial<FightInput>): FightState {
  return { ...state, opponent: applyAuraContext(state.opponent, { ...EMPTY_INPUT, ...input }) }
}

function canMaintain(fighter: FightState['opponent']): boolean {
  return fighter.aura >= 30 && fighter.nenTactics?.goal !== 'recover'
}
