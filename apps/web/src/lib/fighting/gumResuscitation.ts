import { advancePredatorClock } from './predatorSeal'
import { advanceEmperorClock } from './kurapikaActions'
import { advanceRetrospectiveHitstop } from './retrospectiveClocks'
import { advanceVoiceRecovery } from './blackVoiceAutopilot'
import { reconcileBlackVoice } from './blackVoice'
import { resolveFightOutcome } from './fightOutcome'
import { physicalBodyKey } from './fightBodyIdentity'
import { nenAccessFailure } from './nenAccess'
import {
  GUM_RESUSCITATION_FRAMES,
  matchingResuscitationBody,
  viableAsphyxia,
} from './gumResuscitationRules'
import type { FightDeath } from './fightDeaths'
import type { FightState } from './types'

export function beginGumResuscitation(state: FightState, death: FightDeath): FightState | null {
  const side = death.victimSide,
    body = state[side]
  const certificate = body.asphyxiaCertificate
  if (state.gumResuscitation || death.cause !== 'asphyxia' || !death.fatalCondition) return null
  if (body.health > 0 || !viableAsphyxia(certificate)) return null
  const key = physicalBodyKey(state, side)
  if (
    !matchingResuscitationBody({
      body,
      key,
      program: body.gumResuscitationProgram,
      certificate,
    })
  )
    return null
  const failure = nenAccessFailure(
    { ...body, health: 1, auraExhausted: false },
    { allowVoluntaryZetsu: true },
  )
  // The prior order is paid while alive; post-mortem Nen does not require a living reserve.
  if (failure) return null
  return {
    ...state,
    player: { ...state.player, gumResuscitationPaused: true },
    opponent: { ...state.opponent, gumResuscitationPaused: true },
    gumResuscitation: {
      victimSide: side,
      bodyKey: key,
      frame: 0,
      traumaHealth: certificate!.traumaHealth,
    },
    deaths: state.deaths?.filter((entry) => entry.victimSide !== side),
    hitstop: 0,
    [side]: {
      ...body,
      gumResuscitationProgram: undefined,
      gumResuscitationFrame: 0,
      attack: null,
      bufferedAttack: null,
      blocking: false,
      pose: 'ko',
      gumResuscitationPaused: true,
    },
  }
}
export function advanceGumResuscitation(state: FightState): FightState {
  const sequence = state.gumResuscitation
  if (!sequence) return state
  if (physicalBodyKey(state, sequence.victimSide) !== sequence.bodyKey)
    return resolveFightOutcome({
      ...state,
      gumResuscitation: undefined,
      player: { ...state.player, gumResuscitationPaused: undefined },
      opponent: { ...state.opponent, gumResuscitationPaused: undefined },
    })
  const frame = sequence.frame + 1
  const next = {
    ...state,
    frame: state.frame + 1,
    hitstop: 0,
    gumResuscitation: { ...sequence, frame },
    [sequence.victimSide]: { ...state[sequence.victimSide], gumResuscitationFrame: frame },
  }
  if (frame < GUM_RESUSCITATION_FRAMES) return next
  const side = sequence.victimSide,
    body = next[side]
  return resolveFightOutcome({
    ...next,
    player: { ...next.player, gumResuscitationPaused: undefined },
    opponent: { ...next.opponent, gumResuscitationPaused: undefined },
    gumResuscitation: undefined,
    [side]: {
      ...body,
      health: Math.min(body.maxHealth, sequence.traumaHealth),
      asphyxiaCertificate: undefined,
      gumResuscitationCompleted: true,
      gumResuscitationFrame: undefined,
      gumResuscitationPaused: undefined,
      hitStun: 0,
      blockStun: 0,
      knockdownFrames: 0,
      wakeupInvulnerableFrames: 0,
      arenaRecovery: 0,
      pose: 'down',
    },
  })
}

/** The ordinary engine and direct frame simulations use exactly the same elapsed clocks. */
export function stepGumResuscitation(state: FightState): FightState {
  const clocked = advanceEmperorClock(advancePredatorClock(state))
  return reconcileBlackVoice(
    advanceVoiceRecovery(advanceRetrospectiveHitstop(advanceGumResuscitation(clocked))),
  )
}
