import { FIGHTING_ROSTER } from './roster'
import { decodeFightSnapshot } from './fightReplaySnapshot'
import { readPanelReplayCommand } from './fightReplayPanels'
import { FIGHT_STAGES } from './stages'
import { FIGHT_FORMATS } from './formats'
import { createFightEnvironment } from './fightEnvironment'
import type { FightPreparation, PreparationResource } from './preparationTypes'
import { REPLAY_INPUT_MASK } from './fightReplayInput'
import {
  MAX_REPLAY_BYTES,
  MAX_REPLAY_PACKETS,
  MAX_REPLAY_SECONDS,
  REPLAY_RULESET,
  REPLAY_VERSION,
  type FightReplay,
  type ReplayCommand,
  type ReplayPacket,
  type ReplaySetup,
} from './fightReplayTypes'

const fail = (): never => {
  throw new Error('invalid-replay')
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  return value as Record<string, unknown>
}
function integer(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max)
    return fail()
  return value
}
function member<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) return fail()
  return value as T
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') return fail()
  return value
}
function preparation(value: unknown): FightPreparation | undefined {
  if (value === undefined) return undefined
  const entry = object(value)
  if (
    !Array.isArray(entry.resources) ||
    entry.resources.length > 9 ||
    !Array.isArray(entry.cohorts) ||
    entry.cohorts.length > 2
  )
    return fail()
  const resources: PreparationResource[] = [
    'animals',
    'birds',
    'plants',
    'objects',
    'flutes',
    'needles',
    'rooms',
    'cameras',
    'hostages',
  ]
  return {
    mode: member(entry.mode, ['duel', 'scenario']),
    resources: entry.resources.map((id) => member(id, resources)),
    cohorts: entry.cohorts.map((side) => member(side, ['player', 'opponent'])),
  }
}
function setup(value: unknown): ReplaySetup {
  const entry = object(value)
  const env = object(entry.environment)
  const intruders = object(env.unlawfulIntruders)
  const needles = env.needleStock === undefined ? null : object(env.needleStock)
  const stageId = member(
    env.stageId,
    FIGHT_STAGES.map((stage) => stage.id),
  )
  return {
    player: member(
      entry.player,
      FIGHTING_ROSTER.map(({ id }) => id),
    ),
    opponent: member(
      entry.opponent,
      FIGHTING_ROSTER.map(({ id }) => id),
    ),
    mode: member(entry.mode, ['versus-ai', 'versus-local', 'training']),
    seed: entry.seed === undefined ? undefined : integer(entry.seed, 0xffffffff),
    initial: readInitial(entry.initial),
    formatId: member(
      entry.formatId,
      FIGHT_FORMATS.map((format) => format.id),
    ),
    environment: createFightEnvironment({
      stageId,
      arenaInteractions: boolean(env.arenaInteractions),
      morenaPresent: boolean(env.morenaPresent),
      unlawfulIntruders: {
        player: boolean(intruders.player),
        opponent: boolean(intruders.opponent),
      },
      needleStock: needles
        ? {
            player: needles.player === undefined ? undefined : boolean(needles.player),
            opponent: needles.opponent === undefined ? undefined : boolean(needles.opponent),
          }
        : undefined,
      preparation: preparation(env.preparation),
    }),
  }
}
function command(value: unknown): ReplayCommand {
  const entry = object(value)
  const kind = member(entry.kind, ['start', 'round', 'move', 'emperor', 'easter', 'panel'])
  if (kind === 'start' || kind === 'round') return { kind }
  if (kind === 'panel') return readPanelReplayCommand(entry)
  const side = member(entry.side, ['player', 'opponent'])
  if (kind === 'emperor') return { kind, side }
  if (kind === 'easter') {
    const slot = integer(entry.slot, 4)
    if (slot < 1) return fail()
    return { kind, side, slot: slot as 1 | 2 | 3 | 4 }
  }
  return {
    kind,
    side,
    action: member(entry.action, ['light', 'heavy', 'special', 'throw', 'finisher', 'ranged']),
    input: integer(entry.input, REPLAY_INPUT_MASK),
  }
}
function packet(value: unknown): ReplayPacket {
  if (!Array.isArray(value) || value.length !== 4) return fail()
  const [dt, player, opponent, commands] = value
  if (typeof dt !== 'number' || !Number.isFinite(dt) || dt < 0 || dt > 0.05) return fail()
  if (!Array.isArray(commands) || commands.length > 64) return fail()
  return [
    dt,
    integer(player, REPLAY_INPUT_MASK),
    integer(opponent, REPLAY_INPUT_MASK),
    commands.map(command),
  ]
}
export function decodeFightReplay(text: string): FightReplay {
  if (text.length > MAX_REPLAY_BYTES) return fail()
  const entry = object(JSON.parse(text))
  if (entry.version !== REPLAY_VERSION || entry.ruleset !== REPLAY_RULESET)
    throw new Error('replay-version')
  if (
    !Array.isArray(entry.packets) ||
    entry.packets.length === 0 ||
    entry.packets.length > MAX_REPLAY_PACKETS
  )
    return fail()
  const packets = entry.packets.map(packet)
  const duration = packets.reduce((sum, frame) => sum + frame[0], 0)
  checkDuration(entry.duration, duration)
  const checkpoints = readCheckpoints(entry.checkpoints, packets.length)
  return {
    version: REPLAY_VERSION,
    ruleset: REPLAY_RULESET,
    setup: validatedSetup(entry.setup),
    packets,
    checkpoints,
    duration,
    complete: boolean(entry.complete),
  }
}
function readCheckpoints(value: unknown, count: number) {
  if (!Array.isArray(value) || value.length < 2 || value.length > count + 1) return fail()
  let previous = -1
  const entries = value.map((item) => {
    const entry = object(item)
    const index = integer(entry.packet, count)
    if (index <= previous || typeof entry.hash !== 'string' || !/^[a-f0-9]{8}$/.test(entry.hash))
      return fail()
    previous = index
    return { packet: index, hash: entry.hash }
  })
  if (entries[0].packet !== 0 || entries.at(-1)!.packet !== count) return fail()
  return entries
}

function checkDuration(declared: unknown, duration: number): void {
  if (duration <= 0 || duration > MAX_REPLAY_SECONDS + 1e-6) return fail()
  if (typeof declared !== 'number' || Math.abs(declared - duration) > 1e-6) return fail()
}

function readInitial(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > MAX_REPLAY_BYTES) return fail()
  return value
}
function validatedSetup(value: unknown): ReplaySetup {
  const result = setup(value)
  if (result.initial) decodeFightSnapshot(result.initial, result)
  return result
}
