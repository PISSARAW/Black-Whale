import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addCamillaCourtDress(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  const dress = new THREE.Mesh(
    geometry(THREE, 'manga:camilla-court-dress', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0, 0.08),
          new THREE.Vector2(0.37, 0.08),
          new THREE.Vector2(0.34, 0.28),
          new THREE.Vector2(0.27, 0.55),
          new THREE.Vector2(0.19, 0.79),
          new THREE.Vector2(0.126, 0.98),
          new THREE.Vector2(0, 0.98),
        ],
        40,
      ).scale(1, 1, 0.85),
    ),
    materials.cloth,
  )
  dress.name = 'camilla-layered-court-dress'
  figure.add(dress)
  const lace = new THREE.Mesh(
    geometry(THREE, 'manga:camilla-scalloped-lace', () => {
      const parts = []
      for (const [radius, y] of [
        [0.373, 0.09],
        [0.333, 0.3],
        [0.28, 0.51],
        [0.22, 0.71],
        [0.162, 0.87],
      ]) {
        const points = []
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2
          points.push(
            new THREE.Vector3(
              Math.cos(a) * radius,
              y + Math.sin(a * 20) * 0.008,
              Math.sin(a) * radius * 0.85,
            ),
          )
        }
        parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, 0.008, 6, false))
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  lace.name = 'camilla-scalloped-lace'
  figure.add(lace)
  mangaPanel(build, {
    name: 'camilla-lace-bodice',
    points: [
      [-0.11, 1.4],
      [-0.06, 1.16],
      [0, 0.99],
      [0.06, 1.16],
      [0.11, 1.4],
    ],
    material: materials.shirt,
  })
  const brooch = new THREE.Mesh(
    geometry(THREE, 'manga:camilla-choker', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.05, 0.006, 6, 28).rotateX(Math.PI / 2),
        new THREE.SphereGeometry(0.013, 12, 10).scale(0.8, 1.3, 0.6).translate(0, -0.013, 0.06),
      ]),
    ),
    materials.accent,
  )
  brooch.position.y = 1.49
  brooch.name = 'camilla-choker-brooch'
  figure.add(brooch)
  const seams = new THREE.Mesh(
    geometry(THREE, 'manga:camilla-bodice-seams', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.004, 0.24).rotateZ(-0.12).translate(-0.036, 0.05, 0.125),
        new THREE.PlaneGeometry(0.004, 0.24).rotateZ(0.12).translate(0.036, 0.05, 0.125),
      ]),
    ),
    materials.accent,
  )
  seams.position.y = 1.12
  figure.add(seams)
}
