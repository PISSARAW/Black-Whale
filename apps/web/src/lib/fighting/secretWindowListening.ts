import { attackPhase } from './frameData'
import { physicalBodyAt } from './fightBodyIdentity'
import { changeDolphinBody } from './dolphinBodies'
import { arsenalMindAvailable } from './arsenalMind'
import { sleepingBody } from './hanzoProjection'
import { secretWindowNenActive } from './secretWindowAccess'
import { recordDolphinEffects } from './kurapikaDolphin'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface SecretWindowListening {
  activatedAt: number
  heard?: { frame: number; text: string }
}
declare module './types' {
  interface ArcadeFighter {
    secretWindowListening?: SecretWindowListening
  }
}

export function windowListeningMoveId(actor: ArcadeFighter): string | null {
  if (actor.id === 'musse') return 'musse:downSpecial'
  return actor.id === 'benjamin' ? 'benjamin:backSpecial' : null
}

export function secretWindowListeningAttack(actor: ArcadeFighter): boolean {
  return (
    actor.attack?.moveId === 'musse:downSpecial' || actor.attack?.moveId === 'benjamin:backSpecial'
  )
}

/** The shoulder owl listens without placing a contact bird or inventing a third function. */
export function startSecretWindowListening(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!secretWindowListeningAttack(actor) || !secretWindowNenActive(actor)) return state
  if (attackPhase(actor) !== 'active' || actor.attack?.impacted) return state
  const next = {
    ...state,
    [side]: {
      ...actor,
      attack: { ...actor.attack!, impacted: true },
      secretWindowListening: { activatedAt: state.frame },
    },
  }
  return recordDolphinEffects(state, next, side)
}

/** Voice radius is scenario tuning; barriers do not block this attested eavesdropping. */
export function captureShoulderWindowSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state
  let next = state
  for (const owner of ['player', 'opponent'] as const) {
    const count = state.teamMatch?.seats[owner].members.length ?? 1
    for (let member = 0; member < count; member++) {
      const actor = physicalBodyAt(state, owner, member)
      if (!actor || !listeningMind(actor)) continue
      const anchor = sleepingBody(actor)
      if (Math.hypot(state[speech.side].x - anchor.x, state[speech.side].y - anchor.y) > 36)
        continue
      next = changeDolphinBody(next, { owner, member }, (body) => ({
        ...body,
        secretWindowListening: {
          ...body.secretWindowListening!,
          heard: { frame: state.frame, text: speech.text },
        },
      }))
    }
  }
  return next
}

function listeningMind(actor: ArcadeFighter): boolean {
  return (
    Boolean(actor.secretWindowListening) &&
    secretWindowNenActive(actor) &&
    arsenalMindAvailable(actor)
  )
}
