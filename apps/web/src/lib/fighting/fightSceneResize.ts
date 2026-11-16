import type { PerspectiveCamera, WebGLRenderer } from 'three'
import type { StagePost } from './stagePost'

/** Canvas resize is independent of poses and input prediction. */
export function resizeFightCanvas(options: {
  canvas: HTMLCanvasElement | undefined
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  post: StagePost | null
}): void {
  const { canvas, renderer, camera, post } = options
  if (!canvas) return
  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
  renderer.setPixelRatio(ratio)
  renderer.setSize(width, height, false)
  post?.resize(width, height, ratio)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
