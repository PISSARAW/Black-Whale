import { decodeReplay, encodeReplay, safeReplayKey } from './clashReplayCodec'
import { applyReplayChanges, replayChanges, type ReplayPatch } from './clashReplayPatch'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayCommand } from './fightReplayTypes'
import type { FightState } from './types'

export type PanelReplayCommand = { kind: 'panel'; payload: string; before: string; after: string }
/** Journal the command boundary of panels whose typed editors live outside the simulation. */
export function panelReplayCommand(before: FightState, after: FightState): PanelReplayCommand {
  return {
    kind: 'panel',
    payload: encodeReplay(replayChanges(before, after)),
    before: fightReplayHash(before),
    after: fightReplayHash(after),
  }
}
export function readPanelReplayCommand(value: Record<string, unknown>): PanelReplayCommand {
  if (
    typeof value.payload !== 'string' ||
    typeof value.before !== 'string' ||
    typeof value.after !== 'string'
  )
    throw Error('invalid-replay')
  if (!/^[a-f0-9]{8}$/.test(value.before) || !/^[a-f0-9]{8}$/.test(value.after))
    throw Error('invalid-replay')
  readChanges(value.payload)
  return { kind: 'panel', payload: value.payload, before: value.before, after: value.after }
}
function readChanges(payload: string): ReplayPatch[] {
  const value = decodeReplay(payload)
  if (!Array.isArray(value) || value.length > 10000) throw Error('invalid-replay')
  for (const patch of value) validatePatch(patch)
  return value as ReplayPatch[]
}
function validatePatch(patch: ReplayPatch) {
  if (!patch || !Array.isArray(patch.path) || patch.path.length === 0 || patch.path.length > 100)
    throw Error('invalid-replay')
  if (!patch.path.every((key: unknown) => typeof key === 'string' && safeReplayKey(key)))
    throw Error('invalid-replay')
  if (patch.remove !== undefined && patch.remove !== true) throw Error('invalid-replay')
}
export function applyPanelReplay(
  state: FightState,
  command: Extract<ReplayCommand, { kind: 'panel' }>,
): FightState {
  if (fightReplayHash(state) !== command.before) throw Error('panel-divergence')
  const next = applyReplayChanges(state, readChanges(command.payload))
  if (fightReplayHash(next) !== command.after) throw Error('panel-divergence')
  return next
}
