import { dolphinBody, changeDolphinBody } from './dolphinBodies'
import { observeSecretWindow } from './secretWindow'
import { createMusseRetrospectiveArchive } from './benjaminMusseArchive'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Explicit chapter-413 retrospective setup, including Musse's actual inherited owl.
 * No imaginary offstage Camilla, no new body, and no numerical training threshold.
 */
export function prepareMusseHistory(state: FightState): FightState {
  const preparation = state.environment.preparation
  if (preparation?.mode !== 'scenario' || !preparation.resources.includes('musse-history'))
    return state
  let next = state
  for (const owner of ['player', 'opponent'] as const) {
    const count = state.teamMatch?.seats[owner].members.length ?? 1
    for (let member = 0; member < count; member++)
      next = prepareHistoryOwner(next, { owner, member })
  }
  return next
}

function prepareHistoryOwner(state: FightState, owner: DolphinBodyRef): FightState {
  const actor = dolphinBody(state, owner)
  if (!actor || physicalIdentity(actor) !== 'benjamin') return state
  if (actor.hatsuEffects.baton?.musseArchive) return state
  if (!actor.hatsuEffects.baton?.inherited.includes('secret-window')) return state
  const subject = historicalCamilla(state, owner.owner)
  if (!subject) return state
  return changeDolphinBody(state, owner, (body) => ({
    ...body,
    hatsuEffects: {
      ...body.hatsuEffects,
      baton: {
        ...body.hatsuEffects.baton!,
        markedTarget: subject.owner,
        musseArchive: createMusseRetrospectiveArchive(subject),
      },
    },
    secretWindow: {
      target: subject.owner,
      targetMember: subject.member,
      attachedAt: state.frame,
      musseInheritance: 'canon373',
      observation: observeSecretWindow(state, subject.owner, subject.member),
    },
  }))
}

function historicalCamilla(state: FightState, owner: FightSide): DolphinBodyRef | undefined {
  const opposing: FightSide = owner === 'player' ? 'opponent' : 'player'
  for (const side of [opposing, owner]) {
    const count = state.teamMatch?.seats[side].members.length ?? 1
    for (let member = 0; member < count; member++) {
      const ref = { owner: side, member }
      if (physicalIdentity(dolphinBody(state, ref)) === 'camilla') return ref
    }
  }
  return undefined
}

function physicalIdentity(body?: ArcadeFighter) {
  return body?.nenOwner ?? body?.id
}
