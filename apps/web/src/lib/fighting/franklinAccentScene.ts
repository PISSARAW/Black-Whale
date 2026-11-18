import { gyoSight } from './nenPerception'
import {
  createFranklinPresentationClock,
  franklinShotHand,
  FRANKLIN_ACCENT_FRAMES,
  FRANKLIN_SHOT_ACCENT_FRAMES,
  type FranklinFrames,
} from './franklinPresentation'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D } from 'three'

const MUZZLES = new WeakMap<Object3D, Map<string, Object3D>>()
const EMPTY_MUZZLES = new Map<string, Object3D>()
function muzzleNodes(figure: Object3D | undefined) {
  if (!figure) return EMPTY_MUZZLES
  let nodes = MUZZLES.get(figure)
  if (!nodes) {
    nodes = new Map()
    figure.traverse((node) => {
      if (node.name === 'franklin-muzzle-flash' && node.parent) nodes!.set(node.parent.name, node)
    })
    MUZZLES.set(figure, nodes)
  }
  return nodes
}

export function createFranklinAccentScene(options: EffectSceneOptions): FighterEffectScene {
  const clock = createFranklinPresentationClock()
  const sides = (['player', 'opponent'] as const).map((side) => actorScene(options, side))
  return {
    sync(state) {
      const frames = clock(state)
      sides.forEach((actor) => actor.sync(state, frames[actor.side]))
    },
    dispose() {
      sides.forEach((actor) => actor.dispose())
    },
  }
}
function actorScene(options: EffectSceneOptions, side: FightSide) {
  const { THREE } = options
  const root = new THREE.Group()
  root.name = `franklin-accents:${side}`
  const geometry = new THREE.RingGeometry(0.8, 1, 24, 1, -0.8, 4.7)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd4be,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.5,
  })
  const starts = Array.from({ length: 2 }, () => new THREE.Mesh(geometry, material))
  const pulses = Array.from({ length: 4 }, () => {
    const own = material.clone()
    return new THREE.Mesh(geometry, own)
  })
  root.add(...starts, ...pulses)
  options.scene.add(root)
  return {
    side,
    sync(state: FightState, frame: FranklinFrames) {
      const figure = options.figureOf?.(side)
      controlNativeFlashes(figure, { state, side, frame, options })
      root.userData.events = frame
      root.visible = visible(options, state, side)
      root.children.forEach((node) => (node.visible = false))
      if (!root.visible) return
      const fighter = state[side]
      starts.forEach((mesh, i) => {
        const hand = figure?.getObjectByName(`hand-${i === 0 ? 'left' : 'right'}`)
        mesh.visible = frame.start !== null && Boolean(hand)
        if (!mesh.visible || !hand || frame.start === null) return
        const t = frame.start / FRANKLIN_ACCENT_FRAMES
        hand.getWorldPosition(mesh.position)
        mesh.position.z += 0.025
        mesh.scale.setScalar(0.045 + Math.sin(Math.PI * t) * 0.08)
        mesh.rotation.z = (i === 0 ? 1 : -1) * t
        material.opacity = Math.sin(Math.PI * t) * 0.45
      })
      pulses.forEach((mesh, i) => {
        const shot = frame.shots[i]
        const muzzle = shot && muzzleOf(figure, fighter.facing, shot.index)
        mesh.visible = Boolean(muzzle)
        if (!muzzle || !shot) return
        const t = shot.age / FRANKLIN_SHOT_ACCENT_FRAMES
        muzzle.getWorldPosition(mesh.position)
        mesh.position.x += fighter.facing * t * 0.12
        mesh.position.z += 0.02
        mesh.scale.setScalar(0.025 + t * 0.055)
        mesh.rotation.z = fighter.facing === 1 ? 0 : Math.PI
        mesh.material.opacity = (1 - t) * 0.6
      })
    },
    dispose() {
      root.removeFromParent()
      geometry.dispose()
      material.dispose()
      pulses.forEach((mesh) => mesh.material.dispose())
    },
  }
}
function muzzleOf(figure: Object3D | undefined, facing: 1 | -1, index: number) {
  const hand = franklinShotHand(facing, index)
  return muzzleNodes(figure).get(`franklin-finger-${hand}-${Math.floor(index / 2) % 5}`)
}
function visible(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const viewer = options.viewer?.() ?? 'player'
  if (options.comfort?.().flashes === false) return false
  return side === viewer || !state[side].attack?.concealed || gyoSight(state[viewer])
}
function controlNativeFlashes(
  figure: Object3D | undefined,
  c: { state: FightState; side: FightSide; frame: FranklinFrames; options: EffectSceneOptions },
) {
  const flashed = new Set(
    c.frame.shots
      .filter((shot) => shot.age < 2)
      .map((shot) => muzzleOf(figure, c.state[c.side].facing, shot.index)),
  )
  const allowed = visible(c.options, c.state, c.side)
  for (const node of muzzleNodes(figure).values()) node.visible = allowed && flashed.has(node)
}
