import { createPerformanceClock, privateRihanFocus } from './performancePresentation'
import {
  controlChest,
  fineControlEase,
  fineControlReduced,
  threadVisible,
} from './fineControlAnchors'
import { PREDATOR_ANALYSIS_FRAMES } from './predatorTuning'
import type { PerformanceAccent } from './performancePresentation'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D, Vector3 } from 'three'

/** Breath stays at the real flute; concentration belongs only to its actual observer. */
export function createPerformanceHatsuScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createPerformanceClock()
  const root = new THREE.Group()
  root.name = 'performance-type-one'
  scene.add(root)
  const geometry = new THREE.TorusGeometry(0.14, 0.006, 5, 24)
  const accents = new Map<
    string,
    { ring: import('three').Mesh; material: import('three').MeshBasicMaterial }
  >()
  const anchors = new Map<
    string,
    { key: string; object: Object3D | undefined; figure: Object3D | undefined; point: Vector3 }
  >()
  function anchor(state: FightState, side: FightSide, source: PerformanceAccent['source']) {
    const figure = options.figureOf?.(side)
    const object = anchorObject(source, side, figure)
    const key = `${state.frame}:${state[side].x}:${state[side].y}`
    const id = `${side}:${source}`,
      held = anchors.get(id)
    if (held && held.key === key && held.object === object && held.figure === figure)
      return held.point
    const point =
      object?.getWorldPosition(new THREE.Vector3()) ??
      controlChest(options, state, side).add(new THREE.Vector3(0, 0.4, 0))
    point.z += 0.15
    anchors.set(id, { key, object, figure, point })
    return point
  }
  function anchorObject(
    source: PerformanceAccent['source'],
    side: FightSide,
    figure: Object3D | undefined,
  ) {
    return source === 'melody'
      ? (figure?.getObjectByName('signature-flute') ??
          scene.getObjectByName(`melody-borrowed-flute:${side}`))
      : source === 'basho'
        ? scene.getObjectByName(`basho-poem:${side}`)
        : head(figure)
  }
  const musicMaterial = new THREE.MeshBasicMaterial({
    color: 0xaad7cf,
    transparent: true,
    depthWrite: false,
  })
  const music = (['player', 'opponent'] as const).map((side) => {
    const group = new THREE.Group()
    group.name = `melody-phrasing:${side}`
    const rings = [0, 1].map(() => {
      const material = musicMaterial.clone()
      const ring = new THREE.Mesh(geometry, material)
      group.add(ring)
      return { ring, material }
    })
    root.add(group)
    return { side, group, rings }
  })
  const focusGeometry = new THREE.BufferGeometry().setFromPoints(
    [-1, 1].flatMap((x) => [
      new THREE.Vector3(x * 0.23, 0.09, 0),
      new THREE.Vector3(x * 0.23, -0.06, 0),
      new THREE.Vector3(x * 0.23, 0.09, 0),
      new THREE.Vector3(x * 0.14, 0.09, 0),
    ]),
  )
  const focusMaterial = new THREE.LineBasicMaterial({
    color: 0xbed6ac,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
  const focus = new THREE.LineSegments(focusGeometry, focusMaterial)
  focus.name = 'rihan-private-focus'
  root.add(focus)
  function syncMusic(state: FightState) {
    for (const { side, group, rings } of music) {
      const performance = state[side].melodyPerformance
      group.visible = performance?.startupFrames === 0 && threadVisible(options, state, side)
      if (!group.visible) continue
      group.position.copy(anchor(state, side, 'melody'))
      for (const [i, { ring, material }] of rings.entries()) {
        const t = ((performance!.playingFrames + i * 21) % 42) / 42
        ring.position.x = state[side].facing * t * 0.24
        ring.scale.setScalar(0.45 + t * 1.15)
        material.opacity = Math.sin(t * Math.PI) * 0.32
      }
    }
  }
  function syncFocus(state: FightState, viewer: FightSide) {
    const observation = privateRihanFocus(state, viewer)
    focus.visible = observation.watching
    root.userData.observedFrames = observation.frames
    if (!focus.visible) return
    focus.position.copy(anchor(state, viewer, 'rihan'))
    focus.scale.setScalar(1.15 - Math.min(1, observation.frames / PREDATOR_ANALYSIS_FRAMES) * 0.2)
    focusMaterial.opacity = observation.ready ? 0.7 : 0.4
  }
  function syncAccent(state: FightState, event: PerformanceAccent) {
    let held = accents.get(event.id)
    if (!held) {
      const material = new THREE.MeshBasicMaterial({
        color: event.source === 'melody' ? 0xaad7cf : 0xd8cda8,
        transparent: true,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(geometry, material)
      root.add(ring)
      held = { ring, material }
      accents.set(event.id, held)
    }
    held.ring.visible = event.source === 'basho' || threadVisible(options, state, event.owner)
    held.ring.position.copy(anchor(state, event.owner, event.source))
    held.ring.scale.setScalar(
      (event.source === 'basho' ? 1.9 : 0.9) * (0.75 + fineControlEase(event.age / 18) * 0.3),
    )
    held.material.opacity = Math.sin((Math.PI * (event.age + 1)) / 19) * 0.4
  }
  return {
    sync(state) {
      const viewer = options.viewer?.() ?? 'player',
        events = clock(state, viewer)
      root.visible =
        state.phase === 'fighting' &&
        !fineControlReduced(options) &&
        options.comfort?.().flashes !== false
      root.userData.events = events
      syncMusic(state)
      syncFocus(state, viewer)
      for (const event of events) syncAccent(state, event)
      const active = new Set(events.map((e) => e.id))
      for (const [id, held] of accents)
        if (!active.has(id)) {
          held.ring.removeFromParent()
          held.material.dispose()
          accents.delete(id)
        }
    },
    dispose() {
      root.removeFromParent()
      geometry.dispose()
      focusGeometry.dispose()
      focusMaterial.dispose()
      musicMaterial.dispose()
      music.forEach(({ rings }) => rings.forEach(({ material }) => material.dispose()))
      accents.forEach(({ material }) => material.dispose())
      accents.clear()
      anchors.clear()
    },
  }
}
const HEADS = new WeakMap<Object3D, Object3D>()
function head(figure: Object3D | undefined) {
  if (!figure) return undefined
  let held = HEADS.get(figure)
  if (held) return held
  figure.traverse((part) => {
    if (part.name.startsWith('manga-head:')) held = part
  })
  if (held) HEADS.set(figure, held)
  return held
}
