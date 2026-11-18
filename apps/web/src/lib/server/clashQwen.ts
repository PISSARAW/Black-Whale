import { randomUUID } from 'node:crypto'
import { askOllama, ollamaConfig } from './ollama'
import { offeredMoves, fighterRules, allowedNen } from '$lib/fighting/qwen/catalogue'
export { validCombatObservation } from './clashQwenValidation'
import { parseTacticalPlan, planSchema, QWEN_DEADLINE_MS } from '$lib/fighting/qwen/protocol'
import type { CombatObservation, TacticalReply } from '$lib/fighting/qwen/protocol'
import type { FightSide } from '$lib/fighting/types'

const SEAT_SUFFIX: Record<FightSide, string> = { player: 'P1', opponent: 'P2' }

/** A seat-suffixed variable (`CLASH_OLLAMA_MODEL_P2`) overrides the shared one for that seat. */
function seatValue(env: Record<string, string | undefined>, name: string, seat?: FightSide) {
  const own = seat ? env[`CLASH_OLLAMA_${name}_${SEAT_SUFFIX[seat]}`]?.trim() : undefined
  return own || env[`CLASH_OLLAMA_${name}`]
}

export function clashQwenConfig(env: Record<string, string | undefined>, seat?: FightSide) {
  return ollamaConfig({
    OLLAMA_URL: seatValue(env, 'URL', seat),
    OLLAMA_MODEL: seatValue(env, 'MODEL', seat),
    OLLAMA_TOKEN: seatValue(env, 'TOKEN', seat),
    OLLAMA_TIMEOUT_MS: String(QWEN_DEADLINE_MS),
  })
}

/** Both seats must resolve to an endpoint before an AI-versus-AI duel can start. */
export function clashQwenSeats(env: Record<string, string | undefined>) {
  const player = clashQwenConfig(env, 'player')
  const opponent = clashQwenConfig(env, 'opponent')
  return player && opponent ? { player: player.model, opponent: opponent.model } : null
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
  seat?: FightSide
  fetcher?: typeof fetch
}): Promise<TacticalReply | null> {
  const config = clashQwenConfig(options.env, options.seat)
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
