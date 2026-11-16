import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { FightState } from './types'

export interface CombatCameraFrame {
  x: number
  y: number
  z: number
  lookY: number
}
interface Bounds {
  left: number
  right: number
  bottom: number
  top: number
}
export interface CombatCameraOptions {
  state: FightState
  base: CombatCameraFrame
  span: { centre: number; gap: number }
  aspect: number
  intensity: number
  dt: number
  minimumDistance?: number
}
const TAN_FOV = Math.tan((17 * Math.PI) / 180)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
function bodyBounds(options: CombatCameraOptions): Bounds {
  const { state, span } = options
  const actors = [state.player, state.opponent]
  const tops = actors.map((actor) => fightWorldY(actor.y) + (actor.id === 'biscuit' ? 2.8 : 1.9))
  return {
    left: Math.min(span.centre - span.gap / 2, ...actors.map((a) => fightWorldX(a.x))) - 0.8,
    right: Math.max(span.centre + span.gap / 2, ...actors.map((a) => fightWorldX(a.x))) + 0.8,
    bottom: Math.min(0, ...actors.map((a) => fightWorldY(a.y))) - 0.08,
    top: Math.max(...tops) + 0.2,
  }
}
/** Conservative projection bounds reserve room above heads for the HUD. */
export function combatCameraDistance(
  frame: CombatCameraFrame,
  bounds: Bounds,
  aspect: number,
): number {
  const horizontal =
    Math.max(frame.x - bounds.left, bounds.right - frame.x) /
    (TAN_FOV * Math.max(0.25, aspect) * 0.84)
  const vertical =
    Math.max(frame.lookY - bounds.bottom, bounds.top - frame.lookY) / (TAN_FOV * 0.67)
  return Math.max(4.8, horizontal, vertical)
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
  const { state, base, span } = options
  const intensity = clamp(options.intensity, 0, 1)
  const bounds = bodyBounds(options)
  const focus =
    state.phase === 'fighting' && state.impact && !state.impact.blocked && !state.impact.avoided
      ? clamp(state.hitstop / 12, 0, 1) * 0.22 * intensity
      : 0
  const x = base.x + (span.centre - base.x) * intensity
  const lookY = Math.max(base.lookY, (bounds.top + bounds.bottom) / 2 + 0.2)
  const frame = {
    x,
    lookY,
    y: lookY + base.y - base.lookY,
    z: preserveSpecialFraming(state) ? base.z : base.z * (1 - 0.14 * intensity) - focus,
  }
  const minimum = Math.max(
    options.minimumDistance ?? 0,
    combatCameraDistance(frame, bounds, options.aspect),
  )
  return { ...frame, z: Math.max(minimum, frame.z), bounds, minimum }
}
/** Camera motion is presentation only: it never changes positions, hitboxes, hitstop or RNG. */
export function createCombatCamera() {
  let held: CombatCameraFrame | null = null
  let lastFrame = -1
  let pair = ''
  return {
    update(options: CombatCameraOptions): CombatCameraFrame {
      const target = combatCameraTarget(options)
      const key = `${options.state.player.id}:${options.state.opponent.id}`
      if (!held || lastFrame > options.state.frame || key !== pair) held = { ...target }
      const ease = 1 - Math.exp(-7 * clamp(options.dt, 0, 0.1))
      const x = held.x + (target.x - held.x) * ease
      const lookY = held.lookY + (target.lookY - held.lookY) * ease
      const pose = {
        x,
        lookY,
        y: lookY + target.y - target.lookY,
        z: held.z + (target.z - held.z) * ease,
      }
      // Open the shot immediately when needed; easing must never crop a fighter.
      pose.z = Math.max(
        pose.z,
        target.minimum,
        combatCameraDistance(pose, target.bounds, options.aspect),
      )
      held = pose
      lastFrame = options.state.frame
      pair = key
      return pose
    },
  }
}
