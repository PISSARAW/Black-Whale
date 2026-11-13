import { playReplay } from './player'
import { ARENA_REPLAY_VERSION, DEFAULT_REPLAY_MATCH, type ArenaReplay } from './types'

export function serializeReplay(replay: ArenaReplay): string {
  return JSON.stringify(replay)
}

export function parseReplay(serialized: string): ArenaReplay {
  const value: unknown = JSON.parse(serialized)
  if (!isReplay(value)) throw new Error('Invalid Arena replay')
  if ((value as { version: number }).version === ARENA_REPLAY_VERSION) {
    const replay = value as ArenaReplay
    if (playReplay(replay).checksum !== replay.checksum)
      throw new Error('Arena replay checksum mismatch')
    return replay
  }

  const legacy = value as Omit<ArenaReplay, 'version' | 'match'> & { version: 1 }
  const formatted: ArenaReplay = {
    ...legacy,
    version: ARENA_REPLAY_VERSION,
    match: structuredClone(DEFAULT_REPLAY_MATCH),
  }
  if (playReplay(formatted).checksum === formatted.checksum) return formatted
  const engineOnly = {
    ...formatted,
    match: { ...formatted.match, legacyRules: true },
  }
  if (playReplay(engineOnly).checksum === engineOnly.checksum) return engineOnly
  throw new Error('Arena replay checksum mismatch')
}

function isReplay(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const replay = value as Partial<ArenaReplay>
  const version = (value as { version?: number }).version
  return (
    (version === ARENA_REPLAY_VERSION || version === 1) &&
    typeof replay.tickRate === 'number' &&
    replay.tickRate > 0 &&
    typeof replay.ticks === 'number' &&
    replay.ticks >= 0 &&
    Boolean(replay.setup?.terrain?.id) &&
    ['counter', 'binder', 'artillery', 'deceiver'].includes(replay.doctrine ?? '') &&
    ['initiate', 'fighter', 'master'].includes(replay.difficulty ?? '') &&
    (version === 1 || validMatch(replay.match)) &&
    Array.isArray(replay.commands) &&
    replay.commands.every(validCommand) &&
    typeof replay.checksum === 'string'
  )
}

function validMatch(match: ArenaReplay['match'] | undefined): boolean {
  return (
    Boolean(match) &&
    ['first-to-three', 'survival', 'forced-mastery', 'sudden-death'].includes(
      match?.formatId ?? '',
    ) &&
    typeof match?.opponentId === 'string' &&
    (match?.challengeId === null || typeof match?.challengeId === 'string') &&
    (match?.missionId === null || typeof match?.missionId === 'string')
  )
}

function validCommand(command: ArenaReplay['commands'][number]): boolean {
  return (
    command !== null &&
    typeof command === 'object' &&
    Number.isInteger(command.tick) &&
    command.tick >= 0 &&
    command.action !== null &&
    typeof command.action === 'object' &&
    typeof command.action.type === 'string'
  )
}
