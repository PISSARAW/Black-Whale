import { createPerceptionClock, type PerceptionAccent } from './perceptionPresentation'
import { controlChest, fineControlEase, fineControlReduced } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'
import type { Group, LineBasicMaterial, Object3D, Vector3 } from 'three'

/** Silent, owner-scoped feedback. No text, answer, signature or fabricated sensor feed. */
export function createPerceptionAccentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createPerceptionClock()
  const geometry = new THREE.BufferGeometry().setFromPoints([
    ...[-1, 1].flatMap((x) =>
      [-1, 1].flatMap((y) => [
        new THREE.Vector3(x * 0.5, y * 0.25, 0),
        new THREE.Vector3(x * 0.5, y * 0.5, 0),
        new THREE.Vector3(x * 0.5, y * 0.5, 0),
        new THREE.Vector3(x * 0.25, y * 0.5, 0),
      ]),
    ),
  ])
  const root = new THREE.Group()
  root.name = 'perception-type-one'
  scene.add(root)
  const accents = new Map<string, { group: Group; material: LineBasicMaterial }>()
  const anchors = new Map<
    string,
    { key: string; object: Object3D | undefined; figure: Object3D | undefined; point: Vector3 }
  >()
  function build(event: PerceptionAccent) {
    const colour =
      event.source === 'lynch' ? 0xd5a8d7 : event.kind === 'alert' ? 0xe6bf69 : 0x9cd7d5
    const material = new THREE.LineBasicMaterial({
      color: colour,
      transparent: true,
      depthWrite: false,
    })
    const group = new THREE.Group()
    group.name = `perception-accent:${event.id}`
    group.add(new THREE.LineSegments(geometry, material))
    root.add(group)
    const held = { group, material }
    accents.set(event.id, held)
    return held
  }
  function anchor(event: PerceptionAccent, state: FightState) {
    const object = anchorObject(event, options)
    const figure = options.figureOf?.(event.owner)
    const key = `${state.frame}:${state.player.x}:${state.player.y}:${state.opponent.x}:${state.opponent.y}`
    const held = anchors.get(event.id)
    if (held && held.key === key && held.object === object && held.figure === figure)
      return held.point
    const point =
      object?.getWorldPosition(new THREE.Vector3()) ??
      controlChest(options, state, event.owner).add(new THREE.Vector3(0, 0.45, 0))
    if (object) point.y += event.source === 'sayird' ? 0.22 : 0.06
    point.z += 0.1
    anchors.set(event.id, { key, object, figure, point })
    return point
  }
  return {
    sync(state) {
      const viewer = options.viewer?.() ?? 'player'
      const events = clock(state, viewer)
      root.userData.events = events
      root.visible = !fineControlReduced(options) && options.comfort?.().flashes !== false
      const active = new Set(events.map((e) => e.id))
      for (const event of events) {
        const held = accents.get(event.id) ?? build(event)
        held.group.position.copy(anchor(event, state))
        const size = { furykov: 0.78, musse: 0.48, sayird: 0.3, lynch: 0.3 }[event.source]
        const scale = 1.3 - fineControlEase(event.age / 18) * 0.35
        held.group.scale.set(
          size * scale,
          size * scale * (event.source === 'furykov' ? 0.65 : 1),
          1,
        )
        held.material.opacity = Math.sin((Math.PI * (event.age + 1)) / 19) * 0.7
      }
      for (const [id, held] of accents)
        if (!active.has(id)) {
          held.group.removeFromParent()
          held.material.dispose()
          accents.delete(id)
          anchors.delete(id)
        }
    },
    dispose() {
      root.removeFromParent()
      accents.forEach(({ material }) => material.dispose())
      accents.clear()
      anchors.clear()
      geometry.dispose()
    },
  }
}
function anchorObject(event: PerceptionAccent, options: EffectSceneOptions) {
  if (event.source === 'musse') return options.scene.getObjectByName(`secret-window-${event.owner}`)
  if (event.source === 'sayird') return options.scene.getObjectByName(`prepared:${event.subject}`)
  if (event.source === 'furykov')
    return options.scene.getObjectByName(`combo-master:${event.owner}`)
  return options.figureOf?.(event.owner)?.getObjectByName('head')
}
