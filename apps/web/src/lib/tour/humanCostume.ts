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
    geometry: geometry(THREE, 'silent:robe', () => new THREE.CylinderGeometry(0.25, 0.43, 1.08, 7)),
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
  seated: boolean
}

/** Morena's manga identifiers layered over the shared articulated anatomy. */
export function addMorenaDetails(build: MorenaBuild): void {
  const { THREE, geometry, outlined, figure, head, cloth, ink, accent, seated } = build
  const skin = build.skin ?? build.accent
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xfff8f4 })
  const hairShade = new THREE.MeshBasicMaterial({ color: 0x9d763c })

  // The reference gives her a softer, slightly wider face than the common
  // narrow profile. Keep the long jaw, but leave enough cheek for the sutured
  // seam and the heavy-lidded eyes to remain separate marks.
  head.scale.x *= 1.08

  if (seated) {
    // The shared torso already supplies the upright part of the dress. Only the
    // cloth folded over her thighs belongs below it while she is at the table;
    // keeping the full standing skirt here made a second, upright silhouette
    // continue through the seated body.
    const lap = outlined({
      THREE,
      geometry: geometry(THREE, 'morena:gown-lap', () => new THREE.BoxGeometry(0.46, 0.1, 0.66)),
      material: cloth,
      ink,
    })
    lap.name = 'morena-seated-lap'
    lap.position.set(0, 0.72, 0.26)
    lap.rotation.x = -0.08
    figure.add(lap)
  } else {
    const gown = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'morena:gown',
        () => new THREE.CylinderGeometry(0.23, 0.39, 1.02, 8),
      ),
      material: cloth,
      ink,
    })
    gown.name = 'morena-standing-gown'
    gown.position.y = 0.66
    figure.add(gown)
  }

  // Bare shoulders and the low, heart-shaped neckline are the strongest cue
  // after the scars. A pale inset is laid over the generic shirt front, then
  // two dark strokes close into the point of the dress.
  const chestShape = new THREE.Shape()
  chestShape.moveTo(-0.14, 0.025)
  chestShape.quadraticCurveTo(-0.08, 0, 0, -0.035)
  chestShape.quadraticCurveTo(0.08, 0, 0.14, 0.025)
  chestShape.lineTo(0.11, 0.075)
  chestShape.lineTo(-0.11, 0.075)
  chestShape.closePath()
  const chest = new THREE.Mesh(
    geometry(THREE, 'morena:decolletage', () => new THREE.ShapeGeometry(chestShape)),
    skin,
  )
  chest.name = 'morena-decolletage'
  chest.position.set(0, 1.35, 0.19)
  figure.add(chest)
  for (const side of [-1, 1]) {
    const neckline = new THREE.Mesh(
      geometry(THREE, 'morena:neckline-stroke', () => new THREE.PlaneGeometry(0.19, 0.014)),
      ink,
    )
    neckline.scale.x = 0.72
    neckline.position.set(side * 0.063, 1.352, 0.195)
    neckline.rotation.z = side * -0.48
    figure.add(neckline)
    const shoulder = new THREE.Mesh(
      geometry(THREE, 'morena:bare-shoulder', () => new THREE.SphereGeometry(0.095, 10, 6)),
      skin,
    )
    shoulder.scale.set(1.15, 0.55, 0.7)
    shoulder.position.set(side * 0.225, 1.34, 0.045)
    figure.add(shoulder)
  }

  // Her hair is a major part of the silhouette: a broad fall to the waist,
  // plus the two long locks that curl in over her chest in the manga panels.
  const hairBack = outlined({
    THREE,
    geometry: geometry(
      THREE,
      'morena:hair-back',
      () => new THREE.CylinderGeometry(0.24, 0.3, 1.12, 10),
    ),
    material: accent,
    ink,
  })
  hairBack.position.set(0, 1.02, -0.16)
  hairBack.scale.z = 0.55
  figure.add(hairBack)

  // Two swept front panels expose the centre part and frame the stitch crown.
  // Fine ochre lines stop the blonde mass reading as two flat yellow columns.
  for (const side of [-1, 1]) {
    const bang = outlined({
      THREE,
      geometry: geometry(THREE, 'morena:bang', () => new THREE.CapsuleGeometry(0.055, 0.2, 4, 8)),
      material: accent,
      ink,
      scale: 1.02,
    })
    bang.position.set(side * 0.06, 1.78, 0.14)
    bang.rotation.z = side * 0.5
    bang.rotation.x = -0.12
    figure.add(bang)
    for (let strandIndex = 0; strandIndex < 3; strandIndex++) {
      const strand = new THREE.Mesh(
        geometry(THREE, 'morena:hair-strand', () => new THREE.PlaneGeometry(0.009, 0.14)),
        hairShade,
      )
      strand.position.set(side * (0.06 + strandIndex * 0.02), 1.78 - strandIndex * 0.012, 0.205)
      strand.rotation.z = side * (0.42 - strandIndex * 0.06)
      figure.add(strand)
    }
  }
  for (const side of [-1, 1]) {
    const lock = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'morena:hair-lock',
        () => new THREE.CapsuleGeometry(0.075, 0.64, 4, 8),
      ),
      material: accent,
      ink,
      scale: 1.025,
    })
    lock.position.set(side * 0.2, 1.17, 0.13)
    lock.rotation.z = side * 0.1
    figure.add(lock)
    const curl = new THREE.Mesh(
      geometry(THREE, 'morena:hair-curl', () => new THREE.TorusGeometry(0.105, 0.045, 5, 12, 3.8)),
      accent,
    )
    curl.position.set(side * 0.17, 1.06, 0.145)
    curl.rotation.z = side < 0 ? -0.5 : Math.PI + 0.5
    figure.add(curl)
    for (let strandIndex = 0; strandIndex < 3; strandIndex++) {
      const strand = new THREE.Mesh(
        geometry(THREE, 'morena:long-hair-strand', () => new THREE.PlaneGeometry(0.011, 0.55)),
        hairShade,
      )
      strand.position.set(side * (0.165 + strandIndex * 0.025), 1.18, 0.207)
      strand.rotation.z = side * (0.04 + strandIndex * 0.035)
      figure.add(strand)
    }
  }

  // Dedicated manga face: long heavy lids, visible pupils, fine brows and
  // lashes. The common figure's simpler marks are hidden for Morena.
  for (const side of [-1, 1]) {
    const eye = new THREE.Group()
    eye.name = side < 0 ? 'face-eye-left' : 'face-eye-right'
    eye.position.set(side * 0.068, 0.015, 0.194)
    const white = new THREE.Mesh(
      geometry(THREE, 'morena:eye-white', () => new THREE.CircleGeometry(0.5, 16)),
      eyeWhite,
    )
    white.scale.set(0.125, 0.042, 1)
    eye.add(white)
    const iris = new THREE.Mesh(
      geometry(THREE, 'morena:iris', () => new THREE.CircleGeometry(0.5, 14)),
      ink,
    )
    iris.scale.set(0.038, 0.04, 1)
    iris.position.z = 0.002
    eye.add(iris)
    const glint = new THREE.Mesh(
      geometry(THREE, 'morena:eye-glint', () => new THREE.CircleGeometry(0.5, 8)),
      eyeWhite,
    )
    glint.scale.setScalar(0.011)
    glint.position.set(side * -0.006, 0.009, 0.004)
    eye.add(glint)
    head.add(eye)

    const lid = new THREE.Mesh(
      geometry(THREE, 'morena:lid', () => new THREE.PlaneGeometry(0.135, 0.012)),
      ink,
    )
    lid.position.set(side * 0.068, 0.043, 0.196)
    lid.rotation.z = side * -0.06
    head.add(lid)
    for (let lashIndex = 0; lashIndex < 3; lashIndex++) {
      const lash = new THREE.Mesh(
        geometry(THREE, 'morena:lash', () => new THREE.PlaneGeometry(0.035, 0.008)),
        ink,
      )
      lash.position.set(side * (0.11 + lashIndex * 0.008), 0.035 - lashIndex * 0.008, 0.197)
      lash.rotation.z = side * (-0.28 - lashIndex * 0.12)
      head.add(lash)
    }

    const lowerLid = new THREE.Mesh(
      geometry(THREE, 'morena:lower-lid', () => new THREE.PlaneGeometry(0.09, 0.007)),
      ink,
    )
    lowerLid.position.set(side * 0.068, -0.008, 0.197)
    lowerLid.rotation.z = side * 0.05
    head.add(lowerLid)

    const brow = new THREE.Mesh(
      geometry(THREE, 'morena:brow', () => new THREE.PlaneGeometry(0.105, 0.01)),
      ink,
    )
    brow.name = side < 0 ? 'face-brow-left' : 'face-brow-right'
    brow.position.set(side * 0.068, 0.092, 0.19)
    brow.rotation.z = side * -0.08
    head.add(brow)
  }

  const mouth = new THREE.Mesh(
    geometry(THREE, 'morena:mouth', () => new THREE.PlaneGeometry(0.105, 0.01)),
    ink,
  )
  mouth.name = 'face-mouth'
  mouth.position.set(0, -0.092, 0.19)
  head.add(mouth)

  const noseBridge = new THREE.Mesh(
    geometry(THREE, 'morena:nose-bridge', () => new THREE.PlaneGeometry(0.008, 0.085)),
    new THREE.MeshBasicMaterial({ color: 0x8f6f67, transparent: true, opacity: 0.55 }),
  )
  noseBridge.position.set(0.004, -0.025, 0.198)
  head.add(noseBridge)
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(
      geometry(THREE, 'morena:nostril', () => new THREE.PlaneGeometry(0.022, 0.007)),
      ink,
    )
    nostril.position.set(side * 0.018, -0.063, 0.199)
    nostril.rotation.z = side * 0.28
    head.add(nostril)
  }

  // A sewn seam, not a thorn crown: thirteen linked dashes follow the
  // hairline, each crossed by a short alternating stitch.
  for (let i = 0; i < 13; i++) {
    const along = i / 12
    const x = -0.16 + along * 0.32
    const arch = 0.116 + (1 - Math.abs(along - 0.5) * 2) * 0.025
    const link = new THREE.Mesh(
      geometry(THREE, 'morena:crown-link', () => new THREE.PlaneGeometry(0.032, 0.009)),
      ink,
    )
    link.name = 'morena-stitch-crown'
    link.position.set(x, arch, 0.183)
    link.rotation.z = (0.5 - along) * 0.32
    head.add(link)
    const stitch = new THREE.Mesh(
      geometry(THREE, 'morena:crown-stitch', () => new THREE.PlaneGeometry(0.009, 0.045)),
      ink,
    )
    stitch.position.set(x, arch, 0.185)
    stitch.rotation.z = i % 2 === 0 ? 0.5 : -0.5
    head.add(stitch)
  }

  // The vertical scar is continuous in the reference, with small horizontal
  // ties from forehead to jaw. It sits on her left (viewer right).
  const scarLine = new THREE.Mesh(
    geometry(THREE, 'morena:scar-line', () => new THREE.PlaneGeometry(0.009, 0.36)),
    ink,
  )
  scarLine.name = 'morena-scar'
  scarLine.position.set(0.075, -0.025, 0.189)
  scarLine.rotation.z = -0.055
  head.add(scarLine)
  for (let i = 0; i < 9; i++) {
    const stitch = new THREE.Mesh(
      geometry(THREE, 'morena:scar-stitch', () => new THREE.PlaneGeometry(0.048, 0.008)),
      ink,
    )
    stitch.position.set(0.067 + i * 0.002, 0.135 - i * 0.041, 0.193)
    stitch.rotation.z = i % 2 === 0 ? 0.18 : -0.12
    head.add(stitch)
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
