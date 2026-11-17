import type { ArcadeFighter } from './types'
import { ON_LOOK } from './onAwakening'
import type { Material, Mesh, Object3D } from 'three'

function colourEye(
  node: Object3D | undefined,
  colour: number,
  glow: (colour: number, opacity: number) => Material,
) {
  if (node && 'material' in node) (node as Mesh).material = glow(colour, 1)
}

export function shapeFightEyes(options: {
  root: import('three').Object3D
  fighter: ArcadeFighter
  glow: (colour: number, opacity: number) => import('three').Material
}): void {
  const { root, fighter, glow } = options
  root.traverse((node) => {
    if (!node.name.startsWith('face-eye')) return
    const iris = node.getObjectByName('eye-pupil') ?? node
    if (fighter.nen.on) {
      colourEye(iris, ON_LOOK.iris, glow)
      colourEye(node.getObjectByName('eye-sclera'), ON_LOOK.sclera, glow)
    } else if (fighter.kurapika?.emperorTime) colourEye(iris, 0xef3340, glow)
    if (fighter.parallelEyesClosed) {
      node.scale.y = 0.08
      node.rotation.z = 0
    }
  })
}
