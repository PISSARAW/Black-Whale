import { createPhinksAnimationClock } from './phinksAnimationClock'
import { createPhinksAnchors } from './phinksAnchors'
import { PHINKS_HIT_ACCENT_FRAMES, PHINKS_TURN_ACCENT_FRAMES } from './phinksAnimation'
import { fineControlReduced, threadVisible } from './fineControlAnchors'
import type { PhinksAccent } from './phinksAnimationClock'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'

/** A wrist pulse per completed turn, then a brief contact ring only on a confirmed charged hit. */
export function createPhinksAccentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createPhinksAnimationClock(),
    anchors = createPhinksAnchors(options),
    root = new THREE.Group(),
    geometry = new THREE.TorusGeometry(0.14, 0.008, 5, 32)
  root.name = 'phinks-hatsu-effects'
  scene.add(root)
  function build(event: PhinksAccent) {
    const material = new THREE.MeshBasicMaterial({
      color: 0x93baf7,
      transparent: true,
      depthWrite: false,
    })
    const group = new THREE.Group(),
      wrist = new THREE.Mesh(geometry, material),
      contact = new THREE.Mesh(geometry, material)
    group.name = `phinks:${event.id}`
    wrist.name = 'phinks-right-wrist'
    contact.name = 'phinks-confirmed-contact'
    contact.visible = event.kind === 'impact'
    group.add(wrist, contact)
    root.add(group)
    return { group, wrist, contact, material }
  }
  const active = new Map<string, ReturnType<typeof build>>()
  function draw(state: FightState, event: PhinksAccent) {
    const held = active.get(event.id) ?? build(event)
    active.set(event.id, held)
    held.group.visible = threadVisible(options, state, event.owner)
    held.group.userData.event = event
    const path = anchors.path(state, event),
      limit = event.kind === 'turn' ? PHINKS_TURN_ACCENT_FRAMES : PHINKS_HIT_ACCENT_FRAMES,
      progress = (event.age + 1) / (limit + 1)
    held.wrist.position.copy(path.right)
    held.contact.position.copy(path.contact)
    held.wrist.scale.setScalar(0.7 + progress * 1.1)
    held.contact.scale.setScalar(1.2 + progress * 4)
    held.material.opacity = Math.sin(Math.PI * progress) * 0.7
  }
  function release(held: ReturnType<typeof build>) {
    held.group.removeFromParent()
    held.material.dispose()
  }
  return {
    sync(state) {
      const events = clock(state)
      root.userData.events = events
      root.visible = !fineControlReduced(options) && options.comfort?.().flashes !== false
      for (const event of events) draw(state, event)
      const ids = new Set(events.map((e) => e.id))
      for (const [id, held] of active)
        if (!ids.has(id)) {
          release(held)
          active.delete(id)
        }
      anchors.retain(ids)
    },
    dispose() {
      root.removeFromParent()
      active.forEach(release)
      active.clear()
      anchors.clear()
      geometry.dispose()
    },
  }
}
