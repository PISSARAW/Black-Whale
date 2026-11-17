import { Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createChrolloSpectacleBlast } from './blast'
import { disposeVictoryObject, ease } from './resources'
import { localToHead } from './pose'
import { holdVictoryBook } from './chrolloBook'
import { createChrolloFish, FISH_COLLISION } from './chrolloFish'
import { createFishDevouring } from './chrolloDevour'
import { victoryActorShot, victoryPortrait, victoryShot } from './camera'

function fishCamera(context: VictoryContext, fishes: Object3D[]) {
  const { age, victim } = context
  if (age < 66 || age >= 480) {
    victoryPortrait(context)
    return
  }
  if (age >= 132 && age < 188) {
    const index = age < 160 ? 0 : 1
    const brand = fishes[index].getObjectByName(
      index === 0 ? 'indoor-fish-sun-brand' : 'indoor-fish-moon-brand',
    )!
    const target = brand.children[1].getWorldPosition(new Vector3())
    victoryShot(context, { target, offset: new Vector3(0.05, 0.12, 2), width: 0.9, height: 0.7 })
    return
  }
  if (age >= 188 && age < 342) {
    victoryActorShot(context, victim)
    context.camera.position.z += 1.4
    context.camera.updateMatrixWorld(true)
    return
  }
  const target = victim.root.position.clone().add(new Vector3(-0.5, victim.height * 0.55, 0))
  victoryShot(context, {
    target,
    offset: new Vector3(0.2, 0.35, 6),
    width: context.gap + 3.8,
    height: Math.max(context.hero.height, victim.height) + 0.65,
  })
}
export function createChrolloVictory(): VictoryDriver {
  const fish = createChrolloFish(),
    devour = createFishDevouring(),
    blast = createChrolloSpectacleBlast()
  return {
    update(context) {
      const { age, hero, victim } = context
      hero.root.rotation.y *= 1 - ease((age - 420) / 60)
      victim.root.position.y += ease((age - 188) / 30) * 0.08
      victim.root.updateWorldMatrix(true, true)
      const book = holdVictoryBook(context)
      const page =
        book?.getWorldPosition(new Vector3()) ?? localToHead(hero, new Vector3(0.1, -0.4, 0.3))
      const tableau = fish.sync(context, page)
      devour.sync(context, tableau.bites)
      victim.head.rotation.x = ease((age - 204) / 32) * 0.12
      // Remain suspended and alive in the feeding tableau until the two brands meet.
      blast.sync(tableau.centre, age - (FISH_COLLISION - 180))
      blast.group.scale.setScalar(1.1)
      context.add(fish.root)
      context.add(blast.group)
      fishCamera(context, tableau.fishes)
      context.scene.userData.chrolloFishVictory = {
        fishCount: 2,
        brands: ['sun', 'moon'],
        bites: tableau.bites.map((p) => p.toArray()),
        collisionFrame: FISH_COLLISION,
        bookClosed: age >= FISH_COLLISION,
        brandsWorld: tableau.brands.map((p) => p.toArray()),
      }
      context.defer(() => {
        delete context.scene.userData.chrolloFishVictory
      })
    },
    dispose() {
      fish.dispose()
      devour.dispose()
      disposeVictoryObject(blast.group)
    },
  }
}
