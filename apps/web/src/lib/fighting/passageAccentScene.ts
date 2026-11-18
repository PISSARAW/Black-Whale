import { createPassageClock, type PassageAccent } from './passagePresentation'
import { fineControlEase, fineControlReduced, threadVisible } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { Group, LineBasicMaterial } from 'three'

/** Short threshold outlines; bodies and their collision state are never hidden or moved. */
export function createPassageAccentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const clock = createPassageClock()
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.5, 0, 0),
    new THREE.Vector3(-0.5, 1, 0),
    new THREE.Vector3(0.5, 1, 0),
    new THREE.Vector3(0.5, 0, 0),
  ])
  const root = new THREE.Group()
  root.name = 'passage-type-one'
  scene.add(root)
  const accents = new Map<string, { group: Group; material: LineBasicMaterial }>()
  function build(event: PassageAccent) {
    const material = new THREE.LineBasicMaterial({
      color: event.source === 'luini' ? 0x8bcbd8 : 0x7ec8b6,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    const group = new THREE.Group()
    group.name = `passage-accent:${event.id}`
    const points = event.to ? [event.from, event.to] : [event.from]
    for (const point of points) {
      const outline = new THREE.Line(geometry, material)
      outline.position.set(
        worldX(point.x),
        worldY(point.y) + 0.02,
        event.source === 'luini' && event.kind !== 'transit' ? -1.25 : 0.02,
      )
      if (event.source === 'voconte') outline.rotation.y = Math.PI / 2
      group.add(outline)
    }
    root.add(group)
    const held = { group, material }
    accents.set(event.id, held)
    return held
  }
  return {
    sync(state) {
      const events = clock(state)
      root.userData.events = events
      const active = new Set(events.map((event) => event.id))
      root.visible = !fineControlReduced(options) && options.comfort?.().flashes !== false
      for (const event of events) {
        const held = accents.get(event.id) ?? build(event)
        held.group.visible = threadVisible(options, state, event.owner)
        const progress = fineControlEase(event.age / 18)
        const width = opening(event)
        const height = event.source === 'voconte' ? worldY(14) - worldY(0) : 1.7
        held.group.children.forEach((outline) =>
          outline.scale.set(
            Math.max(0.02, width) * (event.source === 'voconte' ? 1.5 : 0.85),
            height,
            1,
          ),
        )
        held.material.opacity =
          (event.kind === 'close' ? 1 - progress : Math.sin((Math.PI * (event.age + 1)) / 19)) *
          0.55
      }
      for (const [id, held] of accents)
        if (!active.has(id)) {
          held.group.removeFromParent()
          held.material.dispose()
          accents.delete(id)
        }
    },
    dispose() {
      root.removeFromParent()
      accents.forEach(({ material }) => material.dispose())
      accents.clear()
      geometry.dispose()
    },
  }
}
function opening(event: PassageAccent) {
  const progress = fineControlEase(event.age / 18)
  if (event.kind === 'close') return 1 - progress
  if (event.kind === 'transit') return Math.sin(Math.PI * progress)
  return 0.65 + progress * 0.35
}
