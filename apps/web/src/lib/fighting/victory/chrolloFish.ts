import * as THREE from 'three'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { createFishBrand } from './chrolloFishMarks'
import { disposeVictoryObject, ease } from './resources'
import type { VictoryContext } from './types'

export const FISH_BITES = [204, 246, 288, 330] as const
export const FISH_COLLISION = 390
export function fishBitePoints(context: VictoryContext) {
  const { victim } = context,
    p = victim.root.position
  return [
    new THREE.Vector3(p.x - victim.width * 0.22, p.y + victim.height * 0.63, 0.06),
    new THREE.Vector3(p.x + victim.width * 0.2, p.y + victim.height * 0.43, 0.03),
    new THREE.Vector3(p.x + victim.width * 0.25, p.y + victim.height * 0.8, 0.02),
    new THREE.Vector3(p.x - victim.width * 0.1, p.y + victim.height * 0.26, 0),
  ]
}
function makeFish(index: number) {
  const model = createVisitHatsuModel(THREE, {
    model: 'indoor-fish',
    joints: ['lower-jaw', 'caudal-fin'],
  })
  const brand = createFishBrand(index === 0)
  model.body.add(brand.root)
  model.fit({ width: 2.05 })
  model.root.name = index === 0 ? 'indoor-fish-sun' : 'indoor-fish-moon'
  return { model, brand, scale: model.root.scale.x }
}
function feedingMouth(context: VictoryContext, index: number) {
  const { victim, age } = context
  const side = index === 0 ? -1 : 1
  const centre = victim.root.position.clone().add(new THREE.Vector3(0, victim.height * 0.56, 0.04))
  const roam = centre
    .clone()
    .add(
      new THREE.Vector3(
        side * 0.65,
        Math.sin(age * 0.045 + index * Math.PI) * victim.height * 0.3,
        Math.sin(age * 0.035) * 0.12,
      ),
    )
  const bites = fishBitePoints(context)
  FISH_BITES.forEach((frame, i) => {
    if (i % 2 !== index) return
    const bite = Math.max(0, 1 - Math.abs(age - frame) / 21)
    roam.lerp(bites[i], ease(bite))
  })
  return roam
}
export function createChrolloFish() {
  const root = new THREE.Group(),
    fishes = [makeFish(0), makeFish(1)]
  root.name = 'chrollo-indoor-fish-fatality'
  fishes.forEach(({ model }) => root.add(model.root))
  return {
    root,
    sync(context: VictoryContext, book: THREE.Vector3) {
      const { age, victim } = context
      const centre = victim.root.position
        .clone()
        .add(new THREE.Vector3(0, victim.height * 0.56, 0.1))
      fishes.forEach(({ model, brand, scale }, index) => {
        const side = index === 0 ? -1 : 1
        const summon = ease((age - 66 - index * 12) / 66)
        model.root.visible = age >= 66 + index * 12 && age < FISH_COLLISION
        model.root.scale.setScalar(scale * Math.max(0.001, summon))
        model.root.rotation.set(0, index === 0 ? Math.PI : 0, Math.sin(age * 0.055 + index) * 0.065)
        let mouth = feedingMouth(context, index)
        if (age >= 342) {
          const cross = ease((age - 342) / (FISH_COLLISION - 342))
          model.root.rotation.z *= 1 - cross
          mouth = centre
            .clone()
            .add(
              new THREE.Vector3(
                side * (1.2 - (1.2 + 0.28 * scale) * cross),
                side * 0.48 * (1 - cross),
                side * 0.1 * (1 - cross),
              ),
            )
        }
        const offset = new THREE.Vector3(-1.46, -0.24, 0)
          .add(model.body.position)
          .multiplyScalar(model.root.scale.x)
          .applyQuaternion(model.root.quaternion)
        model.root.position.copy(book).lerp(mouth.sub(offset), summon)
        const jaw = model.joints.get('lower-jaw')!
        jaw.rotation.z = Math.sin(age * 0.19 + index * Math.PI) * 0.13
        model.joints.get('caudal-fin')!.rotation.y = Math.sin(age * 0.13 + index) * 0.28
        brand.material.uniforms.power.value = age >= 342 ? 1.5 + Math.sin(age * 0.3) * 0.5 : 0.7
        model.root.updateWorldMatrix(true, true)
      })
      const brands = fishes.map(({ brand }, index) =>
        brand.root.children[index === 0 ? 0 : 1].getWorldPosition(new THREE.Vector3()),
      )
      return {
        centre: brands[0].clone().lerp(brands[1], 0.5),
        brands,
        bites: fishBitePoints(context),
        fishes: fishes.map(({ model }) => model.root),
      }
    },
    dispose() {
      root.removeFromParent()
      fishes.forEach(({ model, brand }) => {
        brand.root.removeFromParent()
        disposeVictoryObject(brand.root)
        model.dispose()
      })
    },
  }
}
