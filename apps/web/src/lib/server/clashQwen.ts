import { randomUUID } from 'node:crypto'
import { askOllama, ollamaConfig } from './ollama'
import { offeredMoves, fighterRules, allowedNen } from '$lib/fighting/qwen/catalogue'
export { validCombatObservation } from './clashQwenValidation'
import { parseTacticalPlan, planSchema, QWEN_DEADLINE_MS } from '$lib/fighting/qwen/protocol'
import type { CombatObservation, TacticalReply } from '$lib/fighting/qwen/protocol'

export function clashQwenConfig(env: Record<string, string | undefined>) {
  return ollamaConfig({
    OLLAMA_URL: env.CLASH_OLLAMA_URL,
    OLLAMA_MODEL: env.CLASH_OLLAMA_MODEL,
    OLLAMA_TOKEN: env.CLASH_OLLAMA_TOKEN,
    OLLAMA_TIMEOUT_MS: String(QWEN_DEADLINE_MS),
  })
}

/** The catalogue comes from the server, never from arbitrary client instructions. */
function question(observation: CombatObservation) {
  const moves = offeredMoves(observation)
  const rules = fighterRules(observation.fighter)
  const utilities = (observation.utilities ?? []).slice(0, 3)
  return {
    system: `Choose one supplied action token or none. JSON only. No new Nen powers. Native conditions and costs always apply. Health/aura are percentages; recover below 20 aura, otherwise pressure, bait or zone. Local control handles reflexes and combos. ${rules}`,
    user: JSON.stringify({
      fighter: observation.fighter,
      self: observation.self,
      enemy: observation.enemy,
      recent: observation.recent.slice(-3),
      specials: moves.map((move) => [move.slot, move.nameEn, move.auraCost]),
      utilities: utilities.map((entry) => entry.key),
    }),
    schema: planSchema(
      [...moves.map((move) => move.slot), ...utilities.map((entry) => entry.key)],
      allowedNen(observation.fighter),
    ),
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
    const slots = [
      ...offeredMoves(options.observation).map((move) => move.slot),
      ...(options.observation.utilities ?? []).slice(0, 3).map((entry) => entry.key),
    ]
    const plan = parseTacticalPlan(JSON.parse(raw), slots, allowedNen(options.observation.fighter))
    return plan
      ? { plan, model: config.model, requestId: randomUUID(), elapsedMs: Date.now() - started }
      : null
  } catch {
    return null
  }
}
