import type { ArcadeFighter } from './types'

export function shapeFightEyes(options: {
  root: import('three').Object3D
  fighter: ArcadeFighter
  glow: (colour: number, opacity: number) => import('three').Material
}): void {
  const { root, fighter, glow } = options
  root.traverse((node) => {
    if (!node.name.startsWith('face-eye')) return
    if (fighter.kurapika?.emperorTime && 'material' in node)
      (node as import('three').Mesh).material = glow(0xef3340, 1)
    if (fighter.parallelEyesClosed) {
      node.scale.y = 0.08
      node.rotation.z = 0
    }
  })
}
