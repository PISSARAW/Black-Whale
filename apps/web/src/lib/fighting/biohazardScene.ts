import { createVisitHatsuModel, type VisitHatsuModel } from './visitHatsuModel'
import { BIOHAZARD_TRANSFORM, type BiohazardObject } from './biohazard'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Physical rings morph into a pigeon, then become ordinary latched handcuffs on capture. */
export function createBiohazardScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const aura = new THREE.MeshBasicMaterial({
    color: '#80d6a0',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })
  const bodyShape = new THREE.SphereGeometry(1, 12, 8)
  type Model = {
    root: import('three').Group
    bird: import('three').Group
    cuffs: import('three').Group
    wings: import('three').Group[]
    visit: VisitHatsuModel
    reverted: VisitHatsuModel
    glow: import('three').Mesh
  }
  const models = new Map<string, Model>()

  function makeModel(): Model {
    const root = new THREE.Group()
    root.name = 'biohazard-object'
    const bird = new THREE.Group()
    bird.name = 'biohazard-pigeon'
    const visit = createVisitHatsuModel(THREE, {
      model: 'biohazard', stage: 1, joints: ['pigeon-wing--1', 'pigeon-wing-1'],
    })
    visit.fit({ width: 0.65, height: 0.48 })
    visit.root.rotation.y = Math.PI / 3
    bird.add(visit.root)
    const wings = [...visit.joints.values()]
    const reverted = createVisitHatsuModel(THREE, { model: 'biohazard-cuffs' })
    reverted.fit({ width: 0.45 })
    const cuffs = new THREE.Group()
    cuffs.name = 'biohazard-handcuffs'
    reverted.root.rotation.x = Math.PI / 2
    cuffs.add(reverted.root)
    const glow = new THREE.Mesh(bodyShape, aura)
    glow.scale.set(0.35, 0.24, 0.2)
    root.add(bird, cuffs, glow)
    scene.add(root)
    return { root, bird, cuffs, wings, glow, visit, reverted }
  }

  function syncObject(state: FightState, side: FightSide, object: BiohazardObject): void {
    const key = `${side}:${object.id}`
    let model = models.get(key)
    if (!model) {
      model = makeModel()
      models.set(key, model)
    }
    model.root.visible = !['carried', 'broken'].includes(object.phase)
    if (!model.root.visible) return
    const bound = object.phase === 'bound'
    const morph = object.phase === 'transforming' ? object.frames / BIOHAZARD_TRANSFORM : 1
    model.root.position.set(worldX(object.x), objectDrawHeight(object, worldY), 0.45)
    model.bird.visible = !bound && object.phase !== 'dropped'
    model.bird.scale.set(Math.max(0.001, morph) * object.direction, morph, morph)
    model.cuffs.visible = bound || object.phase === 'transforming' || object.phase === 'dropped'
    model.cuffs.scale.setScalar(objectCuffScale(object, morph))
    model.cuffs.rotation.x = object.phase === 'dropped' ? -Math.PI / 2 : 0
    model.glow.visible = model.bird.visible
    model.wings.forEach((wing, index) => {
      const sign = index === 0 ? -1 : 1
      wing.rotation.x = sign * Math.sin(state.frame * 0.5 + object.id) * 0.9
      wing.rotation.z = sign * (0.35 + Math.sin(state.frame * 0.5) * 0.65)
    })
  }

  return {
    sync: (state) => {
      models.forEach((model) => {
        model.root.visible = false
      })
      for (const side of ['player', 'opponent'] as const)
        state[side].biohazard?.objects.forEach((object) => syncObject(state, side, object))
    },
    dispose: () => {
      models.forEach((model) => { model.visit.dispose(); model.reverted.dispose(); scene.remove(model.root) })
      models.clear()
      for (const shape of [bodyShape]) shape.dispose()
      for (const material of [aura]) material.dispose()
    },
  }
}

function objectCuffScale(object: BiohazardObject, morph: number): number {
  if (object.phase === 'bound') return 1.2
  return object.phase === 'dropped' ? 1 : Math.max(0.15, 1 - morph * 0.75)
}

function objectDrawHeight(object: BiohazardObject, worldY: (y: number) => number): number {
  if (object.phase === 'dropped') return worldY(object.y) + 0.04
  return worldY(object.y) + (object.phase === 'bound' ? 0.8 : 0.55)
}
