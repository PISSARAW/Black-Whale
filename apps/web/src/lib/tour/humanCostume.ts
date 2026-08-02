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
  skin?: Material
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

interface MorenaBuild extends CostumeBuild {
  head: Group
}

/** Morena's manga identifiers layered over the shared articulated anatomy. */
export function addMorenaDetails(build: MorenaBuild): void {
  const { THREE, geometry, outlined, figure, head, cloth, ink } = build
  const gown = outlined({
    THREE,
    geometry: geometry(THREE, 'morena:gown', () =>
      new THREE.CylinderGeometry(0.23, 0.39, 1.02, 8),
    ),
    material: cloth,
    ink,
  })
  gown.position.y = 0.66
  figure.add(gown)
  const lap = outlined({
    THREE,
    geometry: geometry(THREE, 'morena:gown-lap', () => new THREE.BoxGeometry(0.45, 0.12, 0.62)),
    material: cloth,
    ink,
  })
  lap.position.set(0, 0.56, 0.25)
  figure.add(lap)

  const neckline = new THREE.Mesh(
    geometry(THREE, 'morena:neckline', () => new THREE.RingGeometry(0.08, 0.17, 8, 1, 0.35, 2.44)),
    ink,
  )
  neckline.position.set(0, 1.39, 0.18)
  neckline.rotation.z = 0.35
  figure.add(neckline)

  const thornBand = new THREE.Mesh(
    geometry(THREE, 'morena:thorn-band', () => new THREE.TorusGeometry(0.2, 0.012, 4, 18)),
    ink,
  )
  thornBand.scale.y = 0.82
  thornBand.rotation.x = Math.PI / 2
  thornBand.position.set(0, 0.075, 0.01)
  head.add(thornBand)
  for (let i = 0; i < 9; i++) {
    const thorn = new THREE.Mesh(
      geometry(THREE, 'morena:thorn', () => new THREE.ConeGeometry(0.014, 0.07, 4)),
      ink,
    )
    const angle = (i / 8 - 0.5) * 2.35
    thorn.position.set(Math.sin(angle) * 0.19, 0.08, Math.cos(angle) * 0.19)
    thorn.rotation.z = Math.sin(angle) * 0.7
    head.add(thorn)
  }

  for (let i = 0; i < 8; i++) {
    const scar = new THREE.Mesh(
      geometry(THREE, 'morena:scar', () => new THREE.PlaneGeometry(0.012, 0.034)),
      ink,
    )
    scar.position.set(0.065 + i * 0.006, 0.14 - i * 0.043, 0.188)
    scar.rotation.z = 0.14
    head.add(scar)
  }

  for (const side of [-1, 1]) {
    const corner = new THREE.Mesh(
      geometry(THREE, 'morena:mouth-corner', () => new THREE.PlaneGeometry(0.045, 0.009)),
      ink,
    )
    corner.name = side < 0 ? 'morena-mouth-left' : 'morena-mouth-right'
    corner.position.set(side * 0.065, -0.09, 0.183)
    corner.rotation.z = side * 0.18
    head.add(corner)

    const blankEye = new THREE.Mesh(
      geometry(THREE, 'morena:blank-eye', () => new THREE.PlaneGeometry(0.075, 0.023)),
      build.skin ?? build.accent,
    )
    blankEye.name = side < 0 ? 'morena-blank-left' : 'morena-blank-right'
    blankEye.position.set(side * 0.062, 0.018, 0.19)
    blankEye.visible = false
    head.add(blankEye)
  }
}
