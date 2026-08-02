import { ACTIVE_SCENARIO, isPlayableScenarioFaction } from './scenario'
import { strategyChecksum } from './replay/checksum'
import type { StrategySaveV2, StrategyTurnV2 } from './replay/types'

export const STRATEGY_SAVE_KEY = 'black-whale:strategy:save:v2'
export const LEGACY_STRATEGY_SAVE_KEY = 'black-whale:strategy:save:v1'
export const MAX_STRATEGY_SAVE_BYTES = 100_000
export type StrategySave = StrategySaveV2

interface LegacyStrategySave {
  version: 1
  savedAt: string
  baseEventId: string
  selectedFactionId: string
  turns: Array<Omit<StrategyTurnV2, 'turn'>>
}

function replayPayload(save: Partial<StrategySaveV2>) {
  const { savedAt: _savedAt, checksum: _checksum, ...replay } = save
  return replay
}

export function createStrategySave(
  input: Omit<StrategySaveV2, 'version' | 'scenarioId' | 'scenarioContentVersion' | 'checksum'>,
): StrategySaveV2 {
  const replay = {
    ...input,
    version: 2 as const,
    scenarioId: ACTIVE_SCENARIO.id,
    scenarioContentVersion: ACTIVE_SCENARIO.contentVersion,
  }
  return { ...replay, checksum: strategyChecksum(replayPayload(replay)) }
}

export function encodeStrategySave(save: StrategySaveV2): string {
  return JSON.stringify(save)
}

function validTurns(value: unknown): value is StrategyTurnV2[] {
  if (!Array.isArray(value) || value.length > ACTIVE_SCENARIO.maxTurns) return false
  return value.every(
    (turn, index) =>
      turn &&
      typeof turn === 'object' &&
      (turn as StrategyTurnV2).turn === index + 1 &&
      Array.isArray((turn as StrategyTurnV2).orders) &&
      Array.isArray((turn as StrategyTurnV2).diplomacy),
  )
}

function migrateLegacy(save: LegacyStrategySave): StrategySaveV2 | null {
  if (!save.baseEventId || !isPlayableScenarioFaction(save.selectedFactionId)) return null
  return createStrategySave({
    savedAt: save.savedAt,
    seed: `${save.baseEventId}:${save.selectedFactionId}`,
    baseEventId: save.baseEventId,
    selectedFactionId: save.selectedFactionId,
    turns: save.turns.map((turn, index) => ({ ...turn, turn: index + 1 })),
  })
}

export function decodeStrategySave(serialized: string | null): StrategySaveV2 | null {
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_STRATEGY_SAVE_BYTES)
    return null
  try {
    const parsed = JSON.parse(serialized) as Partial<StrategySaveV2> & Partial<LegacyStrategySave>
    if (parsed.version === 1) return migrateLegacy(parsed as LegacyStrategySave)
    if (
      parsed.version !== 2 ||
      parsed.scenarioId !== ACTIVE_SCENARIO.id ||
      parsed.scenarioContentVersion !== ACTIVE_SCENARIO.contentVersion ||
      !parsed.seed ||
      !parsed.baseEventId ||
      !parsed.selectedFactionId ||
      !isPlayableScenarioFaction(parsed.selectedFactionId) ||
      !validTurns(parsed.turns)
    )
      return null
    const save = parsed as StrategySaveV2
    return strategyChecksum(replayPayload(save)) === save.checksum ? save : null
  } catch {
    return null
  }
}
