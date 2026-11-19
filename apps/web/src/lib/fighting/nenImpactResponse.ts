import { recordNenOpening } from './nenPreparedBranches'
import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface NenImpactResponse {
  kind: 'strike' | 'projectile' | 'bind' | 'pierce'
  force: number
  zone: 'head' | 'torso' | 'hands' | 'feet'
  sourceX: number
  duration?: number
}
declare module './types' {
  interface FightImpact {
    nenResponse?: NenImpactResponse
  }
}

/** Capture the operative effect once, before the projectile disappears or the attacker cancels. */
export function recordNenImpact(before: FightState, after: FightState): FightState {
  const hit = after.impact
  if (!hit || hit.sequence === before.impact?.sequence || !cleanContact(hit)) return after
  const side = hit.attacker === 'player' ? 'opponent' : 'player'
  const projectile = before.projectiles.find((shot) => shot.id === hit.projectileId)
  const constrained = becameBound(before[side], after[side])
  const kind = responseKind(constrained, projectile?.shape, hit.projectileId)
  const response: NenImpactResponse = {
    kind,
    duration: Math.max(1, after[side].hitStun),
    force:
      Math.min(1.35, Math.max(0.35, hit.damage / 24)) *
      fightPhysicalProfile(after[side]).resistance,
    zone: hit.zone,
    sourceX: projectile?.x ?? before[hit.attacker].x,
  }
  return recordNenOpening(before, { ...after, impact: { ...hit, nenResponse: response } })
}

function cleanContact(hit: NonNullable<FightState['impact']>): boolean {
  return !hit.blocked && !hit.parried && !hit.avoided && !hit.invulnerable
}
function bound(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.chainJail ||
    fighter.machiThread?.kind === 'bind' ||
    fighter.hatsuEffects.restrainedFrames > 0 ||
    fighter.hatsuEffects.manipulatedFrames > 0,
  )
}
function becameBound(before: ArcadeFighter, after: ArcadeFighter): boolean {
  return !bound(before) && bound(after)
}

/** A projectile recoils locally before the body catches up; a bind gathers the limbs instead. */
export function nenImpactBodyPlan(
  fighter: ArcadeFighter,
  context: { response?: NenImpactResponse; progress: number; carry?: FightPose },
  standing: FightPose,
): BodyPlan | null {
  const response = context.response
  if (!response || response.kind === 'strike') return null
  const progress = Math.min(1, Math.max(0, context.progress))
  const release = 1 - Math.max(0, (progress - 0.55) / 0.45)
  const lag = Math.min(1, progress * 5)
  const pose =
    response.kind === 'bind'
      ? bindPose()
      : projectilePose(response, lag, Math.sign(response.sourceX - fighter.x) * fighter.facing)
  return {
    pose: continuedNenPose(
      standing,
      { pose, force: response.force * release, duration: response.duration ?? 20 },
      context,
    ),
    plant: fighter.y === 0,
    key: `nen-response:${response.kind}`,
    blend: 0.025,
  }
}
function bindPose(): FightPose {
  return {
    chest: [0.12, -0.08, 0],
    leadShoulder: [0.38, 0, -0.2],
    rearShoulder: [0.3, 0, 0.2],
    leadElbow: [-0.9, 0, 0],
    rearElbow: [-0.8, 0, 0],
    leadKnee: [0.3, 0, 0],
    rearKnee: [0.28, 0, 0],
  }
}
function projectilePose(response: NenImpactResponse, lag: number, toward: number): FightPose {
  const head = response.zone === 'head'
  const low = response.zone === 'feet'
  const sharp = response.kind === 'pierce' ? 0.65 : 1
  return {
    head: [head ? -0.5 : 0.1, 0, 0.08],
    chest: [(head ? -0.2 : 0.3) * sharp * toward, 0.08, 0],
    body: [0.12 * lag, 0, low ? 0.13 : 0],
    leadShoulder: [0.32, 0, 0.18],
    rearShoulder: [0.2, 0, -0.15],
    leadKnee: [(low ? 0.6 : 0.2) * lag, 0, 0],
    rearKnee: [0.35 * lag, 0, 0],
  }
}

/** The engine already moves a pulled body. Only articulate its resistance at its current position. */
export function nenConstraintPlan(state: FightState, side: FightSide): BodyPlan | null {
  const fighter = state[side]
  if (!canResist(fighter)) return null
  const gum = state.bungeeGum
  const pulling = gum?.target === side && gum.retracting
  if (!pulling && !bound(fighter)) return null
  const opponent = state[side === 'player' ? 'opponent' : 'player']
  const toward = Math.sign(opponent.x - fighter.x) * fighter.facing
  const pose = pulling
    ? ({
        body: [0.22 * toward, 0, 0],
        chest: [-0.16 * toward, 0, 0],
        leadShoulder: [-0.3, 0, 0.2],
        rearShoulder: [0.32, 0, -0.15],
        leadKnee: [0.48, 0, 0],
        rearKnee: [0.22, 0, 0],
      } satisfies FightPose)
    : bindPose()
  return {
    pose,
    plant: true,
    key: pulling ? 'nen-pull-resistance' : 'nen-bound-resistance',
    blend: 0.04,
  }
}

function responseKind(
  constrained: boolean,
  shape: string | undefined,
  projectile: number | null,
): NenImpactResponse['kind'] {
  if (constrained) return 'bind'
  if (shape === 'needle') return 'pierce'
  return projectile !== null ? 'projectile' : 'strike'
}
function canResist(fighter: ArcadeFighter): boolean {
  return !fighter.attack && fighter.y <= 0 && fighter.health > 0 && fighter.hitStun <= 0
}

function continuedNenPose(
  standing: FightPose,
  incoming: { pose: FightPose; force: number; duration: number },
  context: { progress: number; carry?: FightPose },
): FightPose {
  const age = context.progress * incoming.duration
  const weight = Math.min(1, Math.max(0, age / 4))
  const carry = scalePose(context.carry ?? {}, 1 - weight)
  const entry = context.carry ? 0.25 + 0.75 * weight : 0.65 + 0.35 * weight
  return addPoses(standing, carry, scalePose(incoming.pose, incoming.force * entry))
}
