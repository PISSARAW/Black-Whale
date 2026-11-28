import { reconcileBlackVoice } from './blackVoice'
import { reconcileHalkenburgSouls } from './halkenburgSouls'
import { settleTeamBodyOutcome } from './teamOutcome'
import { finishFight } from './combatVerdict'
import { BIOHAZARD_GRACE } from './biohazard'
import { releaseBiohazardWounds } from './biohazardWounds'
import { explicitDeath, resolvePostMortemDeaths } from './fightDeaths'
import { historicalSequenceFinished } from './heavensDeathMatch/library'
import { fightFormat } from './formats'
import type { FightFinishReason, FightSide, FightState } from './types'

const SIDES = ['player', 'opponent'] as const

export function fightResolutionPending(state: FightState): boolean {
  return state.phase === 'finished' || Boolean(state.catsName || state.gumResuscitation)
}

export function fightAcceptsCommands(state: FightState): boolean {
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    !state.gumResuscitation &&
    state.deathMatch?.scenario.survival.deathFrame == null &&
    !historicalSequenceFinished(state.deathMatch)
  )
}

/** The sole verdict path for damage and attributed deaths; time and expulsion are nonlethal. */
export function resolveFightOutcome(state: FightState): FightState {
  state = reconcileBlackVoice(state)
  if (fightResolutionPending(state)) return state
  const durable = preservePointHealth(releaseBiohazardWounds(state, BIOHAZARD_GRACE))
  const triggered = reconcileHalkenburgSouls(
    resolvePostMortemDeaths(reconcileHalkenburgSouls(durable)),
  )
  if (triggered.catsName || triggered.gumResuscitation) return triggered
  const cleared = { ...triggered, deaths: undefined }
  if (state.mode === 'training') return restoreTrainingCasualties(cleared)
  return resolveRoundLoss(triggered, cleared)
}

function keepRecordedKnockoutShot(
  state: FightState,
  reason: NonNullable<FightState['finishReason']>,
  shot: number | undefined,
): FightState {
  return reason === 'knockout' && shot !== undefined ? { ...state, finishingShot: shot } : state
}

function resolveRoundLoss(triggered: FightState, cleared: FightState): FightState {
  const playerLost = lossReason(triggered, 'player')
  const opponentLost = lossReason(triggered, 'opponent')
  if (playerLost && opponentLost)
    return settleTeamBodyOutcome({
      ...cleared,
      phase: 'finished',
      winner: 'draw',
      finishReason: playerLost,
    })
  const loser = playerLost ? 'player' : 'opponent'
  const winner = playerLost ? 'opponent' : 'player'
  const reason = playerLost ?? opponentLost
  if (!reason) return cleared
  const shot = triggered.deaths?.find(
    (death) => death.victimSide === loser && death.killerSide === winner,
  )?.shotId
  return finishFight(keepRecordedKnockoutShot(cleared, reason, shot), winner, reason)
}

/** Points and death-match bouts both survive zero HP unless a death was recorded. */
function preservePointHealth(state: FightState): FightState {
  const format = fightFormat(state.formatId)
  if (format.victory !== 'points' && !format.lethalOnly) return state
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
  const body = state[side]
  if (!(body.halkSoulAlive ?? body.health > 0)) return 'knockout'
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
