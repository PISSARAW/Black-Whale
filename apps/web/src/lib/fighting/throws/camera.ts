import { Vector3, type Object3D, type PerspectiveCamera } from 'three'
import type { IntroLandmarkBounds } from '../presentation/introLandmarks'
import { introInFrame } from '../presentation/introFreeCamera'
import { throwDetailAnchors } from './cameraAnchors'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightSide } from '../types'
import { throwPerformance } from './catalogue'
import { sampleThrowCamera, throwSmooth } from './sample'

type Models = Record<FightSide, { model: { turns: Object3D } }>
export interface ThrowShot {
  beat: 'grip-detail' | 'turn-orbit' | 'impact' | 'aftermath'
  focus: Vector3
  yaw: number
  height: number
  radius: number
  bounds: IntroLandmarkBounds
}

/** Show the mechanism, read the bodies, land the impact, hold the result. */
export function directedThrowShot(options: {
  frame: ThrowCinematicFrame
  bounds: IntroLandmarkBounds
  models?: Models
  baseRadius: number
  minimumDistance?: number
}): ThrowShot {
  const { frame, bounds, models, baseRadius } = options
  const t = frame.age / frame.duration
  const centre = (bounds.left + bounds.right) / 2
  const performance = throwPerformance(frame.performance)
  const lens = performance ? sampleThrowCamera(performance, t) : [0.35, 2.4, 1.15, 0.8]
  const shot: ThrowShot = {
    beat: 'turn-orbit',
    focus: new Vector3(centre, lens[2], 0),
    yaw: lens[0] * frame.facing,
    height: lens[1],
    radius: Math.max(3.8, options.minimumDistance ?? 0, baseRadius * lens[3]),
    bounds,
  }
  if (t < 0.2) return gripDetail(shot, { frame, models })
  if (t >= 0.82) return aftermath(shot, frame)
  if (t >= 0.57) return impactShot(shot, frame)
  shot.yaw += (throwSmooth((t - 0.2) / 0.37) - 0.5) * 0.35 * frame.facing
  shot.focus.y = Math.max(1.1, (bounds.top + bounds.bottom) * 0.48)
  return shot
}

function gripDetail(shot: ThrowShot, context: { frame: ThrowCinematicFrame; models?: Models }) {
  const { frame, models } = context
  const actor = models?.[frame.attacker].model.turns
  const victim = models?.[frame.victim].model.turns
  const anchors = throwDetailAnchors(actor, victim, frame)
  if (!anchors) return shot
  const { from, to, yaw } = anchors
  const focus = from.clone().lerp(to, 0.45)
  const width = Math.max(0.45, Math.abs(from.x - to.x) * 0.65)
  return {
    ...shot,
    beat: 'grip-detail' as const,
    focus,
    yaw: yaw * frame.facing,
    height: focus.y + 0.35,
    radius: 2.5,
    bounds: {
      left: focus.x - width,
      right: focus.x + width,
      bottom: Math.max(0.02, focus.y - 0.5),
      top: focus.y + 0.55,
      near: focus.z - 0.32,
      far: focus.z + 0.32,
    },
  }
}

function impactShot(shot: ThrowShot, frame: ThrowCinematicFrame): ThrowShot {
  const military = frame.performance?.startsWith('benjamin')
  const impact = throwPerformance(frame.performance)?.camera[2] ?? [0.6, 0.72, 0.65, 0.8]
  return {
    ...shot,
    beat: 'impact',
    height: military ? (frame.powered ? 5.2 : 4.1) : impact[1],
    focus: shot.focus.clone().setY(0.65),
    yaw: (military ? -0.55 : impact[0]) * frame.facing,
  }
}

function aftermath(shot: ThrowShot, frame: ThrowCinematicFrame): ThrowShot {
  return {
    ...shot,
    beat: 'aftermath',
    height: 1.65,
    focus: shot.focus.clone().setY(0.85),
    yaw: 0.2 * frame.facing,
  }
}

/** Bisection prevents visible zoom steps while fitting a portrait lens. */
export function fitThrowShot(camera: PerspectiveCamera, shot: ThrowShot) {
  let low = 1,
    high = 1
  place(camera, shot, high)
  while (!fits(camera, shot) && high < 16) {
    low = high
    high *= 1.15
    place(camera, shot, high)
  }
  if (high === 1) return
  for (let i = 0; i < 14; i++) {
    const middle = (low + high) / 2
    place(camera, shot, middle)
    if (fits(camera, shot)) high = middle
    else low = middle
  }
  place(camera, shot, high)
}

function fits(camera: PerspectiveCamera, shot: ThrowShot) {
  return introInFrame(camera, {
    x: shot.focus.x,
    height: shot.bounds.top,
    landmarks: shot.bounds,
    safeTop: 0.8,
  })
}
function place(camera: PerspectiveCamera, shot: ThrowShot, scale: number) {
  camera.position.set(
    shot.focus.x + Math.sin(shot.yaw) * shot.radius * scale,
    shot.focus.y + (shot.height - shot.focus.y) * scale,
    shot.focus.z + Math.cos(shot.yaw) * shot.radius * scale,
  )
  camera.lookAt(shot.focus)
  camera.updateMatrixWorld(true)
}
