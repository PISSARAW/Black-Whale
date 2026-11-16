import { easterEggDefinition } from './easterEggCatalogue'
import type { EasterEggDefinition, EggPropKind, EggPropCue } from './easterEggTypes'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Ordinary decorative objects: no Nen constructs, inventory entries or pickup collisions. */
export function createRosterEasterEggScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const geometry = new Set<import('three').BufferGeometry>()
  const material = {
    paper: new THREE.MeshBasicMaterial({ color: 0xf0e4c9, side: THREE.DoubleSide }),
    ink: new THREE.MeshBasicMaterial({ color: 0x283b4b }),
    gold: new THREE.MeshBasicMaterial({ color: 0xd8b769 }),
    ribbon: new THREE.MeshBasicMaterial({ color: 0xb44c70, side: THREE.DoubleSide }),
    cloth: new THREE.MeshBasicMaterial({ color: 0xc2cfdb, side: THREE.DoubleSide }),
    gem: new THREE.MeshBasicMaterial({ color: 0x64e5dd }),
    leaf: new THREE.MeshBasicMaterial({ color: 0x91bb61, side: THREE.DoubleSide }),
    bottle: new THREE.MeshBasicMaterial({ color: 0xa4d4df, transparent: true, opacity: 0.7 }),
  }
  const box = (size: readonly [number, number, number]) => {
    const shape = new THREE.BoxGeometry(...size)
    geometry.add(shape)
    return shape
  }
  const mesh = (shape: import('three').BufferGeometry, colour: keyof typeof material) => {
    geometry.add(shape)
    return new THREE.Mesh(shape, material[colour])
  }
  const paper = (kind: 'paper' | 'letter' | 'map' | 'owlNote' | 'ticket') => {
    const group = new THREE.Group()
    const sheet = mesh(box(kind === 'ticket' ? [0.13, 0.23, 0.008] : [0.24, 0.29, 0.008]), 'paper')
    group.add(sheet)
    for (let i = 0; i < 3; i++) {
      const line = mesh(box([0.12 - i * 0.02, 0.006, 0.003]), 'ink')
      line.position.set(0, 0.045 - i * 0.035, 0.007)
      group.add(line)
    }
    if (kind === 'owlNote') {
      for (const sign of [-1, 1]) {
        const eye = mesh(new THREE.RingGeometry(0.016, 0.023, 10), 'ink')
        eye.position.set(sign * 0.027, 0.065, 0.009)
        group.add(eye)
      }
    }
    if (kind === 'map' || kind === 'letter') sheet.rotation.z = Math.PI / 2
    return group
  }
  const cloth = () => mesh(new THREE.PlaneGeometry(0.25, 0.22, 2, 2), 'cloth')
  const ribbon = () => {
    const group = new THREE.Group()
    for (const sign of [-1, 1]) {
      const loop = mesh(new THREE.TorusGeometry(0.045, 0.009, 5, 12), 'ribbon')
      loop.position.x = sign * 0.04
      const tail = mesh(box([0.025, 0.14, 0.008]), 'ribbon')
      tail.position.set(sign * 0.022, -0.09, 0)
      tail.rotation.z = sign * 0.25
      group.add(loop, tail)
    }
    return group
  }
  const bottle = () => {
    const group = new THREE.Group()
    const body = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.17, 12), 'bottle')
    const neck = mesh(new THREE.CylinderGeometry(0.021, 0.028, 0.06, 8), 'bottle')
    neck.position.y = 0.105
    const cap = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.025, 8), 'ink')
    cap.position.y = 0.147
    group.add(body, neck, cap)
    return group
  }
  const leaf = () => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.1)
    shape.bezierCurveTo(-0.12, 0, -0.08, 0.1, 0, 0.15)
    shape.bezierCurveTo(0.08, 0.1, 0.12, 0, 0, -0.1)
    return mesh(new THREE.ShapeGeometry(shape), 'leaf')
  }
  const notebook = () => {
    const group = new THREE.Group()
    group.add(mesh(box([0.23, 0.29, 0.04]), 'ink'))
    const pages = mesh(box([0.2, 0.25, 0.03]), 'paper')
    pages.position.z = 0.012
    group.add(pages)
    return group
  }
  const ruler = () => {
    const group = new THREE.Group()
    group.add(mesh(box([0.3, 0.035, 0.009]), 'gold'))
    for (let i = 0; i < 7; i++) {
      const tick = mesh(box([0.005, 0.016, 0.003]), 'ink')
      tick.position.set(-0.12 + i * 0.04, 0.006, 0.007)
      group.add(tick)
    }
    return group
  }
  const stamp = () => {
    const group = new THREE.Group()
    group.add(mesh(box([0.095, 0.035, 0.07]), 'ink'))
    const handle = mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.11, 8), 'gold')
    handle.position.y = 0.055
    const sheet = mesh(box([0.22, 0.15, 0.006]), 'paper')
    sheet.position.set(0, -0.1, 0.04)
    group.add(handle, sheet)
    return group
  }
  const builders: Record<EggPropKind, () => import('three').Object3D> = {
    paper: () => paper('paper'),
    letter: () => paper('letter'),
    map: () => paper('map'),
    owlNote: () => paper('owlNote'),
    ticket: () => paper('ticket'),
    cloth,
    ribbon,
    bottle,
    leaf,
    notebook,
    ruler,
    stamp,
    gem: () => mesh(new THREE.OctahedronGeometry(0.09), 'gem'),
    coin: () => {
      const coin = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16), 'gold')
      coin.rotation.x = Math.PI / 2
      const group = new THREE.Group()
      group.add(coin)
      return group
    },
    fan: () => mesh(new THREE.CircleGeometry(0.2, 16, 0, Math.PI), 'ribbon'),
    bandage: () => mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 12), 'cloth'),
    pencil: () => mesh(box([0.013, 0.21, 0.013]), 'gold'),
  }
  const makeSide = (side: FightSide) => {
    const root = new THREE.Group()
    root.name = `roster-easter-props-${side}`
    root.visible = false
    scene.add(root)
    return {
      root,
      objects: new Map<EggPropKind, import('three').Object3D>(),
      probe: new THREE.Vector3(),
    }
  }
  const models = { player: makeSide('player'), opponent: makeSide('opponent') }
  const syncSide = (state: FightState, side: FightSide) => {
    const fighter = state[side]
    const model = models[side]
    const egg = fighter.easterEgg
    const definition = egg ? easterEggDefinition(fighter.id, egg.slot) : undefined
    const cue = definition?.prop
    model.root.visible = Boolean(cue)
    for (const object of model.objects.values()) object.visible = false
    if (!cue || !egg) return
    let object = model.objects.get(cue.kind)
    if (!object) {
      object = builders[cue.kind]()
      object.name = `${fighter.id}-cosmetic-${cue.kind}`
      model.objects.set(cue.kind, object)
      model.root.add(object)
    }
    object.visible = true
    object.name = `${fighter.id}-cosmetic-${cue.kind}`
    const anchor = options.handAnchor?.(side, propHand(definition!, cue, egg.frame / egg.duration))
    if (anchor) anchor.getWorldPosition(model.probe)
    else model.probe.set(worldX(fighter.x) + fighter.facing * 0.4, worldY(fighter.y) + 1.25, 0.3)
    model.root.position.copy(model.probe)
    model.root.scale.set(fighter.facing, 1, 1)
    animateProp(object, cue, egg.frame / egg.duration)
  }
  return {
    sync: (state) => {
      syncSide(state, 'player')
      syncSide(state, 'opponent')
    },
    dispose: () => {
      scene.remove(models.player.root, models.opponent.root)
      geometry.forEach((shape) => shape.dispose())
      Object.values(material).forEach((paint) => paint.dispose())
    },
  }
}

function propHand(definition: EasterEggDefinition, cue: EggPropCue, t: number): 'lead' | 'rear' {
  return definition.motion?.gesture === 'transfer' && t > 0.55 ? 'rear' : cue.hand
}

function animateProp(object: import('three').Object3D, cue: EggPropCue, t: number) {
  object.position.set(0, 0, 0)
  object.rotation.set(0, 0, 0)
  object.scale.setScalar(1)
  const late = Math.max(0, (t - 0.55) / 0.45)
  if (cue.action === 'spin') object.rotation.y = t * Math.PI * 8
  if (cue.action === 'turn') object.rotation.z = Math.PI * Math.min(1, t * 1.7)
  if (cue.action === 'fold') {
    object.scale.x = 1 - Math.min(0.65, t * 0.8)
    object.rotation.y = Math.sin(t * Math.PI * 4) * 0.25
  }
  if (cue.action === 'drop') {
    object.position.set(late * 0.12, -late * late * 0.6, 0)
    object.rotation.z = late * 2
  }
  if (cue.action === 'stamp') object.position.y = -0.04 * (1 + Math.sin(t * Math.PI * 8))
}
