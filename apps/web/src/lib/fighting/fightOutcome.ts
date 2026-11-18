import { reconcileHalkenburgSouls } from './halkenburgSouls'
import { settleTeamBodyOutcome } from './teamOutcome'
import { finishFight } from './combatVerdict'
import { BIOHAZARD_GRACE } from './biohazard'
import { releaseBiohazardWounds } from './biohazardWounds'
import { explicitDeath, resolvePostMortemDeaths } from './fightDeaths'
import { fightFormat } from './formats'
import type { FightFinishReason, FightSide, FightState } from './types'

const SIDES = ['player', 'opponent'] as const

export function fightResolutionPending(state: FightState): boolean {
  return state.phase === 'finished' || Boolean(state.catsName)
}

export function fightAcceptsCommands(state: FightState): boolean {
  return state.phase === 'fighting' && !state.catsName
}

/** The sole verdict path for damage and attributed deaths; time and expulsion are nonlethal. */
export function resolveFightOutcome(state: FightState): FightState {
  if (fightResolutionPending(state)) return state
  const durable = preservePointHealth(releaseBiohazardWounds(state, BIOHAZARD_GRACE))
  const triggered = resolvePostMortemDeaths(reconcileHalkenburgSouls(durable))
  if (triggered.catsName) return triggered
  const cleared = { ...triggered, deaths: undefined }
  if (state.mode === 'training') return restoreTrainingCasualties(cleared)
  const playerLost = lossReason(triggered, 'player')
  const opponentLost = lossReason(triggered, 'opponent')
  if (playerLost && opponentLost)
    return settleTeamBodyOutcome({
      ...cleared,
      phase: 'finished',
      winner: 'draw',
      finishReason: playerLost,
    })
  if (playerLost) return finishFight(cleared, 'opponent', playerLost)
  return opponentLost ? finishFight(cleared, 'player', opponentLost) : cleared
}

function preservePointHealth(state: FightState): FightState {
  if (fightFormat(state.formatId).victory !== 'points') return state
  let next = state
  for (const side of SIDES) {
    const forced = state.deaths?.some((death) => death.victimSide === side && explicitDeath(death))
    if (forced || state[side].health > 0 || state[side].halkSoul) continue
    next = { ...next, [side]: { ...next[side], health: 1 } }
  }
  return next
}

function lossReason(
  state: FightState,
  side: FightSide,
): Exclude<FightFinishReason, 'time' | null> | null {
  const format = fightFormat(state.formatId)
  const enemy = side === 'player' ? 'opponent' : 'player'
  if (state[side].health <= 0 && !state[side].halkSoulAlive) return 'knockout'
  if (format.knockdownTarget !== null && state.knockdowns[enemy] >= format.knockdownTarget)
    return 'technical-knockout'
  return format.hitTarget !== null && state.score[enemy] >= format.hitTarget ? 'hits' : null
}

function restoreTrainingCasualties(state: FightState): FightState {
  let next = state
  for (const side of SIDES)
    if (next[side].health <= 0 && !next[side].halkSoul)
      next = {
        ...next,
        [side]: {
          ...next[side],
          health: next[side].maxHealth,
          judgmentChain: undefined,
        },
      }
  return next
}
