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
  // The sleeves take the opaque black, not the jacket's: a cloth that blends is
  // sorted against the aura shell round the body and loses to it from the side.
  const { THREE, geometry, outlined, arms, dark, ink, accent } = build
  addSilentMajoritySleeves({ THREE, geometry, outlined, arms, cloth: dark, ink, pale: accent })
}

function addTunic({ THREE, geometry, outlined, figure, accent, dark, ink }: SilentMajorityBuild) {
  // Six sides with a face forward, so the ornaments lie flat on the chest and
  // the tabard hangs against a plane rather than a curve.
  const bodice = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:bodice', () => {
      const made = new THREE.CylinderGeometry(0.235, 0.235, 0.38, 6)
      made.rotateY(Math.PI / 6)
      return graded(THREE, made, [0.5, 0.42])
    }),
    material: accent,
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
      const made = new THREE.CylinderGeometry(0.225, 0.31, 0.62, 6)
      made.rotateY(Math.PI / 6)
      return graded(THREE, made, [0.42, 0.07])
    }),
    material: accent,
    ink,
    scale: 1.03,
  })
  skirt.name = 'silent-skirt'
  skirt.scale.set(0.9, 1, 0.8)
  skirt.position.y = 0.77
  figure.add(skirt)

  // The neck is wrapped: nothing pale shows between the plate and the collar.
  const scarf = new THREE.Mesh(
    geometry(THREE, 'silent:scarf', () => new THREE.CylinderGeometry(0.095, 0.115, 0.12, 8)),
    dark,
  )
  scarf.position.y = 1.53
  figure.add(scarf)
}

function addCollar({ THREE, geometry, figure, accent }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  // Two short bands crossed high, under the chin, between the shoulder studs.
  for (const side of [-1, 1]) {
    place(kit, figure, {
      key: 'silent:collar-band',
      make: () => new THREE.PlaneGeometry(0.068, 0.2),
      material: accent,
      at: [side * 0.008, 1.43, ORNAMENT + 0.004 + (side + 1) * 0.001],
      turn: side * -0.78,
    })
  }
}

function addStudFrame({ THREE, geometry, figure, accent, ink }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  // Two straps from the shoulders to the sash, a stud at each end, and one
  // rail between the lower pair: the upper pair is joined by the collar.
  const half = 0.096
  const rows = [1.45, 1.285]
  place(kit, figure, {
    key: 'silent:frame-rail',
    make: () => new THREE.PlaneGeometry(half * 2, 0.016),
    material: accent,
    at: [0, rows[1], ORNAMENT],
  })
  for (const side of [-1, 1]) {
    place(kit, figure, {
      key: 'silent:frame-post',
      make: () => new THREE.PlaneGeometry(0.016, rows[0] - rows[1]),
      material: accent,
      at: [side * half, (rows[0] + rows[1]) / 2, ORNAMENT],
    })
    for (const y of rows) addStud(kit, { figure, accent, ink, at: [side * half, y] })
  }
}

interface Stud {
  figure: Group
  accent: Material
  ink: Material
  at: [x: number, y: number]
}

/** A dark cabochon in a pale setting, with the two glints the panels give it. */
function addStud(kit: Kit, { figure, accent, ink, at }: Stud): void {
  const disc = () => new kit.THREE.CircleGeometry(0.5, 14)
  const [x, y] = at
  place(kit, figure, {
    key: 'silent:stud',
    make: disc,
    material: accent,
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

function addSash({ THREE, geometry, outlined, figure, accent, ink }: SilentMajorityBuild): void {
  const kit: Kit = { THREE, geometry }
  const sash = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:sash', () => {
      const made = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 6)
      made.rotateY(Math.PI / 6)
      return graded(THREE, made, [1, 0.9])
    }),
    material: accent,
    ink,
    scale: 1.03,
  })
  sash.name = 'silent-sash'
  sash.scale.set(0.9, 1, 0.95)
  sash.position.y = 1.155
  figure.add(sash)
  const front = 0.25 * Math.cos(Math.PI / 6) * 0.95 + 0.004

  // The gathered upper edge: a row of beads, which is what a ruffle is once it
  // is two values and a contour.
  for (let i = -3; i <= 3; i += 1) {
    // Large enough to scallop the edge: seven lobes across the flat of the sash.
    const bead = outlined({
      THREE,
      geometry: geometry(THREE, 'silent:sash-ruffle', () => new THREE.SphereGeometry(0.027, 8, 5)),
      material: accent,
      ink,
      scale: 1.1,
    })
    bead.position.set(i * 0.035, 1.244, front - 0.014)
    figure.add(bead)
  }
  // Its folds are drawn as waves, one under the other.
  for (const y of [1.2, 1.16, 1.12]) {
    place(kit, figure, {
      key: 'silent:sash-fold',
      make: () => {
        const made = waveGeometry(THREE, { length: 0.2, sway: 0.009, periods: 3, thickness: 0.004 })
        made.rotateZ(Math.PI / 2)
        return made
      },
      material: ink,
      at: [-0.1, y, front],
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
          periods: 5.25,
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
      geometry(THREE, 'silent:sock', () => new THREE.CapsuleGeometry(0.066, 0.33, 3, 8)),
      dark,
    )
    sock.name = 'silent-sock'
    sock.position.y = -0.21
    knee.add(sock)
  }
}
