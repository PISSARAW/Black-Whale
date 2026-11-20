import { fighterMotionStyle } from './biscuitBody'
import { humanProfile, frameShape } from '$lib/tour/humanProfiles'
import { CANON, stance } from '$lib/tour/humanProportions'
import { fighterDefinition } from './roster'
import { fightingStyle } from './fightStyles'
import { isBiscuitTrueForm } from './biscuitForm'
import { biscuitTrueFormProfile } from './biscuitFigure'
import type { ArcadeFighter, FighterId } from './types'

export interface FightPhysicalProfile {
  height: number
  shoulderHeight: number
  chinHeight: number
  armReach: number
  resistance: number
  rotation: number
  step: number
  tuck: number
  loadAt: number
}

const CACHE = new Map<string, FightPhysicalProfile>()
const PILOT_RESISTANCE: Partial<Record<FighterId, number>> = {
  franklin: 0.64,
  phinks: 0.82,
  shizuku: 1.06,
  machi: 1.14,
  kurapika: 1,
  hisoka: 1.05,
}

/** Reuse the declared anatomy and personal choreography, including Biscuit's actual form. */
export function fightPhysicalProfile(fighter: ArcadeFighter): FightPhysicalProfile {
  const trueForm = isBiscuitTrueForm(fighter)
  const key = `${fighter.id}:${trueForm}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const definition = fighterDefinition(fighter.id)
  const compact = humanProfile({
    id: `physical:${definition.modelId}`,
    kind: 'combatant',
    spaceId: 'black-whale-clash',
    tierId: 'arcade-stage',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: 0,
    stage: 0,
    hidden: false,
    human: { role: definition.modelRole, identity: definition.modelId, pose: 'idle', aura: 'none' },
  })
  const body = trueForm ? biscuitTrueFormProfile(compact) : compact
  const frame = frameShape(body.frame, body.likeness)
  const ground = stance(frame)
  const unit = body.height * ground.stature
  const style = fighterMotionStyle(fighter)
  const weight = physicalWeight(body.build)
  const mobility = fightingStyle(fighter.id).moveScale
  const result = {
    shoulderHeight: unit * (CANON.shoulderY * frame.neck + ground.lift),
    chinHeight:
      unit * (CANON.headY * frame.neck - 0.2128 * CANON.headScale * frame.head + ground.lift),
    armReach: unit * (CANON.upperArm + CANON.forearm) * frame.limb,
    height:
      body.height *
      ground.stature *
      (CANON.headY * frame.neck + 0.2128 * CANON.headScale * frame.head + ground.lift),
    resistance: PILOT_RESISTANCE[fighter.id] ?? clamp(1 / (weight * body.height), 0.64, 1.18),
    rotation: clamp(style?.amplitude ?? 1, 0.8, 1.15),
    step: clamp(mobility / weight, 0.65, 1.2),
    tuck: fighter.id === 'franklin' ? 0.65 : clamp(1.05 / weight, 0.65, 1.2),
    loadAt: clamp(0.47 + (style?.anticipation ?? 0.5) * 0.16, 0.47, 0.64),
  }
  CACHE.set(key, result)
  return result
}

function physicalWeight(build: 'slim' | 'average' | 'broad'): number {
  return build === 'broad' ? 1.25 : build === 'slim' ? 0.9 : 1
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
