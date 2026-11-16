import type { Group, Mesh } from 'three'
import type { SceneryKit } from './stageKit'
import type { StageBackgroundDefinition } from './stageBackgroundTypes'

type PropKind = StageBackgroundDefinition['secret']['motif']
type Point = readonly [number, number, number]
interface PropKit extends SceneryKit {
  root: Group
  put: (mesh: Mesh, at: Point) => Mesh
  box: (size: Point, at: Point, colour?: number) => Mesh
  ball: (size: Point, at: Point, colour?: number) => Mesh
}
const GOLD = 0xd7bc75
const PAPER = 0xeee4cd
const INK = 0x292536

function propKit(kit: SceneryKit): PropKit {
  const root = new kit.THREE.Group()
  const put = (mesh: Mesh, at: Point) => {
    mesh.position.set(...at)
    root.add(mesh)
    return mesh
  }
  return {
    ...kit,
    root,
    put,
    box: (size, at, colour = GOLD) =>
      put(
        new kit.THREE.Mesh(kit.geometry(new kit.THREE.BoxGeometry(...size)), kit.glow(colour, 1)),
        at,
      ),
    ball: (size, at, colour = GOLD) => {
      const ball = put(
        new kit.THREE.Mesh(
          kit.geometry(new kit.THREE.SphereGeometry(1, 12, 8)),
          kit.glow(colour, 1),
        ),
        at,
      )
      ball.scale.set(...size)
      return ball
    },
  }
}

function boat(p: PropKit): void {
  const hull = p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.ConeGeometry(0.34, 0.22, 4)), p.glow(PAPER, 1)),
    [0, 0, 0],
  )
  hull.rotation.z = Math.PI
  hull.rotation.y = Math.PI / 4
  hull.scale.z = 0.55
  const sail = p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.ConeGeometry(0.2, 0.3, 3)), p.glow(PAPER, 1)),
    [0, 0.15, 0],
  )
  sail.scale.z = 0.08
}
function spider(p: PropKit): void {
  p.ball([0.13, 0.15, 0.09], [0, 0, 0], INK)
  p.ball([0.09, 0.09, 0.07], [0, 0.19, 0], INK)
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const leg = p.box([0.3, 0.025, 0.025], [side * 0.2, 0.12 - i * 0.09, 0], INK)
      leg.rotation.z = side * (0.6 - i * 0.4)
    }
  p.ball([0.02, 0.02, 0.02], [-0.035, 0.21, 0.065], GOLD)
  p.ball([0.02, 0.02, 0.02], [0.035, 0.21, 0.065], GOLD)
}
function card(p: PropKit): void {
  p.box([0.32, 0.46, 0.025], [0, 0, 0], PAPER)
  const diamond = p.box([0.11, 0.11, 0.028], [0, 0, 0.016], 0xb64665)
  diamond.rotation.z = Math.PI / 4
  p.box([0.035, 0.055, 0.028], [-0.11, 0.16, 0.016], INK)
  p.box([0.035, 0.055, 0.028], [0.11, -0.16, 0.016], INK)
}
function cat(p: PropKit): void {
  p.ball([0.18, 0.21, 0.12], [0, 0, 0], INK)
  for (const side of [-1, 1]) {
    p.put(new p.THREE.Mesh(p.geometry(new p.THREE.ConeGeometry(0.1, 0.19, 3)), p.glow(INK, 1)), [
      side * 0.12,
      0.19,
      0,
    ])
    p.ball([0.035, 0.018, 0.025], [side * 0.075, 0.03, 0.11], GOLD)
  }
  p.ball([0.025, 0.02, 0.02], [0, -0.04, 0.12], 0xc8788b)
}
function reel(p: PropKit): void {
  p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.CylinderGeometry(0.24, 0.24, 0.06, 24)),
      p.glow(GOLD, 1),
    ),
    [0, 0, 0],
  ).rotation.x = Math.PI / 2
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5
    p.ball([0.05, 0.05, 0.02], [Math.sin(angle) * 0.14, Math.cos(angle) * 0.14, 0.032], INK)
  }
}
function spring(p: PropKit): void {
  const points = Array.from({ length: 97 }, (_, i) => {
    const angle = (i / 96) * Math.PI * 12
    return new p.THREE.Vector3(
      Math.sin(angle) * 0.15,
      (i / 96) * 0.5 - 0.25,
      Math.cos(angle) * 0.15,
    )
  })
  p.put(
    new p.THREE.Mesh(
      p.geometry(
        new p.THREE.TubeGeometry(new p.THREE.CatmullRomCurve3(points), 96, 0.018, 5, false),
      ),
      p.glow(GOLD, 1),
    ),
    [0, 0, 0],
  )
}
function toy(p: PropKit): void {
  p.ball([0.23, 0.12, 0.11], [0, 0, 0], 0x82bbcc)
  p.ball([0.028, 0.028, 0.02], [0.13, 0.035, 0.1], INK)
  const tail = p.box([0.17, 0.1, 0.05], [-0.23, 0.05, 0], 0x82bbcc)
  tail.rotation.z = -0.5
  p.box([0.02, 0.11, 0.02], [0.08, 0.14, 0], PAPER)
}
function feather(p: PropKit): void {
  p.ball([0.08, 0.27, 0.025], [0, 0.03, 0])
  p.box([0.015, 0.61, 0.02], [0, -0.05, 0.025], PAPER)
  for (let i = 0; i < 5; i++) {
    p.box([0.12, 0.008, 0.02], [0, i * 0.07 - 0.13, 0.028], INK).rotation.z = 0.4
  }
  p.root.rotation.z = -0.45
}
function coin(p: PropKit): void {
  p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.CylinderGeometry(0.22, 0.22, 0.035, 24)),
      p.glow(GOLD, 1),
    ),
    [0, 0, 0],
  ).rotation.x = Math.PI / 2
  p.box([0.065, 0.09, 0.045], [0, 0, 0.01], INK)
}
function cup(p: PropKit): void {
  p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.CylinderGeometry(0.15, 0.1, 0.21, 16)),
      p.glow(PAPER, 1),
    ),
    [0, 0, 0],
  )
  p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.TorusGeometry(0.09, 0.025, 6, 14)), p.glow(GOLD, 1)),
    [0.16, 0, 0],
  )
  p.box([0.34, 0.025, 0.29], [0, -0.12, 0])
}
const BUILDERS: Record<PropKind, (p: PropKit) => void> = {
  boat,
  spider,
  card,
  cat,
  reel,
  spring,
  toy,
  feather,
  coin,
  cup,
}

export function buildBackgroundProp(kit: SceneryKit, kind: PropKind): Group {
  const p = propKit(kit)
  BUILDERS[kind](p)
  p.root.name = `background-secret:${kind}`
  return p.root
}
