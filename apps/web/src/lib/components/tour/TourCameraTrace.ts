import type { Camera } from 'three'
import type { Vec2 } from '$lib/tour/types'

export const TOUR_CAMERA_TRACE_ATTRIBUTE = 'data-observe-tour-camera'
export const TOUR_CAMERA_FRAME_EVENT = 'tour-camera-frame'

interface TourFrameContext {
  tierId: string
  spaceId: string | null
  ground: number
  onSpiral: boolean
}

export interface TourCameraSample extends TourFrameContext {
  at: Vec2
  yaw: number
  position: readonly [number, number, number]
  quaternion: readonly [number, number, number, number]
}

/** Publish a pose only for a canvas with an explicit observer, after its main render. */
export function traceTourCamera(
  canvas: HTMLCanvasElement,
  frame: { camera: Camera; at: Vec2; yaw: number },
  context: TourFrameContext,
): void {
  const { camera, at, yaw } = frame
  const { x, y, z } = camera.position
  const orientation = camera.quaternion
  const detail: TourCameraSample = {
    ...context,
    at: [...at],
    yaw,
    position: [x, y, z],
    quaternion: [orientation.x, orientation.y, orientation.z, orientation.w],
  }
  canvas.dispatchEvent(new CustomEvent(TOUR_CAMERA_FRAME_EVENT, { detail }))
}
