import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addFurykovPuffer } from './mangaRoyalMilitaryClothes'

export function addBalsamilcoScarAndAge(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, glow } = build
  const source = head.getObjectByName('manga-face')!.children[1] as Mesh
  const face = new THREE.Mesh(source.geometry, source.material)
  const ray = new THREE.Raycaster()
  const scarPoints: Array<readonly [number, number]> = [
    [-0.125, 0.16],
    [-0.106, 0.108],
    [-0.117, 0.055],
    [-0.093, 0.008],
    [-0.104, -0.046],
    [-0.075, -0.105],
  ]
  const points = scarPoints.map(([x, y]) => {
    ray.set(new THREE.Vector3(x, y, 1), new THREE.Vector3(0, 0, -1))
    return new THREE.Vector3(x, y, (ray.intersectObject(face)[0]?.point.z ?? 0.17) + 0.003)
  })
  const scar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:balsamilco-temple-scar',
      () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.0025, 5, false),
    ),
    glow(0x4d302a, 0.95),
  )
  scar.name = 'balsamilco-left-temple-scar'
  head.add(scar)

  const ageLines = new THREE.Mesh(
    geometry(THREE, 'manga:balsamilco-age-lines', () => {
      const parts: BufferGeometry[] = []
      for (let line = 0; line < 4; line++)
        parts.push(
          new THREE.PlaneGeometry(0.13 - line * 0.012, 0.0022)
            .rotateZ(line % 2 ? -0.045 : 0.035)
            .translate(-0.006, 0.105 + line * 0.026, 0.179),
        )
      for (const side of [-1, 1])
        parts.push(
          new THREE.PlaneGeometry(0.074, 0.003)
            .rotateZ(side * 0.13)
            .translate(side * 0.069, -0.002, 0.182),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x3e2d29, 0.72),
  )
  ageLines.name = 'balsamilco-forehead-and-eye-folds'
  head.add(ageLines)
}

export function addBalsamilcoPrivateSoldierUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials } = build
  addFurykovPuffer(build)
  for (const side of [-1, 1]) {
    const pocket = new THREE.Mesh(
      geometry(
        THREE,
        'manga:balsamilco-tactical-pocket',
        () => new THREE.BoxGeometry(0.1, 0.15, 0.035),
      ),
      materials.dark,
    )
    pocket.name = 'balsamilco-tactical-pocket'
    pocket.position.set(side * 0.12, 0.55, 0.105)
    figure.add(pocket)

    const boot = new THREE.Mesh(
      geometry(THREE, 'manga:balsamilco-combat-boot', () =>
        new THREE.CylinderGeometry(0.072, 0.085, 0.3, 10).scale(1, 1, 0.85),
      ),
      materials.dark,
    )
    boot.name = 'balsamilco-combat-boot'
    boot.position.set(side * 0.105, 0.2, 0)
    figure.add(boot)
  }
}
