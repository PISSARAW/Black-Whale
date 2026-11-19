import { controlledEntities } from './preparationActions'
import { performLittleEyeCommand } from './littleEyeActions'
import { visibleBodyAppearance } from './fightBodyIdentity'
import type { LittleEyeControl } from './littleEyeTypes'
import type { ArsenalActionId } from './retrospectiveTypes'
import type { FightState } from './types'

/** Scout from actually received observations, without reading an unseen opponent's position. */
export function littleEyeAi(state: FightState): FightState | null {
  const animal = controlledEntities(state, 'opponent', 'sayird')[0]
  const screen = state.opponent.littleEyeScreen
  if (!animal?.littleEye || !screen || state.frame % 60 !== 0) return null
  const picture = screen.pictures.find(
    (entry) => entry.appearance !== visibleBodyAppearance(state.opponent),
  )
  if (!picture) return null
  const action = nextScoutOrder(animal.littleEye, picture.x - animal.x)
  if (!action) return null
  const next = performLittleEyeCommand(state, 'opponent', { action })
  return next === state ? null : next
}
function nextScoutOrder(control: LittleEyeControl, gap: number): ArsenalActionId | null {
  if (Math.abs(gap) <= 6) return control.destinationX === undefined ? null : 'little-eye-stay'
  const destinationX = gap < 0 ? 0 : 100
  if (control.destinationX === destinationX) return null
  return gap < 0 ? 'little-eye-left' : 'little-eye-right'
}
