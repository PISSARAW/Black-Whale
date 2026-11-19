import { moveForSlot } from '../fighting/movesets'
import type { FighterId, MoveAction, MoveSlot } from '../fighting/types'
import type { BodyZone } from '../combat/types'

/** Where the first-person player is pushing relative to the camera, which faces the duel. */
export type ArenaDirection = 'forward' | 'back' | null

export interface ArenaMoveInput {
  fighterId: FighterId
  action: MoveAction
  direction: ArenaDirection
  /** Zone under the crosshair: aiming at the legs is Clash's "down". */
  aimed: BodyZone
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

function preferredSlot({ action, direction, aimed }: ArenaMoveInput): MoveSlot {
  if (action === 'throw' || action === 'finisher') return action
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

/** Tracks the held forward/back keys; the movement itself stays with the Tour scene. */
export function createHeldDirection() {
  const held = new Set<string>()
  return {
    down(code: string) {
      if (FORWARD_CODES.has(code) || BACK_CODES.has(code)) held.add(code)
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
  }
}
