/**
 * The look of aura left on a seam (`cast/residue.ts`): a few faint wisps
 * hanging where the wall or door gave way, as if the cut were still warm.
 *
 * Deliberately small and dim. It is drawn only for a visitor in Gyo, who is
 * already looking hard; anything brighter would turn a trace into a beacon.
 */
import type { BasicApparitionContext, BasicApparitionParts } from './apparitionBasicView'
import type { Apparition } from './apparitions'

const WISPS = 5

export function residue(
  seen: Apparition,
  { THREE, glow, root }: BasicApparitionContext,
): BasicApparitionParts {
  const material = glow(seen.colour, 0.3)
  for (let index = 0; index < WISPS; index++) {
    const wisp = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.18, 8, 6), material)
    // A loose vertical scatter: residue clings where the seam was, top to bottom.
    const lift = (index / (WISPS - 1) - 0.5) * seen.size * 2.4
    const sway = Math.sin(index * 2.4) * seen.size * 0.35
    wisp.position.set(sway, lift, Math.cos(index * 1.7) * seen.size * 0.2)
    wisp.scale.set(0.7, 1.6, 0.7)
    root.add(wisp)
  }
  return { turns: null }
}
