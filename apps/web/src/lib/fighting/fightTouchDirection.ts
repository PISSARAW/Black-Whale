import type { FightInput } from './types'
type Direction = 'left' | 'right' | 'jump' | 'down'
interface PadPoint {
  x: number
  y: number
}

/** Normalized coordinates, with diagonals and a neutral zone around the center. */
export function fightTouchDirections(point: PadPoint): Direction[] {
  const keys: Direction[] = []
  if (point.x < -0.3) keys.push('left')
  if (point.x > 0.3) keys.push('right')
  if (point.y < -0.3) keys.push('jump')
  if (point.y > 0.3) keys.push('down')
  return keys
}

export function createFightTouchPad(onControl: (key: keyof FightInput, active: boolean) => void) {
  let owner: number | null = null
  let active: Direction[] = []
  function update(keys: Direction[]) {
    for (const key of active) if (!keys.includes(key)) onControl(key, false)
    for (const key of keys) if (!active.includes(key)) onControl(key, true)
    active = keys
  }
  return {
    press(id: number, point: PadPoint) {
      if (owner !== null) return false
      owner = id
      update(fightTouchDirections(point))
      return true
    },
    move(id: number, point: PadPoint) {
      if (id === owner) update(fightTouchDirections(point))
    },
    release(id: number) {
      if (id !== owner) return
      owner = null
      update([])
    },
    cancel() {
      owner = null
      update([])
    },
  }
}
