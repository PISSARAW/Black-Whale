import type { PerspectiveCamera, Scene, Vector4, WebGLRenderer } from 'three'
import { drawVictoryFrame } from './victory/draw'
import { isBeyondCurse } from './victory/beyondCurseSelection'
import { tserriednichSplit } from './victory/tserriednichTiming'

type DrawOptions = Parameters<typeof drawVictoryFrame>[0]

/** Keep cinematic rendering and its temporary model restoration at a single draw boundary. */
export function drawFightScene(
  options: Omit<DrawOptions, 'input'> &
    DrawOptions['input'] & {
      renderer: WebGLRenderer
      scene: Scene
      camera: PerspectiveCamera
      THREE: { Vector4: typeof Vector4 }
    },
) {
  const { victory, draw, failed, renderer, scene, camera, THREE, ...input } = options
  const { frame } = input
  if (
    !frame?.active ||
    frame.fighter !== 'tserriednich' ||
    isBeyondCurse(frame.variant) ||
    !tserriednichSplit(frame.elapsed)
  ) {
    drawVictoryFrame({ victory, input, draw, failed })
    return
  }

  const viewport = renderer.getViewport(new THREE.Vector4())
  const scissor = renderer.getScissor(new THREE.Vector4())
  const scissorTest = renderer.getScissorTest()
  const aspect = camera.aspect
  const { x, y, z: width, w: height } = viewport
  const stacked = aspect <= 1
  const halfWidth = Math.floor(width / 2)
  const halfHeight = Math.floor(height / 2)
  const perceived = stacked
    ? new THREE.Vector4(x, y + halfHeight, width, height - halfHeight)
    : new THREE.Vector4(x, y, halfWidth, height)
  const real = stacked
    ? new THREE.Vector4(x, y, width, halfHeight)
    : new THREE.Vector4(x + halfWidth, y, width - halfWidth, height)

  try {
    renderer.setScissorTest(true)
    camera.aspect = stacked ? aspect * 2 : aspect / 2
    camera.updateProjectionMatrix()
    for (const [bounds, futurePerspective] of [
      [perceived, 'perceived'],
      [real, 'real'],
    ] as const) {
      renderer.setViewport(bounds)
      renderer.setScissor(bounds)
      drawVictoryFrame({
        victory,
        input: { ...input, futurePerspective },
        draw: () => renderer.render(scene, camera),
        failed,
      })
    }
  } finally {
    renderer.setViewport(viewport)
    renderer.setScissor(scissor)
    renderer.setScissorTest(scissorTest)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  }
}
