import * as THREE from 'three'
import type { VictoryContext } from './types'
import { createHisokaFearAnatomy, deformHisokaFearPoint } from './hisokaFearAnatomy'
import { disposeVictoryObject, ease } from './resources'

/** Restore Euler values before the suspended expression resumes (including signed zero). */
export function borrowFearFacePart(context: VictoryContext, node: THREE.Object3D) {
  const rotation = node.rotation.clone()
  context.defer(() => node.rotation.copy(rotation))
  context.save(node)
}
function skinSampler(head: THREE.Object3D) {
  const face = head.getObjectByName('manga-face')!
  const ray = new THREE.Raycaster()
  head.updateWorldMatrix(true, true)
  return (x: number, y: number, lift = 0.002) => {
    const from = head.localToWorld(new THREE.Vector3(x, y, 1))
    ray.set(
      from,
      head
        .localToWorld(new THREE.Vector3(x, y, -1))
        .sub(from)
        .normalize(),
    )
    const hit = ray.intersectObject(face, true)[0]
    return hit
      ? head.worldToLocal(hit.point.clone()).add(new THREE.Vector3(0, 0, lift))
      : new THREE.Vector3(x, y, 0.172 + lift)
  }
}
type Skin = ReturnType<typeof skinSampler>
function patch(points: number[][], skin: Skin, material: THREE.Material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const geometry = new THREE.ShapeGeometry(shape, 16)
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const point = skin(p.getX(i), p.getY(i))
    p.setXYZ(i, point.x, point.y, point.z)
  }
  return new THREE.Mesh(geometry, material)
}
function mouthGeometry(skin: Skin, teeth: boolean, smile: number) {
  const positions: number[] = [],
    indices: number[] = []
  const upper = (t: number) => -0.067 - 0.019 * (1 - t * t) + t * 0.008
  const lower = (t: number) => upper(t) - (0.005 + smile * 0.058) * (1 - t * t)
  const quad = (x1: number, x2: number, edges: [(t: number) => number, (t: number) => number]) => {
    const [y1, y2] = edges
    const start = positions.length / 3
    for (const [t, y] of [
      [x1, y1(x1)],
      [x2, y1(x2)],
      [x1, y2(x1)],
      [x2, y2(x2)],
    ])
      positions.push(
        ...deformHisokaFearPoint(
          skin(t * (0.055 + smile * 0.04), y, teeth ? 0.0045 : 0.0035),
          smile,
        ).toArray(),
      )
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3)
  }
  if (!teeth) for (let i = 0; i < 48; i++) quad(-1 + i / 24, -1 + (i + 1) / 24, [upper, lower])
  else
    for (let i = 0; i < 12; i++) {
      const a = -0.94 + (i * 1.88) / 12,
        b = a + 1.88 / 12 - 0.012
      quad(a, b, [
        (t) => upper(t) - 0.002,
        (t) =>
          upper(t) -
          (0.003 + smile * (0.014 + (i === 2 || i === 9 ? 0.009 : Math.sin(i * 1.6) * 0.003))) *
            (1 - t * t),
      ])
      quad(a, b, [(t) => lower(t) + (0.002 + smile * 0.009) * (1 - t * t), (t) => lower(t) + 0.001])
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}
function morphMouth(skin: Skin, teeth: boolean, material: THREE.Material) {
  const neutral = mouthGeometry(skin, teeth, 0)
  neutral.morphAttributes.position = Array.from({ length: 16 }, (_, i) => {
    const step = mouthGeometry(skin, teeth, (i + 1) / 16),
      positions = step.attributes.position.clone()
    step.dispose()
    return positions
  })
  return new THREE.Mesh(neutral, material)
}
function poseFearMouth(mesh: THREE.Mesh, expression: number) {
  const weights = mesh.morphTargetInfluences!
  weights.fill(0)
  if (expression >= 1) {
    weights[15] = 1
    return
  }
  const sample = expression * 16,
    lower = Math.floor(sample),
    fraction = sample - lower
  weights[lower] = fraction
  if (lower > 0) weights[lower - 1] = 1 - fraction
}
function buildFearFace(head: THREE.Object3D) {
  const root = new THREE.Group(),
    skin = skinSampler(head)
  root.name = 'hisoka-unmasked-terrifying-face'
  const wound = new THREE.MeshBasicMaterial({ color: 0x472a32, side: THREE.DoubleSide })
  const ink = new THREE.MeshBasicMaterial({ color: 0x100d17, side: THREE.DoubleSide })
  const ivory = new THREE.MeshBasicMaterial({ color: 0xf2e4c9, side: THREE.DoubleSide })
  const scars = new THREE.Group()
  scars.add(
    patch(
      [
        [-0.019, -0.027],
        [0.017, -0.03],
        [0.025, -0.065],
        [0.006, -0.076],
        [-0.021, -0.065],
      ],
      skin,
      ink,
    ),
  )
  scars.add(
    patch(
      [
        [0.035, -0.028],
        [0.104, -0.014],
        [0.122, -0.042],
        [0.108, -0.067],
        [0.118, -0.091],
        [0.085, -0.123],
        [0.048, -0.112],
        [0.065, -0.082],
        [0.033, -0.067],
      ],
      skin,
      wound,
    ),
  )
  for (let i = 0; i < 10; i++) {
    const y = -0.025 - i * 0.009,
      x = 0.07 + Math.sin(i * 1.8) * 0.025
    scars.add(
      patch(
        [
          [x - 0.019, y + 0.002],
          [x + 0.025, y - 0.005],
          [x + 0.025, y - 0.008],
          [x - 0.019, y - 0.001],
        ],
        skin,
        ink,
      ),
    )
  }
  for (const side of [-1, 1])
    scars.add(
      patch(
        [
          [side * 0.025, 0.025],
          [side * 0.105, 0.036],
          [side * 0.119, 0.009],
          [side * 0.099, -0.023],
          [side * 0.033, -0.017],
        ],
        skin,
        new THREE.MeshBasicMaterial({
          color: 0x493c52,
          transparent: true,
          opacity: 0.58,
          side: THREE.DoubleSide,
        }),
      ),
    )
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = side * (0.022 + i * 0.014),
        y = 0.071 + i * 0.017
      scars.add(
        patch(
          [
            [x - 0.001, y + 0.024],
            [x + 0.001, y + 0.024],
            [x + side * 0.006, y],
            [x + side * 0.004, y],
          ],
          skin,
          ink,
        ),
      )
      scars.add(
        patch(
          [
            [side * 0.035, -0.021 - i * 0.012],
            [side * 0.072, -0.035 - i * 0.011],
            [side * 0.07, -0.038 - i * 0.011],
            [side * 0.034, -0.024 - i * 0.012],
          ],
          skin,
          ink,
        ),
      )
    }
  }
  scars.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const neutral = node.geometry.attributes.position,
      target = neutral.clone()
    for (let i = 0; i < target.count; i++) {
      const p = deformHisokaFearPoint(
        new THREE.Vector3(neutral.getX(i), neutral.getY(i), neutral.getZ(i)),
        1,
      )
      target.setXYZ(i, p.x, p.y, p.z)
    }
    node.geometry.morphAttributes.position = [target]
    node.updateMorphTargets()
  })
  const mouth = morphMouth(skin, false, ink),
    teeth = morphMouth(skin, true, ivory)
  root.add(scars, mouth, teeth)
  const pallor = new THREE.MeshBasicMaterial({ color: 0xb5b7ae })
  const darkEye = new THREE.MeshBasicMaterial({ color: 0xe5e0d4 }),
    glint = new THREE.MeshBasicMaterial({ color: 0x341b2d })
  const anatomy = createHisokaFearAnatomy(head)
  return { root, scars, mouth, teeth, pallor, darkEye, glint, anatomy }
}
function unmaskedEyes(
  context: VictoryContext,
  expression: number,
  face: ReturnType<typeof buildFearFace>,
) {
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const eye = context.hero.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    borrowFearFacePart(context, eye)
    eye.scale.y *= 1 + expression * (side === 'left' ? -0.32 : 1.8)
    if (expression > 0.3) shadeFearEyes(context, eye, face)
    const pupil = eye.getObjectByName('eye-pupil')
    if (pupil) {
      borrowFearFacePart(context, pupil)
      pupil.scale.setScalar(1 - expression * 0.84)
      for (const shine of pupil.children) {
        context.save(shine)
        shine.visible = false
      }
    }
    const brow = context.hero.head.getObjectByName(`face-brow-${side}`)
    if (brow) {
      borrowFearFacePart(context, brow)
      brow.rotation.z = sign * (0.1 + expression * (side === 'left' ? 0.44 : 0.2))
      brow.position.y += expression * (side === 'left' ? -0.018 : 0.008)
    }
  }
}
function shadeFearEyes(
  context: VictoryContext,
  eye: THREE.Object3D,
  face: ReturnType<typeof buildFearFace>,
) {
  const white = eye.getObjectByName('eye-sclera'),
    pupil = eye.getObjectByName('eye-pupil')
  if (white instanceof THREE.Mesh) context.material(white, face.darkEye)
  if (pupil instanceof THREE.Mesh) context.material(pupil, face.glint)
}
function revealNativeFace(
  context: VictoryContext,
  held: ReturnType<typeof buildFearFace>,
  reveal: number,
) {
  const head = context.hero.head
  for (const name of ['face-relief', 'signature-star', 'signature-tear', 'clash-face-contours']) {
    const part = head.getObjectByName(name)
    if (part && reveal > 0.45) {
      context.save(part)
      part.visible = false
    }
  }
  const mouth = head.getObjectByName('face-mouth')
  if (mouth && held.mouth.visible) {
    context.save(mouth)
    mouth.visible = false
  }
  const face = head.getObjectByName('manga-face')?.children[1]
  if (face instanceof THREE.Mesh && reveal > 0.45) context.material(face, held.pallor)
}
export function createHisokaFearFace() {
  const cache = new Map<THREE.Object3D, ReturnType<typeof buildFearFace>>()
  return {
    apply(context: VictoryContext) {
      const reveal = ease((context.age - 180) / 60),
        expression = ease((context.age - 240) / 54)
      if (reveal <= 0) return { reveal, expression, jawDrop: expression * 0.035 }
      const head = context.hero.head,
        held = cache.get(head) ?? buildFearFace(head)
      cache.set(head, held)
      held.root.visible = true
      held.scars.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        const material = node.material as THREE.MeshBasicMaterial
        material.userData.baseOpacity ??= material.opacity
        material.transparent = true
        material.opacity = material.userData.baseOpacity * reveal
        node.morphTargetInfluences![0] = expression
      })
      poseFearMouth(held.mouth, expression)
      poseFearMouth(held.teeth, expression)
      held.mouth.visible = context.age >= 240
      held.teeth.visible = held.mouth.visible
      held.anatomy.apply(context, expression)
      revealNativeFace(context, held, reveal)
      unmaskedEyes(context, expression, held)
      head.add(held.root)
      context.defer(() => held.root.removeFromParent())
      return { reveal, expression, jawDrop: expression * 0.035 }
    },
    dispose() {
      cache.forEach((face) => {
        disposeVictoryObject(face.root)
        face.pallor.dispose()
        face.darkEye.dispose()
        face.glint.dispose()
        face.anatomy.dispose()
      })
      cache.clear()
    },
  }
}
