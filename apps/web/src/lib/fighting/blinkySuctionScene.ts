import { createBlinkyClock, type BlinkyCapture, type BlinkyAccentFrame } from './blinkyPresentation'
import { blinkyNozzleY } from './blinky'
import { animateBlinky } from './blinkyFigure'
import { fineControlEase, fineControlReduced } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Group, Mesh, Object3D, Vector3 } from 'three'

/** Confirmed matter converges into the live nozzle; nothing here changes combat. */
export function createBlinkySuctionScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createBlinkyClock()
  const shapes = {
    blood: new THREE.SphereGeometry(0.035, 6, 4),
    bullet: new THREE.CapsuleGeometry(0.018, 0.06, 2, 6),
    card: new THREE.BoxGeometry(0.12, 0.17, 0.01),
    stone: new THREE.DodecahedronGeometry(0.1, 0),
    needle: new THREE.CylinderGeometry(0.008, 0.008, 0.17, 5),
    crate: new THREE.BoxGeometry(0.28, 0.28, 0.24),
  }
  const trails = new Map<string, Group>()
  const anchors = new Map<
    FightSide,
    { key: string; figure: Object3D | undefined; point: Vector3 }
  >()
  const mouths = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.LineBasicMaterial({
      color: 0xcbd3dd,
      transparent: true,
      opacity: 0.4,
    })
    const lines = Array.from(
      { length: 3 },
      () => new THREE.Line(new THREE.BufferGeometry(), material),
    )
    const group = new THREE.Group()
    group.name = `blinky-suction:${side}`
    group.add(...lines)
    scene.add(group)
    return { side, group, material, lines }
  })
  function build(event: BlinkyCapture) {
    const root = new THREE.Group()
    root.name = `blinky-capture:${event.id}`
    const material = new THREE.MeshBasicMaterial({
      color: event.colour,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
    const geometry = shapes[event.shape as keyof typeof shapes] ?? shapes.stone
    const count = event.kind === 'blood' ? 3 : 1
    for (let i = 0; i < count; i++) root.add(new THREE.Mesh(geometry, material))
    scene.add(root)
    trails.set(event.id, root)
    return root
  }
  function remove(id: string, root: Group) {
    root.removeFromParent()
    const mesh = root.children[0] as Mesh
    const material = mesh.material as import('three').Material
    material.dispose()
    trails.delete(id)
  }
  return {
    sync(state) {
      const frames = clock(state),
        reduced = fineControlReduced(options)
      const active = new Set<string>()
      for (const entry of mouths) {
        const side = entry.side
        const shown = frames[side]
        const endpoint = syncMouth(entry, state, shown)
        for (const event of shown.captures) {
          if (reduced) continue
          active.add(event.id)
          const root = trails.get(event.id) ?? build(event)
          poseCapture(options, { root, event, endpoint })
        }
      }
      for (const [id, root] of trails) if (!active.has(id)) remove(id, root)
    },
    dispose() {
      for (const [id, root] of trails) remove(id, root)
      for (const { group, lines, material } of mouths) {
        group.removeFromParent()
        lines.forEach((line) => line.geometry.dispose())
        material.dispose()
      }
      Object.values(shapes).forEach((shape) => shape.dispose())
      anchors.clear()
    },
  }
  function syncMouth(entry: (typeof mouths)[number], state: FightState, shown: BlinkyAccentFrame) {
    const { side, group, lines, material } = entry
    const reduced = fineControlReduced(options),
      figure = options.figureOf?.(side)
    if (figure) animateBlinky(figure, state[side], reduced ? 0 : state.frame / 60)
    const endpoint = readMouth(state, side, figure)
    group.userData.events = shown
    group.visible = !reduced && options.comfort?.().flashes !== false && shown.start !== null
    if (shown.start === null) return endpoint
    material.opacity = 0.35 * Math.sin((Math.PI * (shown.start + 1)) / 19)
    lines.forEach((line, index) => {
      const offset = (index - 1) * 0.1
      line.geometry.setFromPoints([
        endpoint.clone().add(new THREE.Vector3(state[side].facing * 0.38, offset, 0)),
        endpoint.clone().add(new THREE.Vector3(state[side].facing * 0.16, offset * 0.35, 0.02)),
        endpoint,
      ])
      line.geometry.computeBoundingSphere()
    })
    return endpoint
  }
  function readMouth(state: FightState, side: FightSide, figure: Object3D | undefined) {
    const actor = state[side]
    const key = `${state.roundNumber}:${state.frame}:${actor.x}:${actor.y}:${actor.facing}:${actor.attack?.moveId}:${actor.attack?.frame}`
    const held = anchors.get(side)
    if (held && held.key === key && held.figure === figure) return held.point
    const point = mouthPosition(options, state, side)
    anchors.set(side, { key, figure, point })
    return point
  }
}
function mouthPosition(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const mouth = options
    .figureOf?.(side)
    ?.getObjectByName('shizuku-blinky')
    ?.getObjectByName('open-mouth')
  return (
    mouth?.getWorldPosition(new options.THREE.Vector3()) ??
    new options.THREE.Vector3(
      options.worldX(state[side].x + state[side].facing * 3),
      options.worldY(blinkyNozzleY(state[side])),
      0.3,
    )
  )
}
function poseCapture(
  options: EffectSceneOptions,
  c: { root: Group; event: BlinkyCapture; endpoint: import('three').Vector3 },
) {
  const progress = fineControlEase(c.event.age / 18)
  const from = new options.THREE.Vector3(options.worldX(c.event.x), options.worldY(c.event.y), 0.3)
  c.root.children.forEach((part, index) => {
    const t = Math.max(0, Math.min(1, progress + index * 0.06))
    part.position.copy(from).lerp(c.endpoint, t)
    part.position.y += Math.sin(t * Math.PI) * (0.07 + index * 0.03)
    part.scale.setScalar(Math.max(0.05, 1 - t))
    part.rotation.z = t * Math.PI * 2
  })
}
