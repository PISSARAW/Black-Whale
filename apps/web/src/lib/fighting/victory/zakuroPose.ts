import { Box3, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead } from './pose'
import { guardHand } from './personalGuardStaging'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'
import { nativeVictoryFall, victoryFallTrajectory } from './nativeFall'

export const ZAKURO_TIMING = {
  scouts: 54,
  recall: 144,
  bind: 186,
  lift: 264,
  firstImpact: 324,
  release: 372,
  finalImpact: 396,
  return: 420,
  portrait: 486,
}

function hoist(age: number) {
  if (age < 324) return 2.2 * ease((age - 264) / 42) * (1 - ease((age - 312) / 12))
  return 2.2 * ease((age - 336) / 36)
}
function stageVictim(context: VictoryContext) {
  const { victim, age } = context
  const bound = ease((age - 186) / 42)
  const turn = ease((age - 264) / 42) * (1 - ease((age - 336) / 36))
  victim.root.rotation.z = -Math.PI * turn
  victim.head.rotation.x = -0.08 * bound
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const scale = victim.height / 2
    const hand = localToHead(
      victim,
      new Vector3(sign * (0.2 - bound * 0.1), -0.43 - bound * 0.18, 0.2).multiplyScalar(scale),
    )
    guardHand(victim, side, hand)
  }
  if (age >= 240)
    victim.root.traverse((node) => {
      if (node.name !== 'contact-shadow') return
      context.save(node)
      node.visible = false
    })
  victim.root.updateWorldMatrix(true, true)
  if (age < ZAKURO_TIMING.release) {
    const floor = visibleVictoryBounds(victim.root).min.y
    victim.root.position.y += hoist(age) + 0.025 - floor
    victim.root.updateWorldMatrix(true, true)
  }
}
export function zakuroPose(context: VictoryContext) {
  const { hero, victim, age } = context
  hero.root.rotation.y = 1.05 * (1 - ease((age - 450) / 36))
  hero.head.rotation.z = -0.05 * (1 - ease((age - 240) / 24))
  hero.root.updateWorldMatrix(true, true)
  const command = ease((age - 228) / 48) * (1 - ease((age - 396) / 30))
  const palm = localToHead(hero, new Vector3(-0.19, -0.57 + command * 0.38, 0.29))
  const leftError = guardHand(hero, 'left', palm)
  const right = localToHead(hero, new Vector3(0.17, -0.6, 0.18))
  right.lerp(localToHead(hero, new Vector3(0.23, -0.1, 0.3)), ease((age - 450) / 36))
  const rightError = guardHand(hero, 'right', right)
  stageVictim(context)
  const launch = { velocityY: -10, velocityX: 0, height: 2.2 }
  const trajectory = victoryFallTrajectory(context.state[context.frame.loser], launch)
  const rate = (trajectory.length - 1) / (ZAKURO_TIMING.finalImpact - ZAKURO_TIMING.release)
  const fall =
    age >= ZAKURO_TIMING.release
      ? nativeVictoryFall(
          { ...context, age: ZAKURO_TIMING.release + (age - ZAKURO_TIMING.release) * rate },
          { start: ZAKURO_TIMING.release, ...launch },
        )
      : undefined
  victim.root.updateWorldMatrix(true, true)
  const wrists = ['left', 'right'].map((side) =>
    victim.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3()),
  )
  const ankles = ['left', 'right'].map((side) =>
    new Box3()
      .setFromObject(victim.root.getObjectByName(`knee-${side}`)!.children[1])
      .getCenter(new Vector3()),
  )
  const chest = victim.root.getObjectByName('torso')!.getWorldPosition(new Vector3())
  const wound = hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const finger = hero.root
    .getObjectByName('hand-right')!
    .getWorldPosition(new Vector3())
    .add(new Vector3(0, 0.08, 0.04))
  return {
    wound,
    finger,
    wrists,
    ankles,
    chest,
    fall,
    bound: ease((age - 186) / 42),
    floor: visibleVictoryBounds(victim.root).min.y,
    landingFrame: 396,
    handErrors: [leftError, rightError],
  }
}
export type ZakuroPose = ReturnType<typeof zakuroPose>
