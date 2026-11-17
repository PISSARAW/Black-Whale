import type { FightInput } from './fightInputTypes'

/**
 * Numpad notation relative to facing: 1 2 3 = down-back, down, down-forward;
 * 4 5 6 = back, neutral, forward; 7 8 9 = up-back, up, up-forward.
 */
export type Numpad = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Frames of direction history a motion may span, press frame excluded. */
export const MOTION_LOG_FRAMES = 15

type Directions = Pick<FightInput, 'left' | 'right' | 'down' | 'jump'>

/** 0 = back, 1 = neutral, 2 = forward; opposite keys cancel out. */
function column(facing: -1 | 1, input: Directions): number {
  const horizontal = Number(input.right) - Number(input.left)
  return 1 + horizontal * facing
}

export function numpadDirection(facing: -1 | 1, input: Directions): Numpad {
  const row = input.down ? 0 : input.jump ? 2 : 1
  return (row * 3 + column(facing, input) + 1) as Numpad
}

/** Appends this tick's direction, keeping the last MOTION_LOG_FRAMES entries. */
export function appendMotion(log: readonly Numpad[] | undefined, direction: Numpad): Numpad[] {
  return [...(log ?? []), direction].slice(-MOTION_LOG_FRAMES)
}

/** Ordered sub-sequence match: each step may repeat or be separated by other directions. */
function followsInOrder(sequence: readonly Numpad[], steps: readonly Numpad[]): boolean {
  let next = 0
  for (const direction of sequence) if (direction === steps[next]) next++
  return next >= steps.length
}

/** 236: down, down-forward, forward, ending on forward (6) or down-forward (3) at the press. */
export function quarterCircleForward(log: readonly Numpad[], press: Numpad): boolean {
  if (press !== 6 && press !== 3) return false
  return followsInOrder([...log, press], [2, 3, 6])
}
