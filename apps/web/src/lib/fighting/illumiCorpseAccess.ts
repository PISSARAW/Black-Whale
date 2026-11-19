import { illumiNenActive } from './illumiAccess'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { personalGumBody } from './gumObjectAnchorAccess'
import { illumiOriginAvailable } from './illumiDisguiseClock'
import { voluntaryNenAvailable } from './nenAccess'
import { ILLUMI_IMPLANT } from './illumiState'
import type { GumSource } from './bungeeSource'
import type { ArcadeFighter, FightState } from './types'

export function ownsCorpseTechnique(actor: ArcadeFighter): boolean {
  if (actor.id === 'illumi') return true
  if (actor.id === 'chrollo') return chrolloAbilityActive(actor, ILLUMI_IMPLANT)
  const held = actor.kurapika?.held
  return Boolean(
    actor.id === 'kurapika' &&
    held?.loaded &&
    !held.returned &&
    held.source === 'illumi' &&
    actor.kurapika?.emperorTime,
  )
}

/** Already embedded metal does not disappear when the controller loses an unused needle kit. */
export function corpseOriginAvailable(
  state: FightState,
  actor: ArcadeFighter,
  origin?: GumSource,
): boolean {
  if (!origin?.source) return true // A redacted visible effect or an old recording.
  if (origin.source === 'dolphin') return illumiOriginAvailable(state, actor, origin)
  const body = personalGumBody(actor)
  if (!illumiNenActive(body)) return false
  return origin.source === 'book'
    ? body.id === 'chrollo' && chrolloAbilityActive(body, ILLUMI_IMPLANT)
    : body.id === 'illumi'
}

export function corpseNenReady(actor: ArcadeFighter): boolean {
  return ownsCorpseTechnique(actor) && voluntaryNenAvailable(actor) && illumiNenActive(actor)
}
