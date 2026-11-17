import type { WebGLRenderer } from 'three'

/** A floor reflection redraws the already posed scene; only its camera changes. */
export function reuseFightRenderMatrices(renderer: WebGLRenderer) {
  const render = renderer.render.bind(renderer)
  let depth = 0
  renderer.render = (scene, camera) => {
    const automatic = scene.matrixWorldAutoUpdate
    if (depth > 0 && scene.userData.fightView) scene.matrixWorldAutoUpdate = false
    depth++
    try {
      render(scene, camera)
    } finally {
      depth--
      scene.matrixWorldAutoUpdate = automatic
    }
  }
}
