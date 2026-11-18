import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { CinematicDirection } from './cinematicDirector'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { CameraDetailRect } from './cinematicDetailLayout'
import { previewLaunchSpeed } from './directionalComboCamera'
import {
  dominantCameraAccent,
  REST_CAMERA_ACCENT,
  type CombatCameraAccent,
} from './combatCameraAccent'
import { createCombatCameraPhrase } from './combatCameraPhrase'

export interface CombatCameraFrame {
  x: number
  y: number
  z: number
  lookY: number
  detailReady?: boolean
}
interface Bounds {
  left: number
  right: number
  bottom: number
  top: number
  region?: SafeRegion
}
export interface CombatCameraOptions {
  state: FightState
  base: CombatCameraFrame
  span: { centre: number; gap: number }
  aspect: number
  intensity: number
  dt: number
  minimumDistance?: number
  direction?: CinematicDirection
  detail?: boolean
  detailWeight?: number
  detailRect?: CameraDetailRect
  companion?: FightSide
  accent?: CombatCameraAccent
}
interface SafeRegion {
  left: number
  right: number
  top: number
  bottom: number
}
const DEFAULT_REGION = { left: -0.84, right: 0.84, top: 0.67, bottom: -0.88 }
const TAN_FOV = Math.tan((17 * Math.PI) / 180)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
function outsideRegion(x: number, y: number, region: SafeRegion): boolean {
  return x < region.left || x > region.right || y < region.bottom || y > region.top
}
function reservedRegion(portrait: boolean, weight: number, rect?: CameraDetailRect): SafeRegion {
  const top = rect ? 1 - 2 * (rect.y + rect.height + 0.02) : 0.06
  const right = rect ? 2 * (rect.x - 0.055) - 1 : 0.23
  return {
    ...DEFAULT_REGION,
    top: portrait ? 0.67 + (top - 0.67) * weight : 0.67,
    right: portrait ? 0.84 : 0.84 + (right - 0.84) * weight,
  }
}
function actorHalfWidth(actor: ArcadeFighter): number {
  // A body on its back extends far beyond the upright hurtbox, including large forms.
  return ['down', 'ko', 'wakeup'].includes(actor.pose) ? 3.2 : 0.8
}
function bodyBounds(options: CombatCameraOptions): Bounds {
  const { state, span } = options
  const actors = [state.player, state.opponent]
  // Use velocity to begin opening the shot during takeoff, before a head reaches the HUD.
  const tops = actors.map(
    (actor, index) =>
      fightWorldY(
        actor.y + Math.max(0, actor.velocityY, previewLaunchSpeed(actors[1 - index])) * 0.12,
      ) + (actor.id === 'biscuit' ? 2.8 : 2.22),
  )
  const companion = options.companion && state[options.companion]
  const beastX = companion ? fightWorldX(companion.x) - companion.facing : span.centre
  return {
    left: Math.min(
      span.centre - span.gap / 2 - 0.8,
      beastX - (companion ? 0.15 : 0) - 0.8,
      ...actors.map((a) => fightWorldX(a.x) - actorHalfWidth(a)),
    ),
    right: Math.max(
      span.centre + span.gap / 2 + 0.8,
      beastX + (companion ? 0.15 : 0) + 0.8,
      ...actors.map((a) => fightWorldX(a.x) + actorHalfWidth(a)),
    ),
    bottom: Math.min(0, ...actors.map((a) => fightWorldY(a.y))) - 0.08,
    top: Math.max(...tops) + 0.2,
  }
}
function fitsCameraBounds(frame: CombatCameraFrame, bounds: Bounds, aspect: number) {
  const region = bounds.region ?? DEFAULT_REGION
  const tilt = frame.y - frame.lookY
  const length = Math.hypot(frame.z, tilt)
  const cosine = frame.z / length
  const sine = tilt / length
  for (const x of [bounds.left, bounds.right])
    for (const y of [bounds.bottom, bounds.top]) {
      const dy = y - frame.lookY
      const depth = length - sine * dy
      const px = (x - frame.x) / (TAN_FOV * Math.max(0.25, aspect) * depth)
      const py = (cosine * dy) / (TAN_FOV * depth)
      if (depth <= 0 || outsideRegion(px, py, region)) return false
    }
  return true
}
/** Conservative projection bounds reserve room above heads for the HUD. */
export function combatCameraDistance(
  frame: CombatCameraFrame,
  bounds: Bounds,
  aspect: number,
): number {
  let z = 4.8
  for (let attempt = 0; attempt < 240; attempt++) {
    if (fitsCameraBounds({ ...frame, z }, bounds, aspect)) return z
    z *= 1.025
  }
  return z
}
/** Aim into a low portrait lane while dollying; zooming alone would move bodies behind its panel. */
function fitPortraitLane(options: {
  frame: CombatCameraFrame
  bounds: Bounds
  aspect: number
  minimum: number
}) {
  const { frame, bounds, aspect } = options
  const region = bounds.region!
  const centre = (region.top + region.bottom) / 2
  const tilt = frame.y - frame.lookY
  const bodyY = (bounds.top + bounds.bottom) / 2
  let z = Math.max(4.8, options.minimum)
  for (let attempt = 0; attempt < 240; attempt++) {
    const length = Math.hypot(z, tilt)
    const dy = (centre * TAN_FOV * length) / (z / length + (centre * TAN_FOV * tilt) / length)
    const lookY = bodyY - dy
    const pose = { x: frame.x, z, lookY, y: lookY + tilt }
    if (fitsCameraBounds(pose, bounds, aspect)) return pose
    z *= 1.025
  }
  return { ...frame, z }
}

function preserveSpecialFraming(state: FightState): boolean {
  return Boolean(
    state.catsName ||
    state.player.hanzoProjection ||
    state.opponent.hanzoProjection ||
    state.player.id === 'biscuit' ||
    state.opponent.id === 'biscuit',
  )
}
export function combatCameraTarget(options: CombatCameraOptions) {
  const bounds = bodyBounds(options)
  const detail = reserveDetailSpace(options, bounds)
  const frame = mainCameraFrame(options, { bounds, ...detail })
  return fittedTarget({ frame, bounds, options })
}

function reserveDetailSpace(options: CombatCameraOptions, bounds: Bounds) {
  const portrait = options.aspect < 1.15
  const weight = options.detailWeight ?? (options.detail ? 1 : 0)
  bounds.region = reservedRegion(portrait, weight, options.detailRect)
  return {
    insetOffset: portrait ? 0 : (bounds.right - bounds.left) * 0.36 * weight,
    lift: portrait ? (bounds.top - bounds.bottom) * 0.72 * weight : 0,
  }
}

function mainCameraFrame(
  options: CombatCameraOptions,
  layout: { bounds: Bounds; insetOffset: number; lift: number },
) {
  const { state, base, span } = options
  const intensity = clamp(options.intensity, 0, 1)
  const shot = dominantCameraAccent(options.accent ?? REST_CAMERA_ACCENT, options.direction)
  const { bounds, insetOffset, lift } = layout
  const centre = span.centre
  const focusOffset = shot.side ? (fightWorldX(state[shot.side].x) - centre) * 0.025 : 0
  const x = base.x + (centre - base.x + focusOffset + insetOffset + shot.lead) * intensity
  const lookY =
    Math.max(base.lookY, (bounds.top + bounds.bottom) / 2 + 0.2 + lift) + shot.look * intensity
  return {
    x,
    lookY,
    y: lookY + base.y - base.lookY + shot.tilt * intensity,
    z: Math.max(
      preserveSpecialFraming(state) ? base.z : 5.9,
      base.z * (1 - 0.04 * intensity) - shot.push * intensity,
    ),
  }
}
function fittedTarget({
  frame,
  bounds,
  options,
}: {
  frame: CombatCameraFrame
  bounds: Bounds
  options: CombatCameraOptions
}) {
  if (bounds.region!.top < 0) {
    const safe = fitPortraitLane({
      frame,
      bounds,
      aspect: options.aspect,
      minimum: Math.max(frame.z, options.minimumDistance ?? 0),
    })
    return { ...safe, bounds, minimum: safe.z }
  }
  const minimum = Math.max(
    options.minimumDistance ?? 0,
    combatCameraDistance(frame, bounds, options.aspect),
  )
  return { ...frame, z: Math.max(minimum, frame.z), bounds, minimum }
}
/** Camera motion is presentation only: it never changes positions, hitboxes, hitstop or RNG. */
export function createCombatCamera() {
  const phrase = createCombatCameraPhrase()
  let held: CombatCameraFrame | null = null
  let lastFrame = -1
  let pair = ''
  let detailWeight = 0
  return {
    update(options: CombatCameraOptions): CombatCameraFrame {
      const key = `${options.state.player.id}:${options.state.opponent.id}:${options.state.roundNumber}`
      const reset = !held || lastFrame > options.state.frame || key !== pair
      if (reset) detailWeight = 0
      const step = clamp(options.dt, 0, 0.1) / 0.3
      detailWeight = clamp(detailWeight + (options.detail ? step : -step), 0, 1)
      const accent = phrase(options.state, options.intensity > 0, clamp(options.dt, 0, 0.1) * 60)
      const target = combatCameraTarget({ ...options, detailWeight, accent })
      if (reset || !held) held = { ...target }
      const ease = 1 - Math.exp(-10 * clamp(options.dt, 0, 0.1))
      const x = Math.abs(target.x - held.x) < 0.025 ? held.x : held.x + (target.x - held.x) * ease
      const lookY = held.lookY + (target.lookY - held.lookY) * ease
      let pose = {
        x,
        lookY,
        y: lookY + held.y - held.lookY + (target.y - target.lookY - held.y + held.lookY) * ease,
        z: nextCameraDepth(held.z, target.z, options),
      }
      // Open the shot immediately when needed; easing must never crop a fighter.
      if (target.bounds.region!.top < 0)
        pose = fitPortraitLane({
          frame: pose,
          bounds: target.bounds,
          aspect: options.aspect,
          minimum: Math.max(pose.z, target.minimum),
        })
      else
        pose.z = Math.max(
          pose.z,
          target.minimum,
          combatCameraDistance(pose, target.bounds, options.aspect),
        )
      held = pose
      lastFrame = options.state.frame
      pair = key
      return { ...pose, detailReady: detailWeight >= 1 }
    },
  }
}

function nextCameraDepth(previous: number, target: number, options: CombatCameraOptions): number {
  const dt = clamp(options.dt, 0, 0.1)
  const inward = target < previous
  const fraction = 1 - Math.exp(-(inward ? 10 : 3.4) * dt)
  const change = (target - previous) * fraction
  // Safety fitting may open faster; expressive motion always has a bounded speed.
  return previous + clamp(change, -2.4 * dt, 4.8 * dt)
}
