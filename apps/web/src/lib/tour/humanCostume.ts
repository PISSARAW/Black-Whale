import type { BufferGeometry, Group, Material, MeshBasicMaterial } from 'three'

type Three = typeof import('three')
type Geometry = (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry
type Outlined = (shape: {
  THREE: Three
  geometry: BufferGeometry
  material: Material
  ink: Material
  scale?: number
}) => Group

interface MaskBuild {
  THREE: Three
  geometry: Geometry
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  ink: Material
  head: Group
}

export function addSilentMajorityMask(build: MaskBuild): void {
  const { THREE, geometry, glow, ink, head } = build
  const mask = new THREE.Mesh(
    geometry(THREE, 'silent:mask', () => new THREE.PlaneGeometry(0.27, 0.4)),
    glow(0xf0ece4, 1),
  )
  mask.position.z = 0.205
  head.add(mask)
  const stem = new THREE.Mesh(
    geometry(THREE, 'silent:mask-stem', () => new THREE.PlaneGeometry(0.055, 0.34)),
    ink,
  )
  stem.position.set(0, 0.005, 0.208)
  head.add(stem)
  const crown = new THREE.Mesh(
    geometry(THREE, 'silent:mask-crown', () => new THREE.PlaneGeometry(0.24, 0.055)),
    ink,
  )
  crown.position.set(0, 0.14, 0.209)
  head.add(crown)
  for (let i = -3; i <= 3; i++) {
    const tooth = new THREE.Mesh(
      geometry(THREE, 'silent:mask-tooth', () => new THREE.PlaneGeometry(0.018, 0.075)),
      ink,
    )
    tooth.position.set(i * 0.032, -0.105, 0.21)
    head.add(tooth)
  }
}

interface CostumeBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  figure: Group
  cloth: Material
  ink: Material
  accent: Material
  dark: Material
}

export function addSilentMajorityCostume(build: CostumeBuild): void {
  const { THREE, geometry, outlined, figure, cloth, ink, accent, dark } = build
  const robe = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:robe', () =>
      new THREE.CylinderGeometry(0.25, 0.43, 1.08, 7),
    ),
    material: cloth,
    ink,
  })
  robe.position.y = 0.62
  figure.add(robe)
  const obi = new THREE.Mesh(
    geometry(THREE, 'silent:obi', () => new THREE.BoxGeometry(0.56, 0.25, 0.3)),
    accent,
  )
  obi.position.set(0, 0.88, 0.02)
  figure.add(obi)
  const apron = new THREE.Mesh(
    geometry(THREE, 'silent:apron', () => new THREE.PlaneGeometry(0.3, 0.68)),
    cloth,
  )
  apron.position.set(0, 0.52, 0.285)
  figure.add(apron)
  for (let i = 0; i < 5; i++) {
    const knot = new THREE.Mesh(
      geometry(THREE, 'silent:knot', () => new THREE.TorusGeometry(0.055, 0.012, 4, 10)),
      accent,
    )
    knot.position.set(0, 0.28 + i * 0.11, 0.294)
    knot.rotation.z = i % 2 === 0 ? 0.65 : -0.65
    figure.add(knot)
  }
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(
      geometry(THREE, 'silent:sleeve', () => new THREE.BoxGeometry(0.3, 0.72, 0.22)),
      cloth,
    )
    sleeve.position.set(side * 0.38, 1.02, 0)
    sleeve.rotation.z = side * -0.08
    figure.add(sleeve)
    for (let i = 0; i < 3; i++) {
      const crest = new THREE.Mesh(
        geometry(THREE, 'silent:crest', () => new THREE.TorusGeometry(0.06, 0.012, 4, 10)),
        accent,
      )
      crest.position.set(side * 0.38, 0.82 + i * 0.2, 0.116)
      figure.add(crest)
    }
    const boot = new THREE.Mesh(
      geometry(THREE, 'silent:boot', () => new THREE.BoxGeometry(0.15, 0.48, 0.17)),
      dark,
    )
    boot.position.set(side * 0.13, 0.27, 0.02)
    figure.add(boot)
  }
}
