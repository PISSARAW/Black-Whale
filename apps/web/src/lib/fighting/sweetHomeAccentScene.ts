import { createSweetHomeClock } from './sweetHomePresentation'
import { createSweetHomeAnchors } from './sweetHomeAnchors'
import { fineControlEase, fineControlReduced, threadVisible } from './fineControlAnchors'
import type { SweetHomeAccent } from './sweetHomePresentation'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'

/** Brief confirmed wound routes: right-hand intake, left-hand outlet, actual recipient. */
export function createSweetHomeAccentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createSweetHomeClock(),
    anchors = createSweetHomeAnchors(options)
  const root = new THREE.Group()
  root.name = 'sweet-home-type-one'
  scene.add(root)
  const ringGeometry = new THREE.TorusGeometry(0.12, 0.009, 5, 24)
  const beadGeometry = new THREE.SphereGeometry(0.045, 8, 6)
  function build(event: SweetHomeAccent) {
    const material = (color: number) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false })
    const intake = material(0xe2bd82),
      outlet = material(event.backlash ? 0xe393a6 : 0xbfc6bc),
      bead = material(0xe7d5ae)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: event.backlash ? 0xcf8998 : 0xcdbb9b,
      transparent: true,
      depthWrite: false,
    })
    const group = new THREE.Group()
    group.name = `sweet-home:${event.id}`
    const source = new THREE.Mesh(ringGeometry, intake),
      right = new THREE.Mesh(ringGeometry, intake)
    const left = new THREE.Mesh(ringGeometry, outlet),
      recipient = new THREE.Mesh(ringGeometry, outlet)
    source.name = 'sweet-home-intake'
    right.name = 'sweet-home-right'
    left.name = 'sweet-home-left'
    recipient.name = 'sweet-home-recipient'
    const packet = new THREE.Mesh(beadGeometry, bead),
      geometry = new THREE.BufferGeometry()
    packet.name = 'sweet-home-wound'
    const line = new THREE.Line(geometry, lineMaterial)
    group.add(source, right, left, recipient, packet, line)
    root.add(group)
    return {
      group,
      source,
      right,
      left,
      recipient,
      packet,
      geometry,
      line,
      intake,
      outlet,
      bead,
      lineMaterial,
    }
  }
  const active = new Map<string, ReturnType<typeof build>>()
  function draw(state: FightState, event: SweetHomeAccent) {
    const held = active.get(event.id) ?? build(event)
    active.set(event.id, held)
    held.group.visible = threadVisible(options, state, event.owner)
    held.group.userData.event = event
    const path = anchors.path(state, event),
      curve = new THREE.CatmullRomCurve3(path.points, false, 'centripetal')
    held.geometry.setFromPoints(curve.getPoints(24))
    held.geometry.computeBoundingSphere()
    const progress = fineControlEase((event.age + 1) / 18),
      envelope = Math.sin((Math.PI * (event.age + 1)) / 19)
    held.geometry.setDrawRange(0, Math.max(2, Math.ceil(progress * 25)))
    held.packet.position.copy(curve.getPoint(progress))
    held.source.position.copy(path.points[0])
    held.right.position.copy(path.right)
    held.left.position.copy(path.left)
    held.recipient.position.copy(path.points.at(-1)!)
    held.source.scale.setScalar(1.1 - progress * 0.65)
    held.source.visible = event.age < 8
    held.right.visible = event.from !== event.owner && event.age < 11
    held.left.visible = event.age >= 4
    held.recipient.visible = event.age >= 8 && !event.backlash
    held.recipient.scale.setScalar(0.75 + progress * 0.6)
    held.intake.opacity = envelope * 0.55
    held.outlet.opacity = envelope * 0.6
    held.bead.opacity = envelope * 0.85
    held.lineMaterial.opacity = envelope * 0.2
  }
  function release(held: ReturnType<typeof build>) {
    held.group.removeFromParent()
    held.geometry.dispose()
    held.intake.dispose()
    held.outlet.dispose()
    held.bead.dispose()
    held.lineMaterial.dispose()
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
      ringGeometry.dispose()
      beadGeometry.dispose()
    },
  }
}
