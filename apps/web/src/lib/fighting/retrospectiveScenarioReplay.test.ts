import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { composeBashoPoem } from './bashoAction'
import { BASHO_ATTESTED_POEMS } from './bashoPoem'
import { performArsenalCommand } from './retrospectiveArsenal'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightState } from './types'

const resources = [
  'animals',
  'birds',
  'plants',
  'objects',
  'needles',
  'flutes',
  'rooms',
  'devices',
  'writing',
  'spirits',
] as const
function scenario() {
  const base = beginFight(
    createFight('basho', 'hinrigh', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: [...resources], cohorts: [] } },
    }),
  )
  let state: FightState = {
    ...base,
    player: { ...base.player, x: 25, aura: 100 },
    opponent: { ...base.opponent, x: 75, aura: 100 },
  }
  const recorder = createReplayRecorder(state)!
  function packet(entry: ReplayPacket) {
    const after = executeReplayPacket(state, entry)
    recorder.append(state, entry, after)
    state = after
  }
  return {
    recorder,
    get state() {
      return state
    },
    change(perform: (current: FightState) => FightState) {
      packet([0, 0, 0, [panelReplayCommand(state, perform(state))]])
    },
    frames(count: number) {
      for (let i = 0; i < count; i++) packet([1 / 60, 0, 0, []])
    },
  }
}

describe('complete retrospective scenarios export and import their real resources', () => {
  it('replays writing, a physical charm, weak spirits, transformation and the camera under all ten preparation resources', () => {
    const run = scenario()
    run.change((state) =>
      composeBashoPoem(
        { state, side: 'player', text: BASHO_ATTESTED_POEMS['ward-weak-spirits'].fr },
        performAuraAttack,
      ),
    )
    run.frames(60)
    run.change((state) =>
      performArsenalCommand(state, 'player', { action: 'basho-ward', target: 'player' }),
    )
    run.change((state) =>
      performArsenalCommand(state, 'opponent', {
        action: 'biohazard-device',
        target: 'opponent:device:camera',
      }),
    )
    run.frames(18)
    run.change((state) =>
      performArsenalCommand(state, 'opponent', {
        action: 'device-record',
        target: 'opponent:device:camera',
      }),
    )
    run.change((state) =>
      performArsenalCommand(state, 'opponent', {
        action: 'biohazard-cat-left',
        target: 'opponent:device:camera',
      }),
    )
    run.frames(15)
    expect(run.state.player.writingKit?.sheets).toBe(2)
    expect(run.state.player.bashoWard?.remainingFrames).toBeGreaterThan(0)
    expect(
      run.state.battlefield!.entities.find((e) => e.id === 'opponent:device:camera')?.device?.form
        ?.kind,
    ).toBe('cat')
    const decoded = decodeFightReplay(JSON.stringify(run.recorder.snapshot()))
    expect(decoded.setup.environment.preparation?.resources).toEqual(resources)
    const player = createReplayPlayer(decoded)
    for (let n = 0; !player.done && n < 1000; n++) player.advance(0.05, 2)
    expect(player.done).toBe(true)
    expect(player.error).toBe('')
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(run.state))
  })
  it('still refuses invented or oversized preparation lists', () => {
    const data = scenario().recorder.snapshot()!
    const replace = (list: string[]) =>
      JSON.stringify({
        ...data,
        setup: {
          ...data.setup,
          environment: {
            ...data.setup.environment,
            preparation: { mode: 'scenario', resources: list, cohorts: [] },
          },
        },
      })
    expect(() => decodeFightReplay(replace([...resources, 'devices']))).toThrow()
    expect(() => decodeFightReplay(replace(['invented-power']))).toThrow()
  })
})
