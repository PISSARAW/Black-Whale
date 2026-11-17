import { FIGHTING_ROSTER } from './roster'
import { FIGHT_FORMATS, DEFAULT_FIGHT_FORMAT, type FightFormatId } from './formats'
import { FIGHT_STAGES } from './stages'
import { createFightEnvironment, type FightEnvironment } from './fightEnvironment'
import type { FighterId, FightMode } from './types'

export interface FightSetupDraft {
  player: FighterId
  opponent: FighterId
  environment: FightEnvironment
  format: FightFormatId
  mode: FightMode
}
const KEY = 'black-whale:clash:setup:v1'

export function defaultFightSetup(): FightSetupDraft {
  return {
    player: 'kurapika',
    opponent: 'hisoka',
    environment: createFightEnvironment({ arenaInteractions: true }),
    format: DEFAULT_FIGHT_FORMAT,
    mode: 'versus-ai',
  }
}

function restoreDraft(value: Record<string, unknown>): FightSetupDraft {
  const fallback = defaultFightSetup()
  const player = FIGHTING_ROSTER.find((entry) => entry.id === value.player)?.id ?? fallback.player
  const opponent =
    FIGHTING_ROSTER.find((entry) => entry.id === value.opponent)?.id ?? fallback.opponent
  const format = FIGHT_FORMATS.find((entry) => entry.id === value.format)?.id ?? fallback.format
  const mode =
    (['versus-ai', 'versus-local', 'training'] as const).find((entry) => entry === value.mode) ??
    fallback.mode
  return { player, opponent, format, mode, environment: restoreEnvironment(value) }
}

export function readFightSetup(): FightSetupDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return restoreDraft(value ?? {})
  } catch {
    return defaultFightSetup()
  }
}

export function saveFightSetup(draft: FightSetupDraft): void {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        player: draft.player,
        opponent: draft.opponent,
        format: draft.format,
        mode: draft.mode,
        stageId: draft.environment.stageId,
        arenaInteractions: draft.environment.arenaInteractions,
      }),
    )
  } catch {
    /* A match also works when browser storage is unavailable. */
  }
}

function restoreEnvironment(value: Record<string, unknown>): FightEnvironment {
  const stageId = FIGHT_STAGES.find((entry) => entry.id === value.stageId)?.id ?? 'whale-hold'
  const arenaInteractions =
    typeof value.arenaInteractions === 'boolean' ? value.arenaInteractions : true
  return createFightEnvironment({ stageId, arenaInteractions })
}
