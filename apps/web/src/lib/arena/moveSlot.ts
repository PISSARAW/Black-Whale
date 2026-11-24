import { moveForSlot } from '../fighting/movesets'
import type { FighterId, MoveAction, MoveSlot } from '../fighting/types'
import type { BodyZone } from '../combat/types'
import type { Vec2 } from '../tour/types'

/** Where the first-person player is pushing relative to the camera, which faces the duel. */
export type ArenaDirection = 'forward' | 'back' | null

export interface ArenaMoveInput {
  fighterId: FighterId
  action: MoveAction
  direction: ArenaDirection
  /** Zone under the crosshair: aiming at the legs is Clash's "down". */
  aimed: BodyZone
  airborne?: boolean
}

/**
 * Clash's command grammar in first person. Forward and back come from the
 * movement keys; "down" is aiming low, because Arena has no crouch. Air moves
 * stay out until Arena has a jump. A variant the fighter does not own falls
 * back to the neutral command, as Clash does.
 */
export function arenaMoveSlot(input: ArenaMoveInput): MoveSlot {
  const slot = preferredSlot(input)
  if (moveForSlot(input.fighterId, slot)) return slot
  return neutralSlot(input.action)
}

function preferredSlot({ action, direction, aimed, airborne = false }: ArenaMoveInput): MoveSlot {
  if (action === 'throw' || action === 'finisher') return action
  if (airborne && action !== 'special') return action === 'light' ? 'airLight' : 'airHeavy'
  const low = aimed === 'legs'
  if (action === 'special') return specialSlot(direction, low)
  return normalSlot(action, { direction, low })
}

function specialSlot(direction: ArenaDirection, low: boolean): MoveSlot {
  if (low) return 'downSpecial'
  if (direction === 'forward') return 'forwardSpecial'
  return direction === 'back' ? 'backSpecial' : 'neutralSpecial'
}

function normalSlot(
  action: 'light' | 'heavy',
  { direction, low }: { direction: ArenaDirection; low: boolean },
): MoveSlot {
  const light = action === 'light'
  if (low) return light ? 'lowLight' : 'lowHeavy'
  if (direction === 'forward') return light ? 'forwardLight' : 'forwardHeavy'
  if (direction === 'back' && !light) return 'backHeavy'
  return light ? 'standingLight' : 'standingHeavy'
}

function neutralSlot(action: MoveAction): MoveSlot {
  if (action === 'special') return 'neutralSpecial'
  if (action === 'heavy') return 'standingHeavy'
  if (action === 'light') return 'standingLight'
  return action
}

const FORWARD_CODES = new Set(['KeyW', 'ArrowUp'])
const BACK_CODES = new Set(['KeyS', 'ArrowDown'])
const LEFT_CODES = new Set(['KeyA', 'KeyQ', 'ArrowLeft'])
const RIGHT_CODES = new Set(['KeyD', 'ArrowRight'])
const DIRECTION_CODES = new Set([...FORWARD_CODES, ...BACK_CODES, ...LEFT_CODES, ...RIGHT_CODES])

/** Tracks the held forward/back keys; the movement itself stays with the Tour scene. */
export function createHeldDirection() {
  const held = new Set<string>()
  return {
    down(code: string) {
      if (DIRECTION_CODES.has(code)) held.add(code)
    },
    up(code: string) {
      held.delete(code)
    },
    clear() {
      held.clear()
    },
    current(): ArenaDirection {
      const forward = [...held].some((code) => FORWARD_CODES.has(code))
      const back = [...held].some((code) => BACK_CODES.has(code))
      if (forward === back) return null
      return forward ? 'forward' : 'back'
    },
    vector(heading: number, fallback: 'still' | 'back' = 'still'): Vec2 {
      const advance =
        Number([...held].some((code) => FORWARD_CODES.has(code))) -
        Number([...held].some((code) => BACK_CODES.has(code)))
      const strafe =
        Number([...held].some((code) => RIGHT_CODES.has(code))) -
        Number([...held].some((code) => LEFT_CODES.has(code)))
      const resolvedAdvance = advance === 0 && strafe === 0 && fallback === 'back' ? -1 : advance
      const x = -Math.sin(heading) * resolvedAdvance + Math.cos(heading) * strafe
      const y = -Math.cos(heading) * resolvedAdvance - Math.sin(heading) * strafe
      const length = Math.hypot(x, y)
      if (length === 0) return [0, 0]
      const normalisedX = x / length
      const normalisedY = y / length
      return [
        Math.abs(normalisedX) < Number.EPSILON ? 0 : normalisedX,
        Math.abs(normalisedY) < Number.EPSILON ? 0 : normalisedY,
      ]
    },
  }
}
