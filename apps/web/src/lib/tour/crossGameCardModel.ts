import type { BasicApparitionContext } from './apparitionBasicView'

/** The same blue/yellow/red card in the visit and the duel. */
export function buildCrossGameCard(
  THREE: BasicApparitionContext['THREE'],
  options: {
    size: number
    index: number
    glow: BasicApparitionContext['glow']
  },
) {
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(options.size, options.size * 1.5),
    options.glow([0x4d8ff0, 0xf0c94d, 0xe5484d][Math.min(2, options.index)], 0.9),
  )
  face.name = `cross-game-card:${options.index}`
  return face
}
