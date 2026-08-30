import type { TourRenderContext } from './TourRenderContext'

export class TourCameraController {
  update(ctx: TourRenderContext) {
    ctx.camera.position.set(
      ctx.pointer[0],
      ctx.ground + (ctx.authoredEyeHeight ?? ctx.eyeHeight),
      ctx.pointer[1],
    )
    ctx.camera.rotation.set(0, 0, 0)
    ctx.camera.rotateY(ctx.yaw)
    ctx.camera.rotateX(ctx.pitch)
  }
}
