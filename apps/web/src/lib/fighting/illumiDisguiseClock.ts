import { clearIllumiFace } from './illumiDisguise'
import { cleanDisguisePins } from './illumiDisguisePins'
import { mapPhysicalBodies } from './physicalBodyMap'
import { personalGumBody } from './gumObjectAnchorAccess'
import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { dolphinBody } from './dolphinBodies'
import { stolenAuraActor } from './dolphinSupply'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { historicalPartExists } from './historicalCopyLifetime'
import type { ArcadeFighter, FightState } from './types'
import type { GumSource } from './bungeeSource'

/** Absolute elapsed time also expires the physical alteration during hitstop and Cat's Name. */
export function reconcileIllumiFaces(state: FightState): FightState {
  state = cleanDisguisePins(state)
  return mapPhysicalBodies(state, (actor) => {
    const face = actor.illumi
    if (!face?.disguised && !face?.preparation) return actor
    if (face.disguiseExpiresAt !== undefined && state.frame >= face.disguiseExpiresAt)
      return clearIllumiFace(actor)
    if (!historicalPartExists(state, face.mediumCopyId)) return clearIllumiFace(actor)
    return illumiFaceOriginAvailable(state, actor) ? actor : clearIllumiFace(actor)
  })
}

export function illumiFaceOriginAvailable(state: FightState, actor: ArcadeFighter): boolean {
  return illumiOriginAvailable(state, actor, actor.illumi?.disguiseOrigin)
}

export function illumiOriginAvailable(
  state: FightState,
  actor: ArcadeFighter,
  origin?: GumSource,
): boolean {
  if (!origin?.source) return true // Old recordings and an opponent's redacted acquisition.
  if (origin.source === 'personal') return true // The native physical alteration retains its own pins/deadline.
  if (origin.source === 'book') {
    const body = personalGumBody(actor)
    return body.id === 'chrollo' && chrolloAbilityActive(body, 'illumi:backSpecial')
  }
  return borrowedFaceOriginAvailable(state, actor, origin)
}

function borrowedFaceOriginAvailable(
  state: FightState,
  actor: ArcadeFighter,
  origin: GumSource,
): boolean {
  const held = equippedDolphin(actor)
  if (!faceLenderAvailable(state, actor)) return false
  return Boolean(
    held?.used &&
    !held.returned &&
    held.source === 'illumi' &&
    held.theftId === origin.theftId &&
    voluntaryNenAvailable(stolenAuraActor(loanCarrier(actor))),
  )
}

function faceLenderAvailable(state: FightState, actor: ArcadeFighter): boolean {
  const lender = actor.dolphinLoan ? dolphinBody(state, actor.dolphinLoan.lender) : actor
  return Boolean(lender && lender.health > 0 && lender.kurapika?.emperorTime)
}

export function borrowedIllumiFaceBusy(actor: ArcadeFighter): boolean {
  const face = actor.illumi
  return (
    face?.disguiseOrigin?.source === 'dolphin' &&
    face.disguiseOrigin.theftId === equippedDolphin(actor)?.theftId &&
    Boolean(face.disguised || face.preparation)
  )
}

export function carryIllumiFace(
  actor: ArcadeFighter,
  previous: ArcadeFighter,
  frame: number,
): ArcadeFighter {
  if (!previous.illumi?.disguised) return actor
  const face = previous.illumi
  return {
    ...actor,
    illumiDisguisePlan: previous.illumiDisguisePlan,
    illumi: {
      ...face,
      preparation: 0,
      anchor: undefined,
      disguiseExpiresAt:
        face.disguiseExpiresAt === undefined ? undefined : face.disguiseExpiresAt - frame,
    },
  }
}

/** A completed native physical disguise has no offstage Nen action to suspend. */
export function illumiRelaySignature(actor: ArcadeFighter): ArcadeFighter['illumi'] {
  const face = actor.illumi
  if (!face) return face
  if (!face.disguised && !face.preparation) return undefined
  if (face.preparation || face.mediumCopyId) return face
  return face.disguiseOrigin?.source === 'personal' ? undefined : face
}
