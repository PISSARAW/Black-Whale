import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { createFightEnvironment } from './fightEnvironment'
import {
  halkenburgTransferOptions,
  performHalkenburgTransfer,
  replaceHalkenburgBody,
} from './halkenburgTransfer'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { applyAuraContext } from './nen'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup } from './pvp/protocol'
import { arsenalOptions } from './retrospectiveArsenal'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function ready(side: FightSide, variant = false): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'halkenburg' : 'hisoka',
      side === 'opponent' ? 'halkenburg' : 'hisoka',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          halkenburgRosterVariant: variant,
          preparation: { mode: 'scenario', resources: [], cohorts: [side] },
        },
      },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 49 },
    [side]: {
      ...state[side],
      x: side === 'player' ? 44 : 49,
      aura: 100,
      hatsuEffects: { ...state[side].hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
    },
  }
}
function shoot(state: FightState, side: FightSide) {
  let next = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: 'halkenburg:neutralSpecial',
    auraCharged: false,
  })
  for (let index = 0; index < 90; index++) {
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    if (next.player.hatsuEffects.possessedFrames || next.opponent.hatsuEffects.possessedFrames)
      return next
  }
  return next
}

describe('Halkenburg target and explicit roster experiment', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`keeps the struck physical target when Halkenburg himself is drawn for ${side}`, () => {
      const state = ready(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const struck = shoot(state, side)
      expect(struck[side].id).toBe('halkenburg')
      expect(struck[side].halkenburgOrigin).toBeUndefined()
      expect(struck[target].id).toBe('hisoka')
      expect(struck[target].hatsuEffects.possessedFrames).toBeGreaterThan(0)
      const sleeping = struck.battlefield!.entities.filter((entry) => entry.sleepingFrames)
      expect(sleeping).toHaveLength(0)
      expect(struck[target].halkenburgSoul?.donor).toMatchObject({
        kind: 'fighter',
        owner: side,
        member: 0,
      })
      expect(struck[side].halkenburgSleeping).toBe(struck[target].halkenburgSoul?.id)
    })
    it(`refuses unselected roster replacement even with all resources ready for ${side}`, () => {
      const state = ready(side)
      expect(halkenburgTransferOptions(state, side)).toEqual([])
      expect(replaceHalkenburgBody(state, side)).toBe(state)
      expect(
        performHalkenburgTransfer({
          state,
          side,
          command: { action: 'halkenburg-transfer' },
        }),
      ).toBe(state)
    })
    it(`keeps On and its Nen lock for both arrow and optional transfer for ${side}`, () => {
      const state = ready(side, true)
      state[side] = applyAuraContext(
        {
          ...state[side],
          on: { grudge: 100, sealFrames: 0 },
        },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      )
      expect(state[side].nen.on).toBe(true)
      expect(
        performHalkenburgTransfer({
          state,
          side,
          command: { action: 'halkenburg-transfer' },
        }),
      ).toBe(state)
      expect(shoot(state, side).player.hatsuEffects.possessedFrames).toBe(0)
      expect(shoot(state, side).opponent.hatsuEffects.possessedFrames).toBe(0)
    })
  }
  it('leaves ordinary environment serialization unchanged', () => {
    expect(createFightEnvironment()).not.toHaveProperty('halkenburgRosterVariant')
    expect(createFightEnvironment({ halkenburgRosterVariant: false })).not.toHaveProperty(
      'halkenburgRosterVariant',
    )
  })
  it('exposes the optional transfer through the actual arsenal panel only after selection', () => {
    const hasTransfer = (state: FightState) =>
      arsenalOptions(state, 'player').some(
        (option) => option.command.action === 'halkenburg-transfer',
      )
    expect(hasTransfer(ready('player'))).toBe(false)
    expect(hasTransfer(ready('player', true))).toBe(true)
  })
  it('validates the optional rule in the multiplayer protocol', () => {
    const state = ready('player', true)
    const setup = {
      player: 'halkenburg',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: state.environment,
    }
    expect(parsePvpSetup(setup)?.environment.halkenburgRosterVariant).toBe(true)
    for (const value of ['true', 1, null, {}])
      expect(
        parsePvpSetup({
          ...setup,
          environment: { ...state.environment, halkenburgRosterVariant: value },
        }),
      ).toBeNull()
  })
  it('records and replays the opt-in rule and its drawn body deterministically', () => {
    const state = ready('player', true)
    const recorder = createReplayRecorder(state)!
    const changed = performHalkenburgTransfer({
      state,
      side: 'player',
      command: { action: 'halkenburg-transfer' },
    })
    const packet: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(state, changed)]]
    const after = executeReplayPacket(state, packet)
    expect(after.player.halkenburgOrigin).toBe('halkenburg')
    recorder.append(state, packet, after)
    const recorded = recorder.snapshot()!
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorded)))
    replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(after))
    const invalid = {
      ...recorded,
      setup: {
        ...recorded.setup,
        environment: {
          ...recorded.setup.environment,
          halkenburgRosterVariant: 'true',
        },
      },
    }
    expect(() => decodeFightReplay(JSON.stringify(invalid))).toThrow('invalid-replay')
  })
})
