import { senseDeprived } from './saiyuSenses'
import { insideEn, perceivesProjectile } from './nenPerception'
import { voluntaryNenAvailable } from './nenAccess'
import { bungeeVisible } from './hisokaTechnique'
import { attackPhase } from './frameData'
import { canHear, MELODY_MUSIC_RANGE, soundDistance } from './melodyRules'
import type { GuardRequirement } from './combatProperties'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

export type CounterplayKind =
  'heat' | 'projectile' | 'music' | 'tether' | 'sleeping-body' | 'preparation' | 'recovery'
export interface CounterplayCue {
  kind: CounterplayKind
  key: string
  owner: FightSide
  position: { x: number; y: number }
  radius?: number
  guard?: GuardRequirement
}

/** Public manifestations only; never inputs, buffered commands, analysis or private replies. */
export function readCounterplay(state: FightState, side: FightSide): CounterplayCue | null {
  const viewer = state[side]
  if (viewer.health <= 0 || viewer.knockdownFrames > 0 || state.catsName || state.parallelFuture)
    return null
  const owner = side === 'player' ? 'opponent' : 'player'
  return (
    heatCue(state, { side, owner }) ??
    projectileCue(state, side) ??
    musicCue(state, { side, owner }) ??
    bodyCue(state, { side, owner }) ??
    tetherCue(state, { side, owner })
  )
}

export function seesCombatBody(viewer: ArcadeFighter): boolean {
  return !senseDeprived(viewer, 'sight') && !viewer.parallelEyesClosed
}

function sensesPosition(viewer: ArcadeFighter, position: { x: number; y: number }): boolean {
  return voluntaryNenAvailable(viewer) && insideEn(viewer, position)
}

function heatCue(
  state: FightState,
  pair: { side: FightSide; owner: FightSide },
): CounterplayCue | null {
  const sun = state[pair.owner].hatsuEffects.painPacker?.sun
  const viewer = state[pair.side]
  if (!sun || viewer.hatsuEffects.painPacker?.armour || !seesCombatBody(viewer)) return null
  return {
    kind: 'heat',
    key: `heat:${pair.owner}:${sun.x}:${sun.y}`,
    owner: pair.owner,
    position: { x: sun.x, y: sun.y },
    radius: sun.radius,
  }
}

function projectileCue(state: FightState, side: FightSide): CounterplayCue | null {
  const viewer = state[side]
  const threats = state.projectiles
    .filter((shot) => {
      if (shot.owner === side || shot.y < 0 || Math.abs(shot.x - viewer.x) > 42) return false
      if ((viewer.x - shot.x) * shot.velocityX < 0) return false
      return perceivesCombatProjectile(viewer, shot)
    })
    .sort((a, b) => Math.abs(a.x - viewer.x) - Math.abs(b.x - viewer.x))
  const shot = threats[0]
  return shot
    ? {
        kind: 'projectile',
        key: `projectile:${shot.id}`,
        owner: shot.owner,
        position: { x: shot.x, y: shot.y },
        guard: shot.guard ?? 'mid',
      }
    : null
}

function musicCue(
  state: FightState,
  pair: { side: FightSide; owner: FightSide },
): CounterplayCue | null {
  const viewer = state[pair.side]
  const performer = state[pair.owner]
  if (senseDeprived(viewer, 'hearing')) return null
  if (!performer.melodyPerformance || soundDistance(viewer, performer) > MELODY_MUSIC_RANGE)
    return null
  if (!seesCombatBody(viewer) && !canHear(viewer)) return null
  return {
    kind: 'music',
    key: `music:${pair.owner}`,
    owner: pair.owner,
    position: { x: performer.x, y: performer.y },
  }
}

function bodyCue(
  state: FightState,
  pair: { side: FightSide; owner: FightSide },
): CounterplayCue | null {
  const viewer = state[pair.side]
  const target = state[pair.owner]
  if (!seesCombatBody(viewer)) return null
  if (target.hanzoProjection)
    return {
      kind: 'sleeping-body',
      key: `body:${pair.owner}`,
      owner: pair.owner,
      position: { x: target.hanzoProjection.bodyX, y: 0 },
    }
  const preparing = visiblePreparation(target)
  if (preparing)
    return {
      kind: 'preparation',
      key: `preparation:${pair.owner}`,
      owner: pair.owner,
      position: { x: target.x, y: target.y },
    }
  return attackPhase(target) === 'recovery'
    ? {
        kind: 'recovery',
        key: `recovery:${pair.owner}`,
        owner: pair.owner,
        position: { x: target.x, y: target.y },
      }
    : null
}

function tetherCue(
  state: FightState,
  pair: { side: FightSide; owner: FightSide },
): CounterplayCue | null {
  const gum = state.bungeeGum
  const viewer = state[pair.side]
  if (!gum || gum.owner !== pair.owner || !bungeeVisible(state, pair.side)) return null
  if (!seesCombatBody(viewer) && !sensesPosition(viewer, viewer)) return null
  return {
    kind: 'tether',
    key: `tether:${pair.owner}`,
    owner: pair.owner,
    position: seesCombatBody(viewer)
      ? { x: state[pair.owner].x, y: state[pair.owner].y }
      : { x: viewer.x, y: viewer.y },
  }
}

function visiblePreparation(target: ArcadeFighter): boolean {
  return Boolean(
    target.cyclotronWindup ||
    target.battleCantabile?.preparation ||
    target.bashoPoem?.writingFrames ||
    target.hatsuEffects.cohortWillFrames > 0,
  )
}

function perceivesCombatProjectile(viewer: ArcadeFighter, shot: FightProjectile): boolean {
  if (sensesPosition(viewer, shot)) return true
  if (!seesCombatBody(viewer)) return false
  if (shot.matter === 'object' || !shot.concealed) return true
  return voluntaryNenAvailable(viewer) && perceivesProjectile(viewer, shot)
}
