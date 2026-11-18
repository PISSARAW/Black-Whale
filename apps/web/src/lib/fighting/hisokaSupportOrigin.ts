import { ownsBungeeGum } from './bungeeAccess'
import { newGumSource, sameGumSource, gumSourceAvailable, type GumSource } from './bungeeSource'
import { gumAnchorNenAvailable } from './gumObjectAnchorAccess'
import { equippedDolphin } from './dolphinBorrowing'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function gumSupportLive(state: FightState, side: FightSide, origin?: GumSource): boolean {
  return origin ? gumSourceAvailable(state, side, origin) : ownsBungeeGum(state[side])
}

/** An intercepted object remains physical when its rubber is detached. */
export function gumSupportAvailable(actor: ArcadeFighter, origin?: GumSource): boolean {
  if (!origin) return ownsBungeeGum(actor)
  if (!origin.source) return actor.health > 0
  return gumAnchorNenAvailable(actor, origin)
}

export function borrowedGumSupport(actor: ArcadeFighter, origin?: GumSource): boolean {
  return sameGumSource(origin ?? newGumSource(actor), {
    source: 'dolphin',
    theftId: equippedDolphin(actor)?.theftId,
  })
}

export function clearBorrowedGumSupport(actor: ArcadeFighter): ArcadeFighter {
  const seals = Boolean(actor.gumWoundSeals && borrowedGumSupport(actor, actor.gumWoundOrigin))
  const caught = actor.gumCatch && borrowedGumSupport(actor, actor.gumCatch)
  return {
    ...actor,
    gumWoundSeals: seals ? undefined : actor.gumWoundSeals,
    gumWoundOrigin: seals ? undefined : actor.gumWoundOrigin,
    gumProstheses:
      actor.gumProstheses && borrowedGumSupport(actor, actor.gumProstheses)
        ? undefined
        : actor.gumProstheses,
    gumCatch: caught ? { ...actor.gumCatch!, frames: 0, released: true } : actor.gumCatch,
    gumThrowReady:
      actor.gumThrowReady && borrowedGumSupport(actor, actor.gumThrowReady)
        ? undefined
        : actor.gumThrowReady,
  }
}
