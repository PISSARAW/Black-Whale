import type { Group, Material } from 'three'
import {
  place,
  voluteGeometry,
  type Geometry,
  type Kit,
  type Outlined,
  type Three,
} from './silentMajorityParts'

export interface SleeveBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  arms: Group[]
  cloth: Material
  ink: Material
  /** Crests and fists: the one pale value of the costume. */
  pale: Material
}

/** Half the sleeve's depth, and so where its crests are laid. */
const FRONT = 0.1
const CREST = FRONT + 0.004

/**
 * The sleeves: a kimono's, hung from the shoulder and falling past the fist.
 *
 * They ride the arm group rather than the figure so that they sway with it, and
 * they swallow the arm whole — what the drawing shows of a limb is a pale fist
 * at the inner edge and three crests wound down the cloth.
 */
export function addSilentMajoritySleeves(build: SleeveBuild): void {
  const { THREE, geometry, outlined, arms, cloth, ink } = build
  const kit: Kit = { THREE, geometry }
  arms.forEach((arm, index) => {
    const side = index === 0 ? -1 : 1
    const sleeve = outlined({
      THREE,
      geometry: geometry(THREE, 'silent:sleeve', () => {
        const outline = new THREE.Shape()
        // From the root of the neck, down a sloping shoulder, then out and
        // down to a cuff wider than the shoulder it hangs from.
        outline.moveTo(-0.2, 0.5)
        outline.quadraticCurveTo(-0.04, 0.5, 0.005, 0.4)
        outline.quadraticCurveTo(0.034, 0.36, 0.036, 0.3)
        outline.lineTo(0.09, -0.48)
        outline.lineTo(-0.095, -0.48)
        outline.lineTo(-0.095, 0.2)
        outline.closePath()
        const made = new THREE.ExtrudeGeometry(outline, { depth: FRONT * 2, bevelEnabled: false })
        made.translate(0, 0, -FRONT)
        return made
      }),
      material: cloth,
      ink,
      scale: 1.03,
    })
    sleeve.name = side < 0 ? 'silent-sleeve-left' : 'silent-sleeve-right'
    // Drawn once for the right arm and mirrored: the flare is always outward.
    sleeve.scale.x = side
    sleeve.position.set(side * 0.02, -0.34, 0)
    arm.add(sleeve)
    addCrests(kit, build, sleeve)
    addFist(build, sleeve)
  })
}

function addCrests(kit: Kit, { THREE, pale }: SleeveBuild, sleeve: Group): void {
  // Shoulder and cuff carry the two large volutes; they wind opposite ways.
  place(kit, sleeve, {
    key: 'silent:crest-volute-shoulder',
    make: () => voluteGeometry(THREE, { radius: 0.06, turns: 2.6, thickness: 0.008 }),
    material: pale,
    at: [-0.03, 0.25, CREST],
  })
  place(kit, sleeve, {
    key: 'silent:crest-volute-cuff',
    make: () => voluteGeometry(THREE, { radius: 0.08, turns: 2.6, thickness: 0.0085 }),
    material: pale,
    at: [-0.004, -0.375, CREST],
    turn: Math.PI,
    scale: [-1, 1],
  })
  // Between them, the flames the drawing lets fall from the shoulder: hooks,
  // each a little lower and turned a little further than the last.
  const hooks: Array<[x: number, y: number, turn: number]> = [
    [-0.055, 0.14, 0.4],
    [0.005, 0.115, 2.2],
    [0.03, -0.02, -0.6],
    [0.02, -0.13, 2.9],
  ]
  for (const [x, y, turn] of hooks) {
    place(kit, sleeve, {
      key: 'silent:crest-hook',
      make: () => voluteGeometry(THREE, { radius: 0.04, turns: 0.9, thickness: 0.009 }),
      material: pale,
      at: [x, y, CREST],
      turn,
    })
  }
  place(kit, sleeve, {
    key: 'silent:crest-eye',
    make: () => new THREE.RingGeometry(0.014, 0.027, 14),
    material: pale,
    at: [0.035, 0.045, CREST],
  })
}

function addFist({ THREE, geometry, outlined, ink, pale }: SleeveBuild, sleeve: Group): void {
  const fist = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:fist', () => new THREE.SphereGeometry(0.052, 8, 6)),
    material: pale,
    ink,
    scale: 1.09,
  })
  fist.name = 'silent-fist'
  fist.scale.set(0.9, 1.05, 0.8)
  fist.position.set(-0.05, -0.25, FRONT - 0.005)
  sleeve.add(fist)
}
