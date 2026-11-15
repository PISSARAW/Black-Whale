import type { Material } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function buildSpatialPortal(
  seen: Apparition,
  { THREE, glow, root }: BasicApparitionContext,
  paneMaterial?: Material,
) {
  const width = seen.size * 0.75
  const height = seen.size * 1.1
  const aperture = new THREE.Shape()
  const points = 48
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const x = Math.cos(angle) * width * 0.62
    const y = Math.sin(angle) * height * 0.52
    if (i === 0) aperture.moveTo(x, y)
    else aperture.lineTo(x, y)
  }
  const pane = new THREE.Mesh(
    new THREE.ShapeGeometry(aperture, 24),
    paneMaterial ?? glow(0x18092e, 1),
  )
  pane.name = 'spatial-portal-aperture'
  pane.renderOrder = 1
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(aperture, 24), glow(seen.colour, 0.72))
  rim.name = 'spatial-portal-rim'
  rim.scale.set(1.18, 1.13, 1)
  rim.position.z = -0.028
  root.add(rim, pane)
  return pane
}

/** The small playground door and its tunnel throat, retaining a real destination pane. */
export function buildWormPortal(
  seen: Apparition,
  context: BasicApparitionContext,
  paneMaterial?: Material,
) {
  if (seen.kind !== 'portal') return undefined
  if (seen.portalKind === 'spatial') return buildSpatialPortal(seen, context, paneMaterial)
  const { THREE, glow, root } = context
  const width = seen.size * 0.75,
    height = seen.size * 1.1
  const frame = new THREE.Shape()
  frame.moveTo(-width / 2, -height / 2)
  frame.lineTo(width / 2, -height / 2)
  frame.lineTo(width / 2, height * 0.37)
  frame.quadraticCurveTo(width / 2, height / 2, width * 0.34, height / 2)
  frame.lineTo(-width * 0.34, height / 2)
  frame.quadraticCurveTo(-width / 2, height / 2, -width / 2, height * 0.37)
  frame.closePath()
  const inner = new THREE.ShapeGeometry(frame, 20)
  const pane = new THREE.Mesh(inner, paneMaterial ?? glow(0x4b3d48, 1))
  const surround = new THREE.Mesh(new THREE.ShapeGeometry(frame, 20), glow(0xc8a7b1, 1))
  surround.scale.set(1.14, 1.09, 1)
  surround.position.z = -0.025
  surround.name = 'magical-worm-doorframe'
  root.add(surround, pane)
  const door = new THREE.Group()
  door.name = 'magical-worm-door-leaf'
  door.position.x = -width / 2
  door.rotation.y = -1.15
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.045), glow(0x9a778d, 1))
  leaf.position.x = width / 2
  door.add(leaf)
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(seen.size * 0.055, 12, 8),
    glow(0xd7c39c, 1),
  )
  handle.position.set(width * 0.85, -height * 0.06, 0.055)
  door.add(handle)
  root.add(door)
  // Ribbed throat behind the hatch, kept short so it never extends
  // through an unrelated bulkhead; the destination still uses the pane.
  for (let i = 1; i <= 4; i++) {
    const rib = new THREE.Mesh(new THREE.ShapeGeometry(frame), glow(0x76606f, 0.12))
    rib.scale.setScalar(1 - i * 0.08)
    rib.position.z = -i * 0.08
    root.add(rib)
  }
  pane.renderOrder = 1
  return pane
}
