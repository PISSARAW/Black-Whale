import { Box3, Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { hinrighVictoryPose } from './hinrighPose'
import { createHinrighObjects } from './hinrighObjects'
import { createHinrighSnake } from './hinrighSnake'
import { createHinrighImpact } from './hinrighImpact'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function hinrighWide(context: VictoryContext, pose: ReturnType<typeof hinrighVictoryPose>) {
  const { hero, victim } = context
  const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
  bounds.expandByPoint(pose.origin.clone().add(new Vector3(-0.55, -0.5, 0)))
  victoryShot(context, {
    target:
      context.comfort.camera === 0
        ? new Vector3(context.centre, hero.height * 0.5, 0)
        : bounds.getCenter(new Vector3()),
    offset: new Vector3(0.2, 0.3, 6),
    width:
      context.comfort.camera === 0
        ? context.gap + victim.height + 3
        : bounds.getSize(new Vector3()).x + 0.8,
    height: Math.max(hero.height, victim.height) + 0.6,
  })
}
function hinrighCamera(context: VictoryContext, pose: ReturnType<typeof hinrighVictoryPose>) {
  const { age, hero } = context
  if (context.comfort.camera === 0 || (age >= 72 && age < 144) || (age >= 372 && age < 468)) {
    hinrighWide(context, pose)
  } else if (age < 72) {
    victoryShot(context, {
      target: pose.origin,
      offset: new Vector3(0.05, 0.8, 2),
      width: 1.5,
      height: 1.25,
    })
  } else if (age < 264) {
    const target = pose.wrists[0].clone().lerp(pose.wrists[1], 0.5)
    if (age >= 198) target.copy(pose.ankles[0]).lerp(pose.ankles[1], 0.5)
    victoryShot(context, { target, offset: new Vector3(0.3, 0.25, 2.7), width: 1.45, height: 1.35 })
  } else if (age < 372) {
    victoryShot(context, {
      target: pose.target.clone().add(new Vector3(0.15, 0.12, 0.15)),
      offset: new Vector3(-2, 0.22, 2.3),
      width: 1.65,
      height: 1.7,
    })
  } else {
    const q = hero.head.getWorldQuaternion(new Quaternion())
    const target = hero.head.getWorldPosition(new Vector3()).lerp(pose.cat, 0.3)
    victoryShot(context, {
      target,
      offset: new Vector3(0, 0.08, 3).applyQuaternion(q),
      width: 1.55,
      height: 1.65,
    })
  }
}
export function createHinrighVictory(): VictoryDriver {
  const objects = createHinrighObjects(),
    snake = createHinrighSnake(),
    impact = createHinrighImpact()
  return {
    update(context) {
      const pose = hinrighVictoryPose(context)
      const props = objects.sync(context, pose)
      const shot = snake.sync(context, pose)
      impact.sync(context, pose)
      hinrighCamera(context, pose)
      context.scene.userData.hinrighVictory = {
        ...props,
        grips: pose.grips,
        touchError: pose.hand.distanceTo(pose.touch),
        petError: props.petError,
        muzzle: shot.muzzle.toArray(),
        target: shot.target.toArray(),
        shotError: shot.direction
          .clone()
          .cross(shot.target.clone().sub(shot.muzzle).normalize())
          .length(),
        snakeSpan: shot.span,
        fired: shot.fired,
        floor: pose.fall?.floor,
        nativeBodyIntact: !new Box3().setFromObject(context.victim.root).isEmpty(),
      }
      context.defer(() => {
        delete context.scene.userData.hinrighVictory
      })
    },
    dispose() {
      objects.dispose()
      snake.dispose()
      impact.dispose()
    },
  }
}
