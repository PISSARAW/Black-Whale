import { BIOHAZARD_TRANSFORM, type BiohazardObject } from './biohazard'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Physical rings morph into a pigeon, then become ordinary latched handcuffs on capture. */
export function createBiohazardScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const metal = new THREE.MeshStandardMaterial({
    color: '#c5d1d6',
    metalness: 0.55,
    roughness: 0.3,
    emissive: '#74828b',
    emissiveIntensity: 0.35,
  })
  const feathers = new THREE.MeshStandardMaterial({
    color: '#b7b5a9',
    roughness: 0.85,
    emissive: '#b7b5a9',
    emissiveIntensity: 0.3,
  })
  const neck = new THREE.MeshStandardMaterial({ color: '#45665a', roughness: 0.55 })
  const eye = new THREE.MeshBasicMaterial({ color: '#17211d' })
  const beak = new THREE.MeshStandardMaterial({ color: '#cfa968' })
  const aura = new THREE.MeshBasicMaterial({
    color: '#80d6a0',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })
  const ringShape = new THREE.TorusGeometry(0.095, 0.017, 8, 20)
  const chainShape = new THREE.TorusGeometry(0.026, 0.009, 6, 10)
  const bodyShape = new THREE.SphereGeometry(1, 12, 8)
  const beakShape = new THREE.ConeGeometry(0.035, 0.1, 6)
  const wingShape = new THREE.SphereGeometry(1, 12, 8)
  type Model = {
    root: import('three').Group
    bird: import('three').Group
    cuffs: import('three').Group
    wings: import('three').Mesh[]
    glow: import('three').Mesh
  }
  const models = new Map<string, Model>()

  function makeModel(): Model {
    const root = new THREE.Group()
    root.name = 'biohazard-object'
    const bird = new THREE.Group()
    bird.name = 'biohazard-pigeon'
    const body = new THREE.Mesh(bodyShape, feathers)
    body.scale.set(0.18, 0.13, 0.13)
    bird.add(body)
    const tail = new THREE.Mesh(bodyShape, feathers)
    tail.scale.set(0.14, 0.035, 0.1)
    tail.position.set(-0.23, -0.015, 0)
    tail.rotation.z = -0.2
    bird.add(tail)
    const head = new THREE.Mesh(bodyShape, neck)
    head.scale.setScalar(0.085)
    head.position.set(0.12, 0.15, 0)
    bird.add(head)
    const eyes = new THREE.Mesh(bodyShape, eye)
    eyes.scale.setScalar(0.015)
    eyes.position.set(0.15, 0.17, 0.073)
    bird.add(eyes)
    const bill = new THREE.Mesh(beakShape, beak)
    bill.rotation.z = -Math.PI / 2
    bill.position.set(0.23, 0.14, 0)
    bird.add(bill)
    const wings = [-1, 1].map((sign) => {
      const wing = new THREE.Mesh(wingShape, feathers)
      wing.scale.set(0.22, 0.025, 0.17)
      wing.position.set(-0.07, 0.05, sign * 0.11)
      bird.add(wing)
      return wing
    })
    const cuffs = new THREE.Group()
    cuffs.name = 'biohazard-handcuffs'
    for (const sign of [-1, 1]) {
      const ring = new THREE.Mesh(ringShape, metal)
      ring.position.x = sign * 0.15
      cuffs.add(ring)
    }
    for (let index = 0; index < 4; index++) {
      const link = new THREE.Mesh(chainShape, metal)
      link.position.x = -0.055 + index * 0.037
      link.rotation.y = ((index % 2) * Math.PI) / 2
      cuffs.add(link)
    }
    const glow = new THREE.Mesh(bodyShape, aura)
    glow.scale.set(0.35, 0.24, 0.2)
    root.add(bird, cuffs, glow)
    scene.add(root)
    return { root, bird, cuffs, wings, glow }
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
      models.forEach((model) => scene.remove(model.root))
      models.clear()
      for (const shape of [ringShape, chainShape, bodyShape, beakShape, wingShape]) shape.dispose()
      for (const material of [metal, feathers, neck, eye, beak, aura]) material.dispose()
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
