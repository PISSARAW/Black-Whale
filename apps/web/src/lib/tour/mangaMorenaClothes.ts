import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanTrunkBuild } from './humanTrunk'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaBodySections } from './mangaBody'

function neckline(x: number, z: number) {
  if (z < 0) return 1.325
  return 1.294 + Math.sin((Math.min(1, Math.abs(x) / 0.115) * Math.PI) / 2) * 0.045
}

export function addMorenaBodice(build: HumanClothesBuild) {
  const { THREE, geometry, figure, profile, materials } = build
  const torso = figure.getObjectByName('torso')!
  ;(torso.children[1] as Mesh).material = materials.skin!
  const { chest, depth } = mangaBodyShape(profile)
  const bodice = new THREE.Mesh(
    geometry(THREE, 'manga:morena-fitted-bodice', () => {
      const points = mangaBodySections(profile)
        .filter(([, y]) => y <= 1.35)
        .map(([r, y]) => [r, y === 1.31 ? 1.25 : y])
      const shape = new THREE.LatheGeometry(
        points.map(([r, y]) => new THREE.Vector2(r * 1.028, y - 1.12)),
        48,
      ).scale(1, 1, depth / chest)
      const positions = shape.getAttribute('position')
      for (let i = 0; i < positions.count; i++)
        if (positions.getY(i) > 0.22)
          positions.setY(i, neckline(positions.getX(i), positions.getZ(i)) - 1.12)
      shape.computeVertexNormals()
      return shape
    }),
    materials.cloth,
  )
  bodice.name = 'morena-fitted-bodice'
  bodice.position.y = 1.12
  figure.add(bodice)
  const rim = new THREE.Mesh(
    geometry(THREE, 'manga:morena-sweetheart-neckline', () => {
      const points = Array.from({ length: 97 }, (_, i) => {
        const angle = (i / 96) * Math.PI * 2,
          x = Math.sin(angle) * chest * 1.028,
          z = Math.cos(angle) * depth * 1.028
        return new THREE.Vector3(x, neckline(x, z) - 1.12, z)
      })
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.002, 5, false)
    }),
    materials.ink,
  )
  rim.name = 'morena-sweetheart-neckline'
  rim.position.y = 1.12
  torso.name = 'torso'
  figure.add(rim)
  // The upper torso is real bare skin all around, rather than a flat pale insert.
  torso.children[1].name = 'morena-decolletage'
}

export function addMorenaSkirt(
  build: Pick<HumanTrunkBuild, 'THREE' | 'geometry' | 'outlined' | 'figure'> & {
    cloth: HumanTrunkBuild['materials']['cloth']
    ink: HumanTrunkBuild['materials']['ink']
    seated: boolean
  },
) {
  const { THREE, geometry, outlined, figure, cloth, ink, seated } = build
  const skirt = outlined({
    THREE,
    geometry: geometry(THREE, `manga:morena-skirt:${seated}`, () => {
      if (seated)
        return new THREE.CapsuleGeometry(0.175, 0.4, 8, 24)
          .rotateX(Math.PI / 2)
          .scale(1, 0.53, 1)
          .translate(0, 0, 0.24)
      return new THREE.LatheGeometry(
        [
          [0.141, 0.18],
          [0.157, 0.23],
          [0.165, 0.4],
          [0.183, 0.65],
          [0.173, 0.78],
          [0.152, 0.85],
        ].map(([r, y]) => new THREE.Vector2(r, y - 0.75)),
        40,
      ).scale(1, 1, 0.83)
    }),
    material: cloth,
    ink,
    scale: 1.025,
  })
  skirt.name = seated ? 'morena-seated-lap' : 'morena-standing-gown'
  skirt.position.y = 0.75
  figure.add(skirt)
}

export function addMorenaSleevesAndBoots(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, materials, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const cap = limbs.arms[i].children[2]
    ;(cap.children[1] as Mesh).material = materials.skin
    const upper = limbs.arms[i].children[0]
    upper.scale.y *= 0.72
    upper.position.y -= 0.044
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:morena-off-shoulder-sleeve-edge',
        () => new THREE.CylinderGeometry(0.043, 0.043, 0.012, 24),
      ),
      glow(profile.jacket, 1),
    )
    cuff.name = 'morena-off-shoulder-sleeve-edge'
    cuff.position.y = -0.09
    limbs.arms[i].add(cuff)
    const boot = new THREE.Mesh(
      geometry(
        THREE,
        'manga:morena-black-boot',
        () =>
          new THREE.LatheGeometry(
            [
              [0.041, -0.37],
              [0.046, -0.29],
              [0.052, -0.18],
              [0.051, -0.11],
            ].map(([r, y]) => new THREE.Vector2(r, y)),
            24,
          ),
      ),
      glow(profile.jacket, 1),
    )
    boot.name = 'morena-black-boot'
    limbs.knees[i].add(boot)
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(profile.jacket, 1)
  }
}
