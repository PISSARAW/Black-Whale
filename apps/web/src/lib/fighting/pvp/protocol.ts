import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_FORMATS } from '../formats'
import { FIGHT_STAGES } from '../stages'
import { createFightEnvironment } from '../fightEnvironment'
import { REPLAY_INPUT_MASK } from '../fightReplayInput'
import type { PvpInputPacket, PvpSetup } from './types'

export function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
export function boundedInteger(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max
}
function member(value: unknown, list: readonly string[]): boolean {
  return typeof value === 'string' && list.includes(value)
}
function only(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key))
}
const ENUM_FIELDS: Record<string, [string, string[]]> = {
  'blinky-target': ['target', ['bullet', 'card', 'stone', 'needle']],
  'blinky-command': ['command', ['suction', 'eject', 'blood']],
  'paper-target': ['zone', ['head', 'torso', 'hands', 'feet']],
  'paper-command': ['command', ['plant', 'serpent', 'doll']],
  'paper-use': ['command', ['plant', 'serpent', 'doll']],
  mary: ['command', ['bleed', 'bind', 'slam', 'scout', 'recall', 'infuse']],
  question: ['question', ['identity', 'nen', 'in']],
}
function validCommand(value: Record<string, unknown>): boolean {
  const kind = String(value.kind)
  if (['emperor', 'call', 'offer'].includes(kind)) return only(value, ['kind'])
  if (kind === 'move') return validMove(value)
  if (kind === 'easter')
    return only(value, ['kind', 'slot']) && boundedInteger(value.slot, 4) && value.slot > 0
  if (kind === 'respond')
    return only(value, ['kind', 'accept']) && typeof value.accept === 'boolean'
  const enumField = ENUM_FIELDS[kind]
  if (enumField)
    return only(value, ['kind', enumField[0]]) && member(value[enumField[0]], enumField[1])
  return textCommand(value)
}
function textCommand(value: Record<string, unknown>): boolean {
  const fields: Record<string, [string, number]> = {
    battle: ['moveId', 100],
    talk: ['words', 160],
    poem: ['text', 240],
  }
  const field = fields[String(value.kind)]
  if (!field) return false
  const text = value[field[0]]
  return only(value, ['kind', field[0]]) && typeof text === 'string' && text.length <= field[1]
}
export function parsePvpPacket(value: unknown): PvpInputPacket | null {
  if (!record(value) || !only(value, ['sequence', 'input', 'commands'])) return null
  if (
    !boundedInteger(value.sequence, Number.MAX_SAFE_INTEGER) ||
    !boundedInteger(value.input, REPLAY_INPUT_MASK)
  )
    return null
  if (!Array.isArray(value.commands) || value.commands.length > 8) return null
  if (!value.commands.every((entry) => record(entry) && validCommand(entry))) return null
  return value as unknown as PvpInputPacket
}
export function parsePvpSetup(value: unknown): PvpSetup | null {
  if (!record(value) || !only(value, ['player', 'opponent', 'formatId', 'environment'])) return null
  if (
    !member(
      value.player,
      FIGHTING_ROSTER.map(({ id }) => id),
    ) ||
    !member(
      value.opponent,
      FIGHTING_ROSTER.map(({ id }) => id),
    )
  )
    return null
  if (
    !member(
      value.formatId,
      FIGHT_FORMATS.map(({ id }) => id),
    )
  )
    return null
  const env = parseEnvironment(value.environment)
  return env
    ? ({
        player: value.player,
        opponent: value.opponent,
        formatId: value.formatId,
        environment: env,
      } as PvpSetup)
    : null
}
function parseEnvironment(value: unknown) {
  if (
    !record(value) ||
    !only(value, [
      'stageId',
      'arenaInteractions',
      'morenaPresent',
      'unlawfulIntruders',
      'needleStock',
      'preparation',
    ])
  )
    return null
  if (
    !member(
      value.stageId,
      FIGHT_STAGES.map(({ id }) => id),
    ) ||
    typeof value.arenaInteractions !== 'boolean' ||
    typeof value.morenaPresent !== 'boolean'
  )
    return null
  if (!sideFlags(value.unlawfulIntruders, false) || !sideFlags(value.needleStock, true)) return null
  if (!validPreparation(value.preparation)) return null
  return createFightEnvironment(value as unknown as Parameters<typeof createFightEnvironment>[0])
}
function sideFlags(value: unknown, optional: boolean): boolean {
  if (value === undefined) return optional
  if (!record(value) || !only(value, ['player', 'opponent'])) return false
  return ['player', 'opponent'].every(
    (key) => typeof value[key] === 'boolean' || (optional && value[key] === undefined),
  )
}
function validPreparation(value: unknown): boolean {
  if (value === undefined) return true
  if (!record(value) || !only(value, ['mode', 'resources', 'cohorts'])) return false
  if (
    !member(value.mode, ['duel', 'scenario']) ||
    !Array.isArray(value.resources) ||
    !Array.isArray(value.cohorts)
  )
    return false
  return (
    value.resources.length <= 7 &&
    value.cohorts.length <= 2 &&
    value.resources.every((id) =>
      member(id, ['animals', 'birds', 'plants', 'objects', 'flutes', 'needles', 'rooms']),
    ) &&
    value.cohorts.every((side) => member(side, ['player', 'opponent']))
  )
}

function validMove(value: Record<string, unknown>): boolean {
  return (
    only(value, ['kind', 'action', 'input']) &&
    member(value.action, ['light', 'heavy', 'special', 'throw', 'finisher', 'ranged']) &&
    boundedInteger(value.input, REPLAY_INPUT_MASK)
  )
}
