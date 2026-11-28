import type { Group, Material } from 'three'
import {
  graded,
  place,
  waveGeometry,
  type Geometry,
  type Kit,
  type Outlined,
  type Three,
} from './silentMajorityParts'
import { addSilentMajoritySleeves } from './silentMajoritySleeves'
import { addSilentMajorityBack } from './silentMajorityBack'

export interface SilentMajorityBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  figure: Group
  /** Shoulder groups, left then right: the sleeves hang from them. */
  arms: Group[]
  /** Knee groups: the socks are worn below them. */
  knees: Group[]
  ink: Material
  accent: Material
  dark: Material
  cloth: Material
  sash: Material
  brass: Material
}

/** The flat front of the bodice, and the plane its ornaments are laid on. */
const CHEST = 0.194
const ORNAMENT = CHEST + 0.004

/**
 * Silent Majority's puppet, dressed as ch. 369–376 draw it.
 *
 * A short tunic over bare legs and high socks, not a robe to the floor: the
 * cloth is screentone, lightest at the chest and black at the hem, and that is
 * a tone per vertex because ADR-005 §3 allows nothing else. Over it, in the
 * order the eye meets them — the crossed collar, a frame of four studs, a
 * ruffled sash, and a pointed tabard on which two serpents are wound.
 */
export function addSilentMajorityCostume(build: SilentMajorityBuild): void {
  addTunic(build)
  addCollar(build)
  addStudFrame(build)
  addSash(build)
  addTabard(build)
  addSocks(build)
  addSilentMajorityBack(build)
  const { THREE, geometry, outlined, arms, cloth, ink, accent } = build
  addSilentMajoritySleeves({ THREE, geometry, outlined, arms, cloth, ink, pale: accent })
}

function addTunic({ THREE, geometry, outlined, figure, cloth, dark, ink }: SilentMajorityBuild) {
  // Six sides with a face forward, so the ornaments lie flat on the chest and
  // the tabard hangs against a plane rather than a curve.
  const bodice = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:bodice', () => {
      const made = new THREE.CylinderGeometry(0.235, 0.235, 0.38, 6)
      made.rotateY(Math.PI / 6)
      return graded(THREE, made, [1, 0.82])
    }),
    material: cloth,
    ink,
    scale: 1.03,
  })
  bodice.name = 'silent-bodice'
  bodice.scale.set(0.9, 1, 0.95)
  bodice.position.y = 1.28
  figure.add(bodice)

  const skirt = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:skirt', () => {
      const made = new THREE.CylinderGeometry(0.225, 0.29, 0.59, 6)
      made.rotateY(Math.PI / 6)
      return graded(THREE, made, [0.82, 0.26])
    }),
    material: cloth,
    ink,
    scale: 1.03,
  })
  skirt.name = 'silent-skirt'
  skirt.scale.set(0.9, 1, 0.8)
  skirt.position.y = 0.785
  figure.add(skirt)

  // Narrow at the top to leave a gap between the scarf and each curled tip.
  const scarf = new THREE.Mesh(
    geometry(THREE, 'silent:scarf', () => new THREE.CylinderGeometry(0.071, 0.105, 0.12, 12)),
    dark,
  )
  scarf.position.y = 1.53
  figure.add(scarf)
}

function addCollar({ THREE, geometry, figure, accent, ink }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  // Two short bands crossed high, under the chin, between the shoulder studs.
  for (const side of [-1, 1]) {
    const band = place(kit, figure, {
      key: 'silent:collar-band',
      make: () => new THREE.PlaneGeometry(0.068, 0.225),
      material: ink,
      at: [side * 0.008, 1.45, ORNAMENT + 0.004 + (side + 1) * 0.001],
      turn: side * -0.78,
    })
    place(kit, band, {
      key: 'silent:collar-inlay',
      make: () => new THREE.PlaneGeometry(0.059, 0.216),
      material: accent,
      at: [0, 0, 0.001],
    })
  }
}

function addStudFrame({ THREE, geometry, figure, accent, brass, ink }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  // Two straps from the shoulders to the sash, a stud at each end, and one
  // rail between the lower pair: the upper pair is joined by the collar.
  const half = 0.096
  const rows = [1.45, 1.285]
  place(kit, figure, {
    key: 'silent:frame-rail',
    make: () => new THREE.PlaneGeometry(half * 2, 0.016),
    material: brass,
    at: [0, rows[1], ORNAMENT],
  })
  for (const side of [-1, 1]) {
    place(kit, figure, {
      key: 'silent:frame-post',
      make: () => new THREE.PlaneGeometry(0.016, rows[0] - rows[1]),
      material: brass,
      at: [side * half, (rows[0] + rows[1]) / 2, ORNAMENT],
    })
    for (const y of rows) addStud(kit, { figure, accent, brass, ink, at: [side * half, y] })
  }
}

interface Stud {
  figure: Group
  accent: Material
  brass: Material
  ink: Material
  at: [x: number, y: number]
}

/** A dark cabochon in a pale setting, with the two glints the panels give it. */
function addStud(kit: Kit, { figure, accent, brass, ink, at }: Stud): void {
  const disc = () => new kit.THREE.CircleGeometry(0.5, 14)
  const [x, y] = at
  place(kit, figure, {
    key: 'silent:stud',
    make: disc,
    material: brass,
    at: [x, y, ORNAMENT + 0.002],
    scale: [0.066, 0.044],
  })
  place(kit, figure, {
    key: 'silent:stud',
    make: disc,
    material: ink,
    at: [x, y, ORNAMENT + 0.004],
    scale: [0.052, 0.031],
  })
  for (const glint of [-1, 1]) {
    place(kit, figure, {
      key: 'silent:stud',
      make: disc,
      material: accent,
      at: [x + glint * 0.011, y + 0.003, ORNAMENT + 0.006],
      scale: [0.008, 0.008],
    })
  }
}

function addSash({
  THREE,
  geometry,
  outlined,
  figure,
  sash: burgundy,
  ink,
}: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  const sash = new THREE.Group()
  sash.name = 'silent-sash'
  for (const y of [1.115, 1.2]) {
    const band = outlined({
      THREE,
      geometry: geometry(THREE, 'silent:sash-band', () => {
        const made = new THREE.CylinderGeometry(0.248, 0.248, 0.082, 6)
        made.rotateY(Math.PI / 6)
        return graded(THREE, made, [1, 0.72])
      }),
      material: burgundy,
      ink,
      scale: 1.04,
    })
    band.scale.set(0.9, 1, 0.95)
    band.position.y = y
    sash.add(band)
    addSashFolds(kit, { band: sash, ink, y })
  }
  figure.add(sash)
}

function addSashFolds(kit: Kit, { band, ink, y }: { band: Group; ink: Material; y: number }) {
  const { THREE } = kit
  const front = 0.248 * Math.cos(Math.PI / 6) * 0.95 + 0.008
  for (const edge of [-1, 1]) {
    place(kit, band, {
      key: 'silent:sash-gathered-edge',
      make: () =>
        waveGeometry(THREE, { length: 0.23, sway: 0.0045, periods: 6, thickness: 0.0026 }).rotateZ(
          Math.PI / 2,
        ),
      material: ink,
      at: [-0.115, y + edge * 0.027, front],
    })
  }
  for (let index = -3; index <= 3; index += 1) {
    place(kit, band, {
      key: 'silent:sash-fold',
      make: () =>
        waveGeometry(THREE, { length: 0.039, sway: 0.0045, periods: 0.7, thickness: 0.0025 }),
      material: ink,
      at: [index * 0.032, y + 0.02, front],
      turn: index * 0.12,
    })
  }
}

function addTabard({ THREE, geometry, figure, accent, ink }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  const banner = (halfWidth: number, drop: number) => () => {
    const outline = new THREE.Shape()
    outline.moveTo(-halfWidth, 0)
    outline.lineTo(halfWidth, 0)
    outline.lineTo(halfWidth, -drop)
    outline.lineTo(0, -drop - halfWidth * 0.75)
    outline.lineTo(-halfWidth, -drop)
    outline.closePath()
    return new THREE.ShapeGeometry(outline)
  }
  // Hung from under the sash and leaning with the skirt it lies on.
  const tabard = new THREE.Group()
  tabard.name = 'silent-tabard'
  tabard.position.set(0, 1.08, 0.17)
  tabard.rotation.x = -0.095
  figure.add(tabard)
  place(kit, tabard, {
    key: 'silent:tabard-border',
    make: banner(0.1, 0.39),
    material: accent,
    at: [0, 0, 0],
  })
  place(kit, tabard, {
    key: 'silent:tabard-field',
    make: banner(0.087, 0.382),
    material: ink,
    at: [0, 0, 0.002],
  })
  // Two serpents wound round one another, head up, parting at the top.
  for (const side of [-1, 1]) {
    place(kit, tabard, {
      key: `silent:tabard-serpent:${side}`,
      make: () =>
        waveGeometry(THREE, {
          length: 0.34,
          sway: 0.024,
          periods: 2.85,
          thickness: 0.0065,
          mirrored: side > 0,
        }),
      material: accent,
      at: [0, -0.07, 0.005],
    })
    place(kit, tabard, {
      key: 'silent:tabard-neck',
      make: () => new THREE.PlaneGeometry(0.012, 0.045),
      material: accent,
      at: [side * 0.018, -0.052, 0.005],
      turn: side * -0.75,
    })
    place(kit, tabard, {
      key: 'silent:tabard-head',
      make: () => new THREE.CircleGeometry(0.014, 10),
      material: accent,
      at: [side * 0.036, -0.036, 0.005],
    })
  }
}

function addSocks({ THREE, geometry, knees, dark }: SilentMajorityBuild): void {
  // To just under the knee, over the shin and its contour; the thigh above
  // stays bare, which is the pale gap the drawing leaves below the hem.
  for (const knee of knees) {
    const sock = new THREE.Mesh(
      geometry(THREE, 'silent:sock', () => new THREE.CylinderGeometry(0.065, 0.05, 0.481, 14)),
      dark,
    )
    sock.name = 'silent-sock'
    sock.position.y = -0.182
    knee.add(sock)
  }
}
