import { Vector3 } from 'three'
import { humanAnimationRig } from '../../tour/humanAnimation'
import { advanceAirborne, STILL_MOTION } from '../fighterMovement'
import { FIXED_STEP } from '../fightClock'
import { finishedFallProgress } from '../finishedFallPresentation'
import { reactionPlan } from '../fightReactions'
import { applyFightPose, borrowFightRig, resetFightRig } from '../fightRig'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import type { ArcadeFighter } from '../types'
import type { VictoryContext } from './types'
import { nativePoseEntry } from './poseContinuity'

const WORLD_UNIT = 0.12

/** Sample the actual two-gravity integrator, with no render-cadence or easing dependency. */
export function victoryFallTrajectory(
  source: ArcadeFighter,
  launch: { velocityY: number; velocityX: number; height?: number },
) {
  let fighter: ArcadeFighter = {
    ...source,
    x: 50,
    y: (launch.height ?? 0) / WORLD_UNIT,
    velocityY: launch.velocityY,
    hitStun: 0,
    hanzoProjection: undefined,
    motion: { ...STILL_MOTION, velocityX: launch.velocityX },
    pose: 'ko',
    facing: -1,
  }
  const samples = [fighter]
  for (let i = 0; (fighter.y > 0 || fighter.velocityY > 0) && i < 600; i++) {
    fighter = { ...fighter, ...advanceAirborne(fighter) }
    samples.push(fighter)
  }
  return samples
}

/** Exactly the combat KO choreography and physical surface contacts, applied transactionally. */
export function nativeVictoryFall(
  context: VictoryContext,
  options: { start: number; velocityY?: number; velocityX?: number; height?: number },
) {
  const { victim, age } = context
  const enter = nativePoseEntry(victim.root, {
    token: context.frame.token,
    phase: `fall:${options.start}`,
    age: context.frame.elapsed * 60,
    start: options.start,
  })
  const human = humanAnimationRig(victim.root.children[0])
  if (!human) throw new Error('Victory requires the native victim anatomy')
  const samples = victoryFallTrajectory(context.state[context.frame.loser], {
    velocityY: options.velocityY ?? 0,
    velocityX: options.velocityX ?? 0,
    height: options.height,
  })
  const last = samples.length - 1
  const elapsed = Math.max(0, (age - options.start) * FIXED_STEP)
  const frame = elapsed / FIXED_STEP
  const index = Math.min(last, Math.floor(frame))
  const from = samples[index],
    to = samples[Math.min(last, index + 1)]
  const fraction = Math.min(1, frame - index)
  const y = from.y + (to.y - from.y) * fraction
  const x = from.x + (to.x - from.x) * fraction
  const progress = frame === 0 ? 0 : finishedFallProgress({ elapsed, last, y })
  const fighter = { ...from, y, pose: 'ko' as const, facing: -1 as const }
  context.save(human.figure)
  const { rig, restore } = borrowFightRig(human)
  context.defer(restore)
  context.save(rig.chest)
  ;[...rig.wrists, ...rig.ankles].forEach(context.save)
  resetFightRig(rig)
  const plan = reactionPlan(fighter, { progress }, {})!
  victim.root.position.x += (x - samples[0].x) * WORLD_UNIT
  victim.root.position.y += y * WORLD_UNIT
  applyFightPose(rig, plan.pose, fighter.facing)
  enter()
  fightGroundContact(fighter)(human)
  victim.root.traverse((node) => {
    if (node.name !== 'contact-shadow') return
    context.save(node)
    node.visible = false
  })
  const up = new Vector3(0, 1, 0).transformDirection(human.figure.matrixWorld)
  return {
    flight: Math.min(1, frame / Math.max(1, last)),
    landing: y === 0 && frame >= last,
    airborneY: y,
    progress,
    floor: lowestBodyHeight(human),
    upY: up.y,
    roll: human.figure.rotation.z,
    landingFrame: options.start + last,
    landingPoint: new Vector3(victim.root.position.x, 0.026, victim.root.position.z),
  }
}
