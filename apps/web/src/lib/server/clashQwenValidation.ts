import { movesetFor } from '$lib/fighting/movesets'
import { isQwenFighter } from '$lib/fighting/qwen/catalogue'
import { validArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
import { utilityKey } from '$lib/fighting/qwen/utilities'
import type { CombatObservation } from '$lib/fighting/qwen/protocol'

export function validCombatObservation(value: unknown): value is CombatObservation {
  if (!value || typeof value !== 'object') return false
  const row = value as CombatObservation
  if (!isQwenFighter(row.fighter) || !validClock(row)) return false
  if (!validResources(row.self) || !validEnemy(row.enemy)) return false
  if (!validChoices(row)) return false
  return (
    Array.isArray(row.recent) &&
    row.recent.length <= 6 &&
    row.recent.every((item) => typeof item === 'string' && item.length <= 64)
  )
}
function validClock(row: CombatObservation): boolean {
  return (
    Number.isInteger(row.round) && row.round >= 1 && Number.isInteger(row.frame) && row.frame >= 0
  )
}
function validResources(value: CombatObservation['self']): boolean {
  if (!value || typeof value !== 'object') return false
  return (
    [value.health, value.aura, value.wounds].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 10000,
    ) &&
    typeof value.linked === 'boolean' &&
    typeof value.nen === 'string' &&
    value.nen.length <= 16
  )
}
function validEnemy(value: CombatObservation['enemy']): boolean {
  if (value === null) return true
  if (!value || typeof value !== 'object') return false
  return (
    Number.isFinite(value.distance) &&
    value.distance >= 0 &&
    value.distance <= 1000 &&
    typeof value.pose === 'string' &&
    value.pose.length <= 32 &&
    typeof value.guarding === 'boolean'
  )
}
function validChoices(row: CombatObservation): boolean {
  const slots = new Set(movesetFor(row.fighter)!.moves.map((move) => move.slot))
  if (!Array.isArray(row.moves) || row.moves.length > slots.size) return false
  if (!row.moves.every((move) => move && slots.has(move.slot) && typeof move.ready === 'boolean'))
    return false
  if (new Set(row.moves.map((move) => move.slot)).size !== row.moves.length) return false
  const utilities = row.utilities ?? []
  if (!Array.isArray(utilities) || utilities.length > 8) return false
  return utilities.every(
    (entry) =>
      entry && validArsenalCommand(entry.command) && entry.key === utilityKey(entry.command),
  )
}
