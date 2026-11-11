/**
 * Ren's flames, rising.
 *
 * In the anime a raised aura goes *up*: tongues leave the body, climb, thin and
 * vanish, and new ones take their place. The walk's flames used to orbit the
 * body at fixed heights with a short bob, which read as a ring of fire turning
 * around a guard rather than aura pouring off them. Here each tongue starts at
 * the body, climbs past the head while it fades, and starts again — the orbit
 * is kept only as a slow drift so the twelve do not line up.
 */
import type { Group, Mesh } from 'three'
import type { HumanAuraBuild } from './humanAura'

type FlameBuild = Pick<HumanAuraBuild, 'THREE' | 'geometry' | 'glow'> & {
  colour: number
  figure: Group
}

const COUNT = 12
/** How high a tongue climbs over one life, in body units. */
const CLIMB = 1.15
/** Where a tongue is born: the hips, so it rises along the whole trunk. */
const BORN_AT = 0.55

export function buildRenFlames({ THREE, geometry, glow, colour, figure }: FlameBuild): Mesh[] {
  const flames: Mesh[] = []
  for (let index = 0; index < COUNT; index++) {
    const flame = new THREE.Mesh(
      geometry(
        THREE,
        `aura:ren-flame:${index % 3}`,
        () => new THREE.ConeGeometry(0.08 + (index % 3) * 0.02, 0.5, 7),
      ),
      // Shared with every tongue of this colour aboard, so it is never faded:
      // each tongue fades by shrinking, on its own clock. See `placeRenFlame`.
      glow(colour, 0.24),
    )
    flame.name = 'nen-ren-flame'
    flame.userData.auraAngle = (index / COUNT) * Math.PI * 2
    flame.userData.auraLife = index / COUNT
    flames.push(flame)
    figure.add(flame)
  }
  return flames
}

/** One frame of one tongue. `life` runs 0 → 1 from birth to vanishing. */
export function placeRenFlame(flame: Mesh, seconds: number, index: number) {
  const life = (seconds * (0.55 + (index % 3) * 0.08) + Number(flame.userData.auraLife)) % 1
  const angle = Number(flame.userData.auraAngle) + seconds * 0.08
  // Close to the body at birth, drifting out a little as it climbs.
  const radius = 0.34 + life * 0.16 + Math.sin(seconds * 2.3 + index) * 0.03
  flame.position.set(Math.cos(angle) * radius, BORN_AT + life * CLIMB, Math.sin(angle) * radius)
  // Upright, leaning a touch outward, thinning as it goes, and grown in over the
  // first fifth of its life then shrunk away over the rest — the fade, done in
  // size because the material is shared.
  flame.rotation.set(Math.sin(angle) * 0.18, 0, Math.cos(angle) * -0.18)
  const fade = Math.min(1, life * 5) * (1 - life) * 1.25
  const thin = (1 - life * 0.55) * fade
  flame.scale.set(thin, (0.8 + life * 0.6) * fade, thin)
}
