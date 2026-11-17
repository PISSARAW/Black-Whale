import type { PerspectiveCamera, WebGLRenderer } from 'three'
import type { StagePost } from './stagePost'
import { fightPixelRatio, type FightGraphics } from './fightGraphics'

/** Canvas resize is independent of poses and input prediction. */
export function resizeFightCanvas(options: {
  canvas: HTMLCanvasElement | undefined
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  post: StagePost | null
  graphics?: FightGraphics
}): void {
  const { canvas, renderer, camera, post } = options
  if (!canvas) return
  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  const ratio = fightPixelRatio(window.devicePixelRatio, options.graphics)
  renderer.setPixelRatio(ratio)
  renderer.setSize(width, height, false)
  post?.resize(width, height, ratio)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
