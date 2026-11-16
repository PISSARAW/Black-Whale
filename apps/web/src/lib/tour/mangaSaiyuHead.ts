import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addSaiyuFace } from './mangaSaiyuFace'
import { saiyuCurve, saiyuScroll } from './mangaSaiyuOrnaments'

export function mangaSaiyuCrop(kit: MangaHairKit) {
  const cap = mangaScalpGeometry(kit)
  const positions = cap.getAttribute('position')
  const index = cap.index!
  const triangles = []
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
    const open = ids.some(
      (id) =>
        positions.getZ(id) > 0.055 &&
        Math.abs(positions.getX(id)) < 0.13 &&
        positions.getY(id) < 0.163,
    )
    if (!open) triangles.push(...ids)
  }
  cap.setIndex(triangles)
  kit.parts.push(cap)
  for (const side of [-1, 1])
    kit.lock({
      width: 0.026,
      depth: 0.008,
      points: [
        [side * 0.14, 0.135, 0.04],
        [side * 0.155, 0.075, 0.045],
        [side * 0.151, -0.045, 0.045],
        [side * 0.12, -0.094, 0.075],
      ],
    })
}

export function addSaiyuHead(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'saiyu') return
  const { THREE, geometry, glow, profile, materials } = build
  const circlet = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-gold-circlet', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.164, 0.009, 8, 48)
          .rotateX(Math.PI / 2)
          .scale(1, 1, 1.08)
          .translate(0, 0.115, 0),
        saiyuScroll(THREE, { radius: 0.024, tube: 0.007, at: [0, 0.132, 0.179] }),
      ]),
    ),
    glow(profile.accent, 1),
  )
  circlet.name = 'saiyu-gold-circlet'
  head.add(circlet)
  const heart = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-shaved-heart', () => {
      const shape = new THREE.Shape()
      shape.moveTo(0, -0.017)
      shape.bezierCurveTo(-0.075, 0.012, -0.031, 0.05, 0, 0.029)
      shape.bezierCurveTo(0.031, 0.05, 0.075, 0.012, 0, -0.017)
      const heart = new THREE.ShapeGeometry(shape, 16)
      const position = heart.getAttribute('position')
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i),
          y = position.getY(i) + 0.173
        const radius =
          y < 0.2 ? 0.121 - (y - 0.163) * 1.23 : Math.max(0, (0.0755 * (0.22 - y)) / 0.02)
        position.setXYZ(
          i,
          x,
          position.getY(i),
          Math.min(0.171, Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) * 1.32) * 1.065 + 0.01,
        )
      }
      heart.computeVertexNormals()
      return heart
    }),
    materials.skin,
  )
  heart.position.set(0, 0.185, 0)
  heart.name = 'saiyu-shaved-heart'
  head.add(heart)
  const ears = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-large-ears', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(1, 20, 16)
            .scale(0.05, 0.072, 0.025)
            .translate(side * 0.178, -0.022, 0),
        ),
      ),
    ),
    materials.skin,
  )
  ears.name = 'saiyu-large-ears'
  head.add(ears)
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-ear-folds', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.TorusGeometry(0.035, 0.003, 6, 24, Math.PI * 1.65)
            .scale(0.77, 1.35, 1)
            .translate(side * 0.181, -0.02, 0.024),
        ),
      ),
    ),
    glow(0x7d7050, 1),
  )
  folds.name = 'saiyu-ear-folds'
  head.add(folds)
  addSaiyuExpression(build, head)
  addSaiyuFace(build, head)
}

function addSaiyuExpression(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const marks = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-cheek-hatching', () => {
      const parts = []
      for (const side of [-1, 1])
        for (let i = 0; i < 5; i++)
          parts.push(
            new THREE.BoxGeometry(0.002, 0.037, 0.002)
              .rotateZ(side * 0.48)
              .translate(side * (0.09 + i * 0.007), -0.084 + i * 0.008, 0.115 - i * 0.011),
          )
      parts.push(
        saiyuCurve(
          THREE,
          [
            [-0.02, 0.049, 0.179],
            [-0.009, 0.08, 0.178],
            [-0.015, 0.101, 0.174],
          ],
          0.002,
        ),
      )
      return mergeHumanDetails(parts)
    }),
    glow(0x665a43, 1),
  )
  marks.name = 'saiyu-cheek-hatching'
  head.add(marks)
  for (const side of [-1, 1]) {
    const iris = head
      .getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!
      .getObjectByName('eye-pupil') as Mesh
    iris.material = glow(0x766244, 1)
    iris.position.x = -0.017
  }
}
