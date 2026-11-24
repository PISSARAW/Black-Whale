import { createChrolloAnimationClock, type ChrolloAnimationFrame } from './chrolloAnimation'
import { chrolloNenActive } from './chrolloBook'
import { gyoSight } from './nenPerception'
import { chainChest } from './kurapikaChainAnchors'
import { createChrolloSpectacleBlast } from './victory/blast'
import { disposeVictoryObject } from './victory/resources'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D, Vector3 } from 'three'

/** Accents use the live book joints; major reveals surround existing, executable manifestations. */
export function createChrolloEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const clock = createChrolloAnimationClock()
  const groups = (['player', 'opponent'] as const).map((side) => createActorEffects(options, side))
  return {
    sync(state) {
      const frames = clock(state)
      groups.forEach((group) => group.sync(state, frames[group.side]))
    },
    dispose() {
      groups.forEach((group) => group.dispose())
    },
  }
}

function createActorEffects(options: EffectSceneOptions, side: FightSide) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = `chrollo-reveals:${side}`
  const glints = Array.from(
    { length: 14 },
    () =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(0.012, 0.1),
        new THREE.MeshBasicMaterial({
          color: 0xf7dfa1,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      ),
  )
  const seal = new THREE.Mesh(
    new THREE.RingGeometry(0.93, 1, 48),
    new THREE.MeshBasicMaterial({
      color: 0xe8c38a,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  const blast = createChrolloSpectacleBlast()
  root.add(...glints, seal, blast.group)
  scene.add(root)
  let undo: (() => void)[] = []
  const save = (node: Object3D) => {
    const rotation = node.rotation.clone(),
      scale = node.scale.clone()
    undo.push(() => {
      node.rotation.copy(rotation)
      node.scale.copy(scale)
    })
  }
  function restore() {
    undo.reverse().forEach((reset) => reset())
    undo = []
  }
  return {
    side,
    sync(state: FightState, frame: ChrolloAnimationFrame) {
      restore()
      root.userData.events = frame
      root.visible = false
      const comfort = options.comfort?.()
      if (!visible(options, state, side) || comfort?.camera === 0) return
      root.visible = true
      root.children.forEach((child) => (child.visible = false))
      if (hasBookMotion(frame)) poseBook(options, { state, side, frame, save })
      poseManifestations(options, { side, frame, save })
      const focal = focus(options, { state, side, frame })
      if (!focal || comfort?.flashes === false) return
      if (frame.detonation !== null) {
        blast.sync(focal.point, 180 + frame.detonation)
        return
      }
      const t = focal.age / focal.duration,
        envelope = Math.sin(Math.PI * t)
      seal.visible = focal.duration > 18
      seal.position.copy(focal.point)
      seal.scale.setScalar(focal.radius * (0.35 + 0.8 * t))
      seal.material.opacity = envelope * 0.5
      glints.forEach((glint, i) => {
        const a = i * 2.39996 + t * 0.5,
          r = focal.radius * (0.3 + t * 0.8)
        glint.visible = true
        glint.position
          .copy(focal.point)
          .add(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.65, 0.08))
        glint.rotation.z = -a
        glint.scale.setScalar(envelope * (i % 3 === 0 ? 1.2 : 0.65))
        glint.material.opacity = envelope * 0.8
      })
    },
    dispose() {
      restore()
      disposeVictoryObject(root)
    },
  }
}
interface PoseContext {
  side: FightSide
  frame: ChrolloAnimationFrame
  save: (node: Object3D) => void
}
function hasBookMotion(frame: ChrolloAnimationFrame) {
  return frame.page !== null || frame.book !== null || frame.bookmark !== null
}
function poseBook(options: EffectSceneOptions, c: PoseContext & { state: FightState }) {
  const figure = options.figureOf?.(c.side)
  const book = figure?.getObjectByName(
    c.state[c.side].chrolloBook?.open ? 'chrollo-open-book' : 'chrollo-closed-book',
  )
  if (!book?.visible) return
  const age = c.frame.page ?? c.frame.book
  if (age !== null)
    book.traverse((node) => {
      if (!node.name.startsWith('book-leaf:') || !node.name.endsWith(':combat-joint')) return
      const sign = node.name.includes(':-1') ? -1 : 1
      c.save(node)
      if (c.frame.book !== null) {
        const t = c.frame.book / 18
        const remainder = 1 - t * t * (3 - 2 * t)
        node.rotation.z +=
          (sign * (c.state[c.side].chrolloBook?.open ? 1 : -1) * remainder * Math.PI) / 2
      } else node.rotation.z += sign * Math.sin((Math.PI * age) / 18) * 0.65
    })
  if (c.frame.bookmark !== null)
    book.traverse((node) => {
      if (node.name !== 'chrollo-bookmark') return
      c.save(node)
      node.rotation.x += Math.sin((Math.PI * c.frame.bookmark!) / 18) * 0.35
    })
}
function poseManifestations(options: EffectSceneOptions, c: PoseContext) {
  const formation = (name: string, age: number | null) => {
    if (age === null) return
    const node = options.scene.getObjectByName(name)
    if (!node) return
    c.save(node)
    const t = Math.min(1, age / 30)
    node.scale.multiplyScalar(0.15 + 0.85 * t * t * (3 - 2 * t))
  }
  for (let i = 0; i < 2; i++) formation(`chrollo-fish:${c.side}:${i}`, c.frame.fish)
  formation(`prepared:${c.frame.copyId}`, c.frame.copy)
  if (c.frame.cloth === null) return
  const cloth = options.scene.getObjectByName(`chrollo-cloth:${c.side}`)
  if (cloth) {
    c.save(cloth)
    cloth.rotation.z += Math.sin(Math.PI * Math.min(1, c.frame.cloth / 50)) * 1.3
  }
}
interface Focal {
  point: Vector3
  age: number
  duration: number
  radius: number
}
function focus(
  options: EffectSceneOptions,
  c: Omit<PoseContext, 'save'> & { state: FightState },
): Focal | null {
  const { frame, side, state } = c
  const other = side === 'player' ? 'opponent' : 'player'
  const chest = (who: FightSide) => chainChest(options, { state, side: who })
  const at = (name: string, fallback: Vector3) =>
    options.scene.getObjectByName(name)?.getWorldPosition(new options.THREE.Vector3()) ?? fallback
  if (frame.detonation !== null)
    return { point: chest(other), age: frame.detonation, duration: 84, radius: 0.8 }
  for (const key of [
    'acquired',
    'copy',
    'puppet',
    'fish',
    'cloth',
    'appearance',
    'control',
  ] as const) {
    const age = frame[key]
    if (age === null) continue
    const points = {
      acquired: atHand(options, side, chest(side)),
      copy: at(`prepared:${frame.copyId}`, chest(side)),
      puppet: at(`prepared:${frame.puppetId}`, chest(side)),
      fish: at(`chrollo-fish:${side}:0`, chest(other)),
      cloth: at(`chrollo-cloth:${side}`, chest(side)),
      appearance: chest(state[side].chrolloHistorical?.appearance?.owner === side ? side : other),
      control: chest(other),
    }
    return { point: points[key], age, duration: 84, radius: key === 'acquired' ? 0.26 : 0.65 }
  }
  return accentFocus(options, c)
}
function accentFocus(
  options: EffectSceneOptions,
  c: Omit<PoseContext, 'save'> & { state: FightState },
): Focal | null {
  const { frame, side, state } = c
  const age = frame.page ?? frame.book ?? frame.bookmark ?? frame.sun ?? frame.moon
  if (age === null) return null
  const marking = frame.sun !== null || frame.moon !== null
  const target = marking ? (side === 'player' ? 'opponent' : 'player') : side
  const chest = chainChest(options, { state, side: target })
  return { point: marking ? chest : atHand(options, side, chest), age, duration: 18, radius: 0.2 }
}

function atHand(options: EffectSceneOptions, side: FightSide, fallback: Vector3) {
  return (
    options
      .figureOf?.(side)
      ?.getObjectByName('hand-right')
      ?.getWorldPosition(new options.THREE.Vector3()) ?? fallback
  )
}
function visible(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const viewer = options.viewer?.() ?? 'player'
  return (
    state[side].id === 'chrollo' &&
    chrolloNenActive(state[side]) &&
    (side === viewer || !state[side].nen.in || gyoSight(state[viewer]))
  )
}
