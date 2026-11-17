import { Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { beyondCursePose, BEYOND_CURSE_TIMING as T } from './beyondCursePose'
import { createBeyondCurseFace } from './beyondCurseFace'
import { createBeyondCurseEffects } from './beyondCurseEffects'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { createTserriednichLikeness } from './tserriednichLikeness'

function wide(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre + context.gap * 0.3, height * 0.52, 0),
    offset: new Vector3(0.2, 0.4, 6),
    width: Math.max(3.6, context.gap * 0.5 + context.victim.height + context.hero.width + 0.45),
    height: height + 1.1,
  })
}

function curseCamera(context: VictoryContext, source: Vector3) {
  const { age } = context
  if (context.comfort.camera === 0) return wide(context)
  if (age >= 144 && age < T.release) {
    const q = context.victim.head.getWorldQuaternion(new Quaternion())
    victoryShot(context, {
      target: source,
      offset: new Vector3(0, -0.02, 0.8).applyQuaternion(q),
      width: 0.33,
      height: 0.36,
    })
    return
  }
  if (age >= 336 && age < T.princeDeath) {
    victoryShot(context, {
      target: context.hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.13, 0)),
      offset: new Vector3(0.05, 0.02, 0.8),
      width: 0.76,
      height: 0.85,
    })
    return
  }
  if (age >= T.princeDeath || age < 144) return wide(context)
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  victoryShot(context, {
    target: new Vector3(bounds.getCenter(new Vector3()).x, context.hero.height * 0.55, 0),
    offset: new Vector3(0.2, 0.25, 5),
    width: bounds.getSize(new Vector3()).x + 0.9,
    height: Math.max(context.hero.height, context.victim.height) + 1.05,
  })
}

export function createBeyondCurseVictory(): VictoryDriver {
  const face = createBeyondCurseFace(),
    effects = createBeyondCurseEffects(),
    likeness = createTserriednichLikeness()
  return {
    update(context) {
      const pose = beyondCursePose(context)
      if (context.frame.fighter === 'tserriednich') likeness.apply({ ...context, age: 599 })
      const seal = face.sync(context)
      const curse = effects.sync(context, seal.source)
      context.add(effects.root)
      curseCamera(context, seal.source)
      context.scene.userData.beyondCurseVictory = {
        carrier: context.state[context.frame.loser].id,
        prince: context.frame.fighter,
        fictionalTargetAssignment: true,
        carrierDead: context.age >= T.carrierDeath,
        princeDead: context.age >= T.princeDeath,
        awake: seal.awake,
        ...curse,
        ...pose,
      }
      context.defer(() => {
        delete context.scene.userData.beyondCurseVictory
      })
    },
    dispose() {
      face.dispose()
      effects.dispose()
      likeness.dispose()
    },
  }
}
