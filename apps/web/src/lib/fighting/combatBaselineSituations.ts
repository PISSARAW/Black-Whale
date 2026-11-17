import {
  createBaselineSituation,
  type BaselineSituation,
  type BaselineSituationOptions,
} from './combatBaseline'
import { createBaselineTape } from './combatBaselineTape'
import { packReplayInput } from './fightReplayInput'
import { EMPTY_INPUT } from './types'
import type { ReplayCommand, ReplayPacket } from './fightReplayTypes'

const move = (
  side: 'player' | 'opponent',
  action: 'light' | 'heavy' | 'throw' | 'special' | 'ranged',
): ReplayCommand => ({ kind: 'move', side, action, input: 0 })

/** Fixed demonstrations are observations, not claims of optimal player decisions. */
interface SituationTick {
  situation: BaselineSituationOptions['situation']
  tick: number
  contacts: number
}

const PACKETS: Record<BaselineSituation, (step: SituationTick) => ReplayPacket> = {
  spacing: ({ tick }) => [
    1 / 60,
    packReplayInput({ ...EMPTY_INPUT, right: tick >= 12 && tick < 36 }),
    0,
    tick === 0 ? [move('opponent', 'heavy')] : tick === 38 ? [move('player', 'heavy')] : [],
  ],
  approach: ({ tick }) => [
    1 / 60,
    packReplayInput({ ...EMPTY_INPUT, right: tick < 30, jump: tick === 0 }),
    0,
    tick === 24 ? [move('opponent', 'heavy')] : [],
  ],
  projectiles: ({ tick }) => [
    1 / 60,
    packReplayInput({ ...EMPTY_INPUT, guard: tick >= 20 }),
    0,
    [0, 90, 180].includes(tick) ? [move('opponent', 'ranged')] : [],
  ],
  throws: ({ tick }) => [
    1 / 60,
    0,
    0,
    tick === 0 ? [move('player', 'throw')] : tick === 1 ? [move('opponent', 'throw')] : [],
  ],
  corner: ({ contacts }) => [
    1 / 60,
    0,
    packReplayInput({ ...EMPTY_INPUT, guard: contacts >= 3 }),
    [move('player', 'light')],
  ],
  wakeup: ({ tick }) => [1 / 60, 0, 0, wakeupCommands(tick)],
  preparation: ({ tick }) => [1 / 60, 0, 0, preparationCommands(tick)],
}

export function baselineSituationPacket(options: SituationTick): ReplayPacket {
  return PACKETS[options.situation](options)
}

function wakeupCommands(tick: number): ReplayCommand[] {
  if (tick === 0) return [move('player', 'throw')]
  return tick >= 45 && tick < 100 ? [move('player', 'light')] : []
}

function preparationCommands(tick: number): ReplayCommand[] {
  if ([0, 100].includes(tick)) return [move('player', 'special')]
  if ([8, 108].includes(tick)) return [move('opponent', 'light')]
  if (tick === 40) return [move('opponent', 'heavy')]
  return []
}

export function runBaselineSituation(options: BaselineSituationOptions) {
  const tape = createBaselineTape(createBaselineSituation(options))
  for (let tick = 0; tick < 240; tick++)
    tape.step(
      baselineSituationPacket({
        situation: options.situation,
        tick,
        contacts: tape.contacts.length,
      }),
    )
  return tape.finish()
}
