import { hanzoBladeAvailable, hanzoBladeMove } from './hanzoBlade'
import { constructionFactor } from './nenCategories'
import { createNenTechniqueState } from '@black-whale/nen-engine'
import { chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, AttackKind, FightInput, FightNenZone } from './types'

export const HANZO_PROJECTION_STARTUP = 24
export const HANZO_BODY_REACH = 3.8

/** x/y belong to the controlled vessel; only this sleeping body can be hurt. */
export function sleepingBody(fighter: ArcadeFighter): ArcadeFighter {
  const projection = fighter.hanzoProjection
  if (!projection) return fighter
  return {
    ...fighter,
    hanzoProjection: undefined,
    x: projection.bodyX,
    y: 0,
    facing: projection.bodyFacing,
    nen: projection.bodyNen,
    velocityY: 0,
    motion: undefined,
    pose: 'down',
    crouching: false,
    blocking: false,
    guardFrames: 0,
    attack: null,
    bufferedAttack: null,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
  }
}

/** Touch, speech or a broken Nen link wakes the body; this is never an evade. */
export function wakeHanzoBody(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hanzoProjection) return fighter
  const body = sleepingBody(fighter)
  return {
    ...body,
    nen: fighter.nen.mode === 'zetsu' ? fighter.nen : body.nen,
    pose: 'idle',
    ryuWindow: 0,
  }
}

export function projectHanzo(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.hanzoProjection) return fighter
  const nen = createNenTechniqueState<FightNenZone>()
  return {
    ...fighter,
    nen,
    hanzoProjection: {
      bodyX: fighter.x,
      bodyFacing: fighter.facing,
      bodyNen: nen,
      startupFrames: HANZO_PROJECTION_STARTUP,
    },
    y: 0,
    velocityY: 0,
    motion: undefined,
    crouching: false,
    blocking: false,
    guardFrames: 0,
    ryuWindow: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    pose: 'idle',
    attack: null,
    bufferedAttack: null,
  }
}

export function projectionPreparing(fighter: ArcadeFighter): boolean {
  return (fighter.hanzoProjection?.startupFrames ?? 0) > 0
}

export function canRejoinHanzoBody(fighter: ArcadeFighter): boolean {
  const projection = fighter.hanzoProjection
  return Boolean(
    projection &&
    !projectionPreparing(fighter) &&
    Math.abs(fighter.x - projection.bodyX) <= HANZO_BODY_REACH &&
    fighter.y <= HANZO_BODY_REACH &&
    !fighter.attack,
  )
}

/** Only Skill 4 projects; directional techniques and the choke remain martial. */
export function isHanzoProjectionMove(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'hanzo') return !moveId || moveId === 'hanzo:neutralSpecial'
  return fighter.id === 'chrollo' && chrolloPageForMove(fighter, moveId) === 'hanzo'
}

/** Skill 4 keeps its preparation rules; armed physical moves require the carried blade. */
export function hanzoMoveResources(
  fighter: ArcadeFighter,
  moveId: string,
  kind: AttackKind,
): boolean | null {
  const physical = hanzoMartialResources(fighter, moveId)
  if (physical !== null) return physical
  if (isHanzoProjectionMove(fighter, moveId)) {
    if (fighter.hanzoProjection) return canRejoinHanzoBody(fighter)
    if (fighter.id === 'hanzo' && fighter.hatsuEffects.hatsuStolen > 0) return false
  }
  return fighter.hanzoProjection && kind === 'ranged' ? false : null
}

function hanzoMartialResources(fighter: ArcadeFighter, moveId: string): boolean | null {
  if (fighter.id !== 'hanzo') return null
  if (hanzoBladeMove(moveId)) return hanzoBladeAvailable(fighter)
  return moveId === 'hanzo:downSpecial' ? true : null
}

/** The double floats freely and passes through matter; it does not jump or dash. */
export function steerHanzoProjection(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (projectionPreparing(fighter) || fighter.attack) return fighter
  const control = constructionFactor(fighter)
  const horizontal = Number(input.right) - Number(input.left)
  const vertical = Number(input.jump) - Number(input.down)
  const nextY = Math.max(0, Math.min(12, fighter.y + vertical * 0.4 * control))
  return {
    ...fighter,
    x: Math.max(7, Math.min(93, fighter.x + horizontal * 0.5 * control)),
    y: nextY < 0.01 ? 0 : nextY,
    velocityY: 0,
    motion: undefined,
    crouching: false,
    blocking: false,
    guardFrames: 0,
    pose: horizontal || vertical ? 'walk' : 'idle',
  }
}
