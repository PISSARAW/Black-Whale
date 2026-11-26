import type { Group, Material } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { mergeHumanDetails } from './humanDetailGeometry'

type Three = BasicApparitionContext['THREE']

function arch(THREE: Three, width: number, height: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, -height / 2)
  shape.lineTo(width / 2, -height / 2)
  shape.lineTo(width / 2, height * 0.24)
  shape.quadraticCurveTo(0, height * 0.76, -width / 2, height * 0.24)
  shape.closePath()
  return shape
}

function carving(THREE: Three) {
  const heart = new THREE.Path()
  heart.moveTo(0, 0.095)
  heart.bezierCurveTo(-0.24, 0.205, -0.165, 0.413, 0, 0.32)
  heart.bezierCurveTo(0.165, 0.413, 0.24, 0.205, 0, 0.095)

  const rails = new THREE.Path()
  rails.moveTo(-0.437, 0.027)
  rails.lineTo(0.437, 0.027)
  rails.moveTo(-0.437, -0.104)
  rails.lineTo(0.437, -0.104)
  const lower = new THREE.Path()
  lower.moveTo(-0.431, -0.164)
  lower.lineTo(0.431, -0.164)
  lower.lineTo(0.431, -0.424)
  lower.lineTo(-0.431, -0.424)
  lower.closePath()

  const scroll = new THREE.Path()
  scroll.moveTo(0.391, 0.075)
  scroll.bezierCurveTo(0.339, 0.235, 0.198, 0.042, 0.281, 0.17)
  scroll.bezierCurveTo(0.358, 0.25, 0.388, 0.105, 0.306, 0.113)
  scroll.moveTo(0.012, -0.403)
  scroll.bezierCurveTo(0.145, -0.362, 0.186, -0.213, 0.102, -0.198)
  scroll.bezierCurveTo(0.008, -0.167, 0.011, -0.328, 0.091, -0.3)
  scroll.bezierCurveTo(0.146, -0.28, 0.115, -0.216, 0.07, -0.237)
  scroll.moveTo(0.081, -0.382)
  scroll.bezierCurveTo(0.205, -0.422, 0.394, -0.351, 0.371, -0.26)
  scroll.bezierCurveTo(0.341, -0.17, 0.27, -0.236, 0.294, -0.285)

  const parts = [heart, rails, lower, scroll].flatMap((path) =>
    path.curves.map((curve) => {
      const points = curve.getPoints(10).map(({ x, y }) => new THREE.Vector3(x, y, 0))
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 10, 0.005, 5, false)
    }),
  )
  parts.push(
    ...parts
      .slice(heart.curves.length + rails.curves.length + lower.curves.length)
      .map((part) => part.clone().rotateY(Math.PI)),
  )
  return mergeHumanDetails(parts)
}

function doorLeaf(
  { THREE, glow }: BasicApparitionContext,
  dimensions: { width: number; height: number; closed: boolean },
): Group {
  const { width, height, closed } = dimensions
  const door = new THREE.Group()
  door.name = 'magical-worm-door-leaf'
  door.position.x = width / 2
  door.rotation.y = closed ? 0 : 1.05
  const leaf = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arch(THREE, width, height), {
      depth: 0.031,
      bevelEnabled: false,
    }),
    glow(0x987857, 1),
  )
  leaf.position.x = -width / 2
  door.add(leaf)

  const relief = new THREE.Mesh(carving(THREE), glow(0xdfbc87, 1))
  relief.name = 'magical-worm-heart-and-scrollwork'
  relief.scale.set(width, height, width)
  relief.position.set(leaf.position.x, 0, 0.035)
  door.add(relief)

  const handle = new THREE.Mesh(new THREE.SphereGeometry(width * 0.058, 12, 8), glow(0xdac092, 1))
  handle.name = 'magical-worm-handle'
  handle.position.set(-width * 0.84, -height * 0.042, 0.049)
  door.add(handle)
  return door
}

/** Chapter 374's crawl-through door, with the destination pane kept separate from the leaf. */
export function buildWormPortal(
  seen: Apparition,
  context: BasicApparitionContext,
  paneMaterial?: Material,
) {
  if (seen.kind !== 'portal') return undefined
  const { THREE, glow, root } = context
  const width = seen.size * 0.75
  const height = seen.size * 1.1
  const opening = arch(THREE, width, height)
  const frame = arch(THREE, width * 1.13, height * 1.09)
  frame.holes.push(opening)
  const surround = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frame, { depth: 0.045, bevelEnabled: false }),
    glow(0xbaa084, 1),
  )
  surround.name = 'magical-worm-doorframe'
  root.add(surround)

  const closed = seen.stage === 1
  const pane = new THREE.Mesh(
    new THREE.ShapeGeometry(opening, 20),
    paneMaterial ?? glow(0x342e37, 1),
  )
  pane.position.z = paneMaterial ? 0 : -seen.size * 0.31
  pane.renderOrder = 1
  pane.name = 'magical-worm-destination'
  root.add(pane, doorLeaf(context, { width, height, closed }))

  if (!paneMaterial && !closed) {
    for (let i = 1; i <= 4; i++) {
      const rib = new THREE.Mesh(surround.geometry, glow(i % 2 ? 0x7e675b : 0x655349, 1))
      rib.scale.setScalar(1 - i * 0.085)
      rib.position.z = -seen.size * 0.065 * i
      root.add(rib)
    }
  }
  return pane
}
