import { createSupportHatsuClock } from './supportHatsuPresentation'
import { createCookieTreatmentScene } from './cookieTreatmentScene'
import {
  controlChest,
  fineControlEase,
  fineControlReduced,
  threadVisible,
} from './fineControlAnchors'
import type { SupportHatsuAccent } from './supportHatsuPresentation'
import type { FightState } from './types'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Material growth, a real courier, and actual treatment stay in the combat view. */
export function createSupportHatsuScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createSupportHatsuClock()
  const cookie = createCookieTreatmentScene(options)
  const root = new THREE.Group()
  root.name = 'support-type-one'
  scene.add(root)
  const geometry = new THREE.TorusGeometry(0.17, 0.007, 5, 24)
  const accents = new Map<
    string,
    { ring: import('three').Mesh; material: import('three').MeshBasicMaterial }
  >()
  function build(event: SupportHatsuAccent) {
    const material = new THREE.MeshBasicMaterial({
      color: event.source === 'bill' ? 0xa8cd75 : event.source === 'cluck' ? 0xe2ce95 : 0xeacacb,
      transparent: true,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(geometry, material)
    ring.name = `support-accent:${event.id}`
    root.add(ring)
    const held = { ring, material }
    accents.set(event.id, held)
    return held
  }
  function growPlants(state: FightState, events: SupportHatsuAccent[]) {
    const reduced = fineControlReduced(options)
    for (const entry of state.battlefield?.entities ?? []) {
      if (entry.kind !== 'seed' || !entry.growth) continue
      const plant = scene.getObjectByName(`prepared:${entry.id}`)?.getObjectByName('growth')
      const event = events.find((e) => e.kind === 'growth' && e.subject === entry.id)
      const progress = reduced || !event ? 1 : fineControlEase(event.age / 18)
      plant?.scale.set(0.18 + progress * 0.82, 0.05 + progress * 0.95, 0.18 + progress * 0.82)
    }
  }
  const anchors = new Map<
    string,
    { key: string; figure: import('three').Object3D | undefined; point: import('three').Vector3 }
  >()
  function contact(event: SupportHatsuAccent, state: FightState) {
    const side = event.subject as 'player' | 'opponent'
    const f = state[side],
      figure = options.figureOf?.(side)
    const key = `${state.frame}:${f.x}:${f.y}`
    const held = anchors.get(event.id)
    if (held && held.key === key && held.figure === figure) return held.point
    const point = controlChest(options, state, side)
    anchors.set(event.id, { key, figure, point })
    return point
  }
  function placeAccent(ring: import('three').Mesh, event: SupportHatsuAccent, state: FightState) {
    ring.visible = event.source === 'cluck' || threadVisible(options, state, event.owner)
    if (event.source === 'biscuit') ring.position.copy(contact(event, state))
    else {
      const entry = state.battlefield?.entities.find((e) => e.id === event.subject)
      if (!entry) {
        ring.visible = false
        return
      }
      ring.position.set(
        options.worldX(entry.x),
        options.worldY(entry.y) + (event.source === 'bill' ? 0.48 : 0.18),
        0.48,
      )
    }
    ring.position.z += 0.1
  }
  function poseAccent(state: FightState, event: SupportHatsuAccent) {
    const { ring, material } = accents.get(event.id) ?? build(event)
    placeAccent(ring, event, state)
    ring.rotation.set(0, 0, event.source === 'bill' ? 0.3 : 0)
    ring.scale.setScalar(0.7 + fineControlEase(event.age / 18) * 0.7)
    material.opacity = Math.sin((Math.PI * (event.age + 1)) / 19) * 0.5
  }
  return {
    sync(state) {
      const events = clock(state)
      root.userData.events = events
      root.visible = !fineControlReduced(options) && options.comfort?.().flashes !== false
      growPlants(state, events)
      cookie.sync(state, events)
      const active = new Set(events.map((e) => e.id))
      for (const event of events) poseAccent(state, event)
      for (const [id, held] of accents)
        if (!active.has(id)) {
          held.ring.removeFromParent()
          held.material.dispose()
          accents.delete(id)
          anchors.delete(id)
        }
    },
    dispose() {
      cookie.dispose()
      root.removeFromParent()
      accents.forEach(({ material }) => material.dispose())
      accents.clear()
      anchors.clear()
      geometry.dispose()
    },
  }
}
