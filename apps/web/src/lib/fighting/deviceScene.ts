import { createVisitHatsuModel } from './visitHatsuModel'
import { devicePosition, holdsDevice, deviceCarrierBody } from './physicalDevices'
import type { PreparedEntity } from './preparationTypes'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Physical devices remain visible independently of the Nen that changes their form. */
export function createDeviceScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const models = new Map<string, ReturnType<typeof make>>()
  const geometries: import('three').BufferGeometry[] = []
  const materials = new Map<number, import('three').MeshBasicMaterial>()
  function material(colour: number) {
    if (!materials.has(colour))
      materials.set(colour, new THREE.MeshBasicMaterial({ color: colour }))
    return materials.get(colour)!
  }
  function box(
    root: import('three').Group,
    size: [number, number, number],
    placement: { at: [number, number, number]; colour: number },
  ) {
    const { at, colour } = placement
    const geometry = new THREE.BoxGeometry(...size)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material(colour))
    mesh.position.set(...at)
    root.add(mesh)
    return mesh
  }
  function ellipsoid(
    root: import('three').Group,
    size: [number, number, number],
    placement: { at: [number, number, number]; colour: number },
  ) {
    const { at, colour } = placement
    const geometry = new THREE.SphereGeometry(1, 16, 10)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material(colour))
    mesh.scale.set(...size)
    mesh.position.set(...at)
    root.add(mesh)
    return mesh
  }
  function make(entry: PreparedEntity) {
    const root = new THREE.Group(),
      original = new THREE.Group(),
      creature = new THREE.Group()
    root.name = `device:${entry.id}`
    original.name = 'device:original'
    creature.name = 'device:creature'
    root.add(original, creature)
    scene.add(root)
    const kind = entry.device!.kind
    let cat: ReturnType<typeof createVisitHatsuModel> | undefined
    if (kind === 'camera') {
      box(original, [0.34, 0.24, 0.18], { at: [0, 0.12, 0], colour: 0x29313a })
      const lens = ellipsoid(original, [0.08, 0.08, 0.09], {
        at: [0.02, 0.13, 0.13],
        colour: 0x607d88,
      })
      lens.name = 'camera-lens'
      box(original, [0.2, 0.035, 0.05], { at: [0, 0.27, 0], colour: 0x151c22 })
      cat = createVisitHatsuModel(THREE, { model: 'biohazard', stage: 0, anchor: 'floor' })
      cat.fit({ height: 0.62 })
      creature.add(cat.root)
    } else if (kind === 'firearm') {
      box(original, [0.36, 0.085, 0.065], { at: [0.03, 0.14, 0], colour: 0x4c5055 })
      const grip = box(original, [0.08, 0.17, 0.07], { at: [-0.06, 0.05, 0], colour: 0x32383e })
      grip.rotation.z = -0.2
      box(original, [0.09, 0.018, 0.018], { at: [0.06, 0.045, 0], colour: 0x565d64 })
      for (let i = 0; i < 7; i++)
        ellipsoid(creature, [0.035, 0.04, 0.045], {
          at: [0.16 + i * 0.026, 0.145 + i * 0.007, 0],
          colour: 0x68855d,
        })
      ellipsoid(creature, [0.09, 0.045, 0.055], { at: [0.36, 0.2, 0], colour: 0x81966b })
      for (const z of [-0.05, 0.05])
        ellipsoid(creature, [0.012, 0.013, 0.006], { at: [0.38, 0.22, z], colour: 0x131a13 })
    } else {
      box(original, [0.14, 0.19, 0.07], { at: [0, 0.095, 0], colour: 0x253644 })
      box(original, [0.018, 0.16, 0.018], { at: [0.05, 0.25, 0], colour: 0x8c949b })
      if (kind === 'receiver')
        box(original, [0.09, 0.06, 0.012], { at: [0, 0.13, 0.043], colour: 0x7cb7a0 })
      if (kind === 'transmitter') {
        ellipsoid(creature, [0.16, 0.035, 0.23], { at: [0, 0.04, 0], colour: 0xa29b89 })
        ellipsoid(creature, [0.155, 0.032, 0.225], { at: [0, 0.07, 0], colour: 0x716e64 })
      }
    }
    return { root, original, creature, cat }
  }
  function syncDevice(
    state: import('./types').FightState,
    entry: PreparedEntity,
    model: ReturnType<typeof make>,
  ) {
    model.root.visible = entry.present && entry.health > 0 && !entry.device!.swallowed
    const position = devicePosition(state, entry)
    model.root.position.set(options.worldX(position.x), options.worldY(position.y) + 0.03, 0.5)
    const hand = carrierHand(state, entry)
    if (hand && !entry.device!.swallowed) hand.getWorldPosition(model.root.position)
    const scale = deviceMorphScale(entry)
    model.creature.scale.setScalar(scale)
    const displayedForm = entry.device!.form?.kind ?? entry.copy?.inertDeviceForm
    model.original.visible = !displayedForm || entry.device!.kind === 'firearm'
    model.creature.visible = Boolean(displayedForm || entry.device!.transforming)
    orientDevice(state, entry, model)
  }
  function orientDevice(
    state: import('./types').FightState,
    entry: PreparedEntity,
    model: ReturnType<typeof make>,
  ) {
    const device = entry.device!
    const facing = deviceCarrierBody(state, entry)?.facing ?? device.facing ?? 1
    model.root.rotation.y =
      device.kind === 'firearm'
        ? facing === 1
          ? 0
          : Math.PI
        : device.facing === -1
          ? -Math.PI / 2
          : Math.PI / 2
    model.creature.rotation.y =
      device.form?.kind === 'snake' && device.carrier !== device.form.owner ? Math.PI : 0
  }
  function carrierHand(state: import('./types').FightState, entry: PreparedEntity) {
    const side = entry.device!.carrier
    return side && holdsDevice(state, side, entry)
      ? options.handAnchor?.(side, entry.device!.hand === 'left' ? 'rear' : 'lead')
      : undefined
  }
  return {
    sync(state) {
      for (const model of models.values()) model.root.visible = false
      for (const entry of state.battlefield?.entities ?? []) {
        if (!entry.device) continue
        let model = models.get(entry.id)
        if (!model) {
          model = make(entry)
          models.set(entry.id, model)
        }
        syncDevice(state, entry, model)
      }
    },
    dispose() {
      for (const model of models.values()) {
        model.cat?.dispose()
        model.root.removeFromParent()
      }
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((held) => held.dispose())
      models.clear()
    },
  }
}

function deviceMorphScale(entry: PreparedEntity): number {
  const transforming = entry.device!.transforming
  return transforming ? Math.max(0.001, (18 - transforming.frames) / 18) : 1
}
