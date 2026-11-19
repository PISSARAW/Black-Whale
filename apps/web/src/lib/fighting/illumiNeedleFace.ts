import { physicalBodyKey } from './fightBodyIdentity'
import { newGumSource } from './bungeeSource'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Ch. 36: three forehead needles deform a living face painfully, without Needle People's brain injury. */
export const NEEDLE_FACE_PAIN_FRAMES = 30 // Ordinary duel hitstun, not a canonical duration.

export function applyNeedleFace(
  state: FightState,
  side: FightSide,
  target: ArcadeFighter,
): ArcadeFighter {
  const actor = state[side]
  const serial = (actor.illumiNeedleGeneration ?? 0) + 1
  const prefix = `face-needle:${physicalBodyKey(state, side)}:${serial}`
  return {
    ...target,
    needleFace: {
      owner: side,
      member: state.teamMatch?.seats[side].active ?? 0,
      origin: needleOrigin(state, actor),
      needles: [`${prefix}:0`, `${prefix}:1`, `${prefix}:2`],
      mediumCopyId: actor.equipmentProps?.needles?.copyId,
      reshaping: true,
    },
    hitStun: Math.max(target.hitStun, NEEDLE_FACE_PAIN_FRAMES),
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
  }
}

function needleOrigin(state: FightState, actor: ArcadeFighter) {
  if (state.pvpSeat && !actor.attack?.nenOrigin) return {}
  return actor.attack?.nenOrigin ?? newGumSource(actor)
}

export function spentNeedleFaceCaster(actor: ArcadeFighter): ArcadeFighter {
  return { ...actor, illumiNeedleGeneration: (actor.illumiNeedleGeneration ?? 0) + 1 }
}
