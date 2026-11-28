import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { VictoryJupiter } from './bonolenovJupiter'
import type { BonolenovVictoryPose } from './bonolenovPose'
import { victoryShot } from './camera'
import { ease } from './resources'
import timing from './bonolenovTiming.json'

type Shot = 'dance' | 'pursuit' | 'last-step' | 'impact' | 'floor' | 'dissolve' | 'bow' | 'comfort'

function pursuitShot(context: VictoryContext, planet: VictoryJupiter, impactX: number) {
  const { age, centre, gap } = context
  const motion = context.comfort.camera ?? 1
  const left = centre - gap / 2 - planet.radius
  const right = impactX + 0.9
  const drift = motion * ease((age - timing.chase) / 126) * 0.49
  victoryShot(context, {
    target: new Vector3((left + right) / 2 + drift, planet.radius * 0.96, 0),
    offset: new Vector3(2.25, 1.17, 5),
    width: right - left + 0.6,
    height: planet.radius * 2 + 0.48,
  })
}

function lastStepShot(context: VictoryContext) {
  const { victim } = context
  const foot = victim.root.getObjectByName('knee-right')?.children[1]
  const step = foot?.getWorldPosition(new Vector3()) ?? victim.root.position
  victoryShot(context, {
    target: new Vector3(step.x - 0.21, 0.38, step.z),
    offset: new Vector3(1.25, 0.52, 1.58),
    width: 1.72,
    height: 0.94,
  })
}

function rivalShot(context: VictoryContext, pose: BonolenovVictoryPose) {
  const { age, victim, comfort, camera } = context
  const head = victim.head.getWorldPosition(new Vector3())
  const target = pose.contact.clone().lerp(head, 0.32)
  target.x -= 0.25
  const push = ease((age - timing.lastStep) / (timing.floorShot - timing.lastStep))
  victoryShot(context, {
    target,
    offset: new Vector3(1.68, 0.43, 1.32).multiplyScalar(1 - push * 0.09),
    width: Math.max(1.72, victim.width + 1.08),
    height: victim.height * 0.88,
  })
  const hit = Math.max(0, Math.min(1, (age - timing.impact) / 10))
  const kick = Math.sin(hit * Math.PI * 2) * (1 - hit) * comfort.shake
  camera.position.y += kick * 0.065
  camera.position.z += kick * 0.035
  camera.updateMatrixWorld(true)
}

function floorShot(context: VictoryContext, impactX: number) {
  victoryShot(context, {
    target: new Vector3(impactX - 0.32, 0.43, 0),
    offset: new Vector3(1.65, 1.25, 2.15),
    width: 3.15,
    height: 1.84,
  })
}

function heroShot(context: VictoryContext, impactX: number) {
  const { hero, age } = context
  const ending = age >= timing.clear
  const settle = ease((age - timing.bow) / 48)
  const x = ending ? (hero.root.position.x + impactX) / 2 : context.centre - context.gap / 2 + 0.36
  victoryShot(context, {
    target: new Vector3(
      x - (ending ? settle * 0.08 : 0),
      ending ? hero.height * 0.48 : hero.height * 0.73,
      0,
    ),
    offset: new Vector3(
      ending ? 0.58 : 0.12,
      ending ? 0.97 : 0.38,
      ending ? 3.85 - settle * 0.46 : 3.9,
    ),
    width: ending ? 3.9 - settle * 0.25 : 2.3,
    height: hero.height * (ending ? 1.48 : 1.68),
  })
}

export function bonolenovCamera(
  context: VictoryContext,
  options: { planet: VictoryJupiter; pose: BonolenovVictoryPose; impactX: number },
): Shot {
  const { age, comfort } = context
  const { planet, pose, impactX } = options
  if (comfort.camera === 0) {
    pursuitShot(context, planet, impactX)
    return 'comfort'
  }
  if (age < timing.wide || age >= timing.clear) {
    heroShot(context, impactX)
    return age < timing.wide ? 'dance' : 'bow'
  }
  if (age < timing.rivalShot || age >= timing.dissolve) {
    pursuitShot(context, planet, impactX)
    return age < timing.rivalShot ? 'pursuit' : 'dissolve'
  }
  if (age < timing.impactShot) {
    lastStepShot(context)
    return 'last-step'
  }
  if (age < timing.floorShot) {
    rivalShot(context, pose)
    return 'impact'
  }
  floorShot(context, impactX)
  return 'floor'
}
