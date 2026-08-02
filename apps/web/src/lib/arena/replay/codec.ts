import { playReplay } from './player'
import { ARENA_REPLAY_VERSION, type ArenaReplay } from './types'

export function serializeReplay(replay: ArenaReplay): string {
  return JSON.stringify(replay)
}

export function parseReplay(serialized: string): ArenaReplay {
  const value: unknown = JSON.parse(serialized)
  if (!isReplay(value)) throw new Error('Invalid Arena replay')
  const replay = value as ArenaReplay
  const played = playReplay(replay)
  if (played.checksum !== replay.checksum) throw new Error('Arena replay checksum mismatch')
  return replay
}

function isReplay(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const replay = value as Partial<ArenaReplay>
  return (
    replay.version === ARENA_REPLAY_VERSION &&
    typeof replay.tickRate === 'number' &&
    replay.tickRate > 0 &&
    typeof replay.ticks === 'number' &&
    replay.ticks >= 0 &&
    Boolean(replay.setup?.terrain?.id) &&
    ['counter', 'binder', 'artillery', 'deceiver'].includes(replay.doctrine ?? '') &&
    ['initiate', 'fighter', 'master'].includes(replay.difficulty ?? '') &&
    Array.isArray(replay.commands) &&
    replay.commands.every(validCommand) &&
    typeof replay.checksum === 'string'
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
