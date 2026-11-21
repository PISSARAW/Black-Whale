import { activeHitbox, attackData } from './frameData'
import { liveEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightState } from './types'

/**
 * Any real low (crouching) or foot-aimed active strike sweeping over a small real animal hurts it once,
 * on its first active frame. The animal gains no defence or counterattack from Little Eye.
 */
export function strikeSmallAnimals(state: FightState): FightState {
  const field = state.battlefield
  if (!field?.entities.some(smallRealAnimal)) return state
  const strikes = [state.player, state.opponent].filter(firstActiveFrame)
  if (!strikes.length) return state
  let changed = false
  const entities = field.entities.map((entry) => {
    if (!smallRealAnimal(entry)) return entry
    const damage = strikes
      .filter((fighter) => sweepsOver(fighter, entry))
      .reduce((sum, fighter) => sum + attackData(fighter.attack!.kind, fighter).damage, 0)
    if (!damage) return entry
    changed = true
    return { ...entry, health: Math.max(0, entry.health - damage) }
  })
  return changed ? { ...state, battlefield: { ...field, entities } } : state
}

function smallRealAnimal(entry: PreparedEntity): boolean {
  return (
    entry.kind === 'animal' &&
    entry.material === 'real' &&
    entry.animalSize !== undefined &&
    entry.animalSize !== 'larger' &&
    liveEntity(entry)
  )
}

function firstActiveFrame(fighter: ArcadeFighter): boolean {
  if (!fighter.attack || !activeHitbox(fighter)) return false
  return fighter.attack.frame === attackData(fighter.attack.kind, fighter).startup
}

function sweepsOver(fighter: ArcadeFighter, animal: PreparedEntity): boolean {
  const box = activeHitbox(fighter)!
  const low =
    fighter.attack!.variant === 'low' ||
    attackData(fighter.attack!.kind, fighter).targetZone === 'feet'
  return low && animal.x >= box.left && animal.x <= box.right
}
