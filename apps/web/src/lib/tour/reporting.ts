import type { Vec2 } from './types'

/**
 * What the render loop tells the rest of the page, and how rarely.
 *
 * The loop owns the visitor — where they stand, which way they face, how far
 * they have tipped their head — and runs sixty times a second. Almost nothing
 * else aboard wants it at that rate. `position` is a fresh array every frame, so
 * assigning it unguarded invalidates whatever reads it: the minimap, which
 * redraws a hull, a few dozen dotted paths and its legends, on the thread that
 * has to get the next frame out. A quarter of a metre and a degree or so is
 * below what the minimap can show anyway, and takes it from 60 Hz to a walking
 * pace of about eight.
 *
 * Three thresholds rather than two, and that is the repair. The walk had one for
 * moving and one for turning, and only the moving one reached the ear — so a
 * visitor who stood still and turned a full circle heard every sound aboard stay
 * exactly where it was, while the picture went round. Turning is now a report of
 * its own, and so is looking up, which the loop had never told anybody at all.
 *
 * Each of these latches: it returns true once when the threshold is crossed and
 * moves its own mark, so the caller can ask on every frame without keeping any
 * state of its own.
 */

/** How far the visitor has to move before the page is told, in metres. */
export const REPORT_STEP = 0.25

/** And how far they have to turn or tilt, in radians — a degree or so. */
export const REPORT_TURN = 0.02

/** The shorter way round from `b` to `a`, so ±π never reads as a full turn. */
export const angleGap = (a: number, b: number) =>
  ((((a - b) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI

export interface Reporter {
  /** True once the visitor has walked a step's worth since it last said so. */
  stepped: (at: Vec2) => boolean
  /** True once they have turned far enough for the ear to notice. */
  turned: (yaw: number) => boolean
  /** True once they have tipped their head as far. */
  tilted: (pitch: number) => boolean
  /** Marks all three seen, for a jump the thresholds would otherwise swallow. */
  seen: (at: Vec2, yaw: number, pitch: number) => void
}

/** One reporter per walk: the marks belong to the loop, not to the module. */
export function reporter(): Reporter {
  let at: Vec2 = [0, 0]
  let yaw = 0
  let pitch = 0
  return {
    stepped(next) {
      if (Math.hypot(next[0] - at[0], next[1] - at[1]) < REPORT_STEP) return false
      at = next
      return true
    },
    turned(next) {
      if (Math.abs(angleGap(next, yaw)) < REPORT_TURN) return false
      yaw = next
      return true
    },
    tilted(next) {
      if (Math.abs(next - pitch) < REPORT_TURN) return false
      pitch = next
      return true
    },
    seen(nextAt, nextYaw, nextPitch) {
      at = nextAt
      yaw = nextYaw
      pitch = nextPitch
    },
  }
}
