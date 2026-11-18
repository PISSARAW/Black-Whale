import { randomUUID } from 'node:crypto'
import { askOllama, ollamaConfig } from './ollama'
import { movesetFor } from '$lib/fighting/movesets'
import { parseTacticalPlan, planSchema, QWEN_DEADLINE_MS } from '$lib/fighting/qwen/protocol'
import type { CombatObservation, TacticalReply } from '$lib/fighting/qwen/protocol'
import type { FighterMove } from '$lib/fighting/movesetTypes'

export function clashQwenConfig(env: Record<string, string | undefined>) {
  return ollamaConfig({
    OLLAMA_URL: env.CLASH_OLLAMA_URL,
    OLLAMA_MODEL: env.CLASH_OLLAMA_MODEL,
    OLLAMA_TOKEN: env.CLASH_OLLAMA_TOKEN,
    OLLAMA_TIMEOUT_MS: String(QWEN_DEADLINE_MS),
  })
}

export function validCombatObservation(value: unknown): value is CombatObservation {
  if (!value || typeof value !== 'object') return false
  const row = value as CombatObservation
  if (!['hisoka', 'machi'].includes(row.fighter)) return false
  if (!validClock(row)) return false
  if (!validResources(row.self) || !validEnemy(row.enemy)) return false
  if (!Array.isArray(row.recent) || row.recent.length > 6) return false
  return row.recent.every((item) => typeof item === 'string' && item.length <= 64)
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

function offeredMoves(observation: CombatObservation) {
  const catalogue = movesetFor(observation.fighter)!
  return catalogue.moves.filter((move) => offerMove(observation, move))
}
function offerMove(observation: CombatObservation, move: FighterMove): boolean {
  if (!['special', 'finisher'].includes(move.category)) return false
  if (move.auraCost > observation.self.aura) return false
  if (move.slot === 'finisher') return observation.self.linked
  if (observation.fighter === 'hisoka')
    return !['forwardSpecial', 'backSpecial'].includes(move.slot) || observation.self.linked
  if (move.slot === 'neutralSpecial') return observation.self.wounds > 0
  return move.slot !== 'backSpecial' || observation.self.linked
}
/** The catalogue comes from the server, never from arbitrary client instructions. */
function question(observation: CombatObservation) {
  const moves = offeredMoves(observation)
  const rules =
    observation.fighter === 'hisoka'
      ? 'neutralSpecial attaches Bungee Gum by contact; forwardSpecial pulls an existing link; backSpecial rebounds on an existing link; downSpecial disguises a cloth surface, never heals; finisher needs a fighter link.'
      : 'neutralSpecial sutures an existing open wound and can be interrupted; forwardSpecial tracks with a needle, never immobilizes; downSpecial binds at contact with a short held thread; backSpecial releases; finisher needs a held short binding thread.'
  return {
    system: `Choose a legal fighting-game tactic. JSON only. ${rules} Health and aura are percentages 0-100. Recover only if aura is below 20. Otherwise prefer pressure to reach contact. Low health alone does not heal. No new powers. Local reflexes execute normals and combos. Choose supplied special slots or none.`,
    user: JSON.stringify({
      fighter: observation.fighter,
      self: observation.self,
      enemy: observation.enemy,
      recent: observation.recent,
      specials: moves.map((move) => [move.slot, move.auraCost]),
    }),
    schema: planSchema(moves.map((move) => move.slot)),
    maxTokens: 64,
  }
}

export async function askClashQwen(options: {
  env: Record<string, string | undefined>
  observation: CombatObservation
  fetcher?: typeof fetch
}): Promise<TacticalReply | null> {
  const config = clashQwenConfig(options.env)
  if (!config) return null
  const started = Date.now()
  const raw = await askOllama(config, question(options.observation), options.fetcher)
  if (!raw) return null
  try {
    const slots = offeredMoves(options.observation).map((move) => move.slot)
    const plan = parseTacticalPlan(JSON.parse(raw), slots)
    return plan
      ? { plan, model: config.model, requestId: randomUUID(), elapsedMs: Date.now() - started }
      : null
  } catch {
    return null
  }
}
