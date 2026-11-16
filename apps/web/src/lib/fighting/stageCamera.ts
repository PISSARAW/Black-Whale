import type { FightScenery } from './stageKit'

interface CameraFrame {
  x: number
  y: number
  z: number
  lookY: number
}

/** Keep the fighters clear while revealing the suspension coils above their cylinders. */
export function sceneryCameraFrame(
  frame: CameraFrame,
  scenery: Pick<FightScenery, 'framing'>,
): CameraFrame {
  if (!scenery.framing) return frame
  const lookY = Math.max(frame.lookY, scenery.framing.lookY)
  return {
    ...frame,
    z: Math.max(frame.z, scenery.framing.minimumDistance),
    lookY,
    y: lookY + frame.y - frame.lookY,
  }
}
