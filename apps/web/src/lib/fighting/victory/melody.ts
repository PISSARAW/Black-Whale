import * as THREE from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { melodyVictoryPose } from './melodyPose'
import { createMelodyMeadow } from './melodyMeadow'
import { victoryPortrait, victoryShot } from './camera'
import { disposeVictoryObject } from './resources'

function melodyCamera(context: VictoryContext) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) {
    victoryShot(context, {
      target: new THREE.Vector3(context.centre, Math.max(hero.height, victim.height) * 0.5, 0),
      offset: new THREE.Vector3(0.2, 0.2, 6),
      width: context.gap + 3.5,
      height: Math.max(hero.height, victim.height) + 1.2,
    })
  } else if (age < 108 || age >= 468) victoryPortrait(context)
  else if (age >= 144 && age < 210) victoryPortrait(context, victim)
  else if (age >= 324 && age < 408) {
    const target = victim.head
      .getWorldPosition(new THREE.Vector3())
      .lerp(victim.root.getObjectByName('hand-left')!.getWorldPosition(new THREE.Vector3()), 0.5)
    victoryShot(context, {
      target,
      offset: new THREE.Vector3(0, 0.02, 2.5).applyQuaternion(
        victim.head.getWorldQuaternion(new THREE.Quaternion()),
      ),
      width: 1.2,
      height: 1.3,
    })
  } else
    victoryShot(context, {
      target: new THREE.Vector3(context.centre, Math.max(hero.height, victim.height) * 0.45, 0),
      offset: new THREE.Vector3(0.25, 0.25, 6),
      width: context.gap + 3.2,
      height: Math.max(hero.height, victim.height) + 1,
    })
}
export function createMelodyVictory(): VictoryDriver {
  const meadow = createMelodyMeadow(),
    root = new THREE.Group()
  root.name = 'melody-enchanting-music'
  const rings = Array.from(
    { length: 4 },
    () =>
      new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.008, 5, 64),
        new THREE.MeshBasicMaterial({ color: 0xe7c990, transparent: true, opacity: 0.4 }),
      ),
  )
  root.add(...rings)
  return {
    update(context) {
      const pose = melodyVictoryPose(context)
      const growth = meadow.sync(context, pose)
      melodyCamera(context)
      root.visible = context.age >= 48 && context.age < 240
      rings.forEach((ring, i) => {
        const t = ((context.age - 48 + i * 18) % 72) / 72
        ring.position.copy(pose.lips).lerp(pose.heart, t)
        ring.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          pose.heart.clone().sub(pose.lips).normalize(),
        )
        ring.scale.setScalar(0.12 + t * 0.8)
        ring.material.opacity = (1 - t) * 0.45
      })
      context.add(root)
      context.add(meadow.root)
      context.scene.userData.melodyVictory = {
        grips: pose.grips,
        fluteContact: pose.fluteContact,
        peace: pose.peace,
        growth,
        flowers: 1280,
        playing: true,
        nonlethal: true,
      }
      context.defer(() => {
        delete context.scene.userData.melodyVictory
      })
    },
    dispose() {
      meadow.dispose()
      disposeVictoryObject(root)
    },
  }
}
