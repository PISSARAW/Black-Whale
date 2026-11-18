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
  if (fighter.aura < 30) return null
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
  // Read visible concentration/gestures and scan periodically; do not inspect
  // an opponent's hidden In flag or undiscovered projectiles to choose a defence.
  return (
    (seesCombatBody(state.opponent) &&
      state.player.pose === 'special' &&
      !state.player.attack?.concealed) ||
    state.frame % 180 < 24
  )
}

function hold(state: FightState, input: Partial<FightInput>): FightState {
  return { ...state, opponent: applyAuraContext(state.opponent, { ...EMPTY_INPUT, ...input }) }
}
