import type { Group, Material } from 'three'
import type { Geometry, Outlined, Three } from './silentMajorityParts'

export interface HairBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  ink: Material
  head: Group
}

/** Where the fringe is cut: the top of the opening the mask shows through. */
export const FRINGE = 0.1

const RADIUS = 0.245
/** The fall ends above the chin and stands a little off the head there. */
const HEM = -0.11
const HEM_RADIUS = 0.258
const CROWN = 0.17
/** Half the opening left for the plate, as an angle about the head's axis. */
const OPENING = 0.5

/**
 * The puppet's hair: one black helmet, not a cap with two boards beside it.
 *
 * The drawing gives it a smooth dome, a fringe cut straight across the top of
 * the mask and sides that fall straight to a blunt hem above the chin, wider
 * than the face by half again. It is most of the head's silhouette, which is
 * why it is turned as one shape: a full crown down to the fringe, then a wall
 * round the sides and back that leaves the face open.
 *
 * Both go through `outlined` although hair and ink are the same black. The
 * inverted hull is what closes the inside of the wall: without it the far side
 * of the helmet is a back face, and the room shows through the hair.
 */
export function addSilentMajorityHair({ THREE, geometry, outlined, ink, head }: HairBuild): void {
  const crown = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:hair-crown', () => {
      // Bottom to top, so the faces turn outwards.
      const points = []
      for (let i = 0; i <= 6; i += 1) {
        const angle = (i / 6) * (Math.PI / 2)
        points.push(new THREE.Vector2(Math.cos(angle) * RADIUS, FRINGE + Math.sin(angle) * CROWN))
      }
      return new THREE.LatheGeometry(points, 14)
    }),
    material: ink,
    ink,
    scale: 1.03,
  })
  crown.name = 'silent-hair'
  head.add(crown)

  const fall = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:hair-fall', () => {
      const points = [new THREE.Vector2(HEM_RADIUS, HEM), new THREE.Vector2(RADIUS, FRINGE)]
      return new THREE.LatheGeometry(points, 12, OPENING, Math.PI * 2 - OPENING * 2)
    }),
    material: ink,
    ink,
    scale: 1.03,
  })
  head.add(fall)
}
