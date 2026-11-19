import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { privatePvpState } from './pvp/view'
import { mapFrames } from './dowsingMapTestSetup'
import { arsenalOptions } from './retrospectiveArsenal'
import { SCENARIO_RESOURCE_IDS } from './preparationResources'
import { parsePvpSetup } from './pvp/protocol'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide } from './types'

const preparation = {
  mode: 'scenario' as const,
  resources: [...SCENARIO_RESOURCE_IDS],
  cohorts: [],
}
describe('visible physical scenario resources survive network and replay validation', () => {
  it('accepts the entire visible catalogue and materializes real bodies without granting Nen', () => {
    const state = beginFight(
      createFight('theta', 'theta', { mode: 'versus-local', environment: { preparation } }),
    )
    const setup = {
      player: 'theta',
      opponent: 'theta',
      formatId: 'knockout',
      environment: state.environment,
    }
    expect(parsePvpSetup(setup)?.environment.preparation?.resources).toEqual(SCENARIO_RESOURCE_IDS)
    const recorder = createReplayRecorder(state)!
    const packet: ReplayPacket = [1 / 60, 0, 0, []]
    recorder.append(state, packet, executeReplayPacket(state, packet))
    expect(
      decodeFightReplay(JSON.stringify(recorder.snapshot())).setup.environment.preparation
        ?.resources,
    ).toEqual(SCENARIO_RESOURCE_IDS)
    for (const side of ['player', 'opponent']) {
      expect(
        state.battlefield!.entities.find((entry) => entry.id === `${side}:corpse`),
      ).toMatchObject({ kind: 'corpse', material: 'real', present: true })
      expect(
        state.battlefield!.entities.find((entry) => entry.id === `${side}:corpse`)?.controller,
      ).toBeUndefined()
      expect(
        state.battlefield!.entities.find((entry) => entry.id === `${side}:hostage`),
      ).toMatchObject({ kind: 'hostage', material: 'real', captiveOf: side })
    }
    const invalid = {
      ...setup,
      environment: {
        ...state.environment,
        preparation: {
          ...preparation,
          resources: [...preparation.resources, 'invented-hatsu'],
        },
      },
    }
    expect(parsePvpSetup(invalid)).toBeNull()
    const strict = beginFight(
      createFight('illumi', 'theta', {
        environment: {
          preparation: { ...preparation, mode: 'duel' },
        },
      }),
    )
    expect(strict.battlefield?.entities).toEqual([])
    expect(needleCommand(state, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(state)
  })
  it('keeps P2 captivity and corpse ownership aligned with actual canonical objects in client prediction', () => {
    const base = beginFight(
      createFight('theta', 'illumi', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: ['corpses', 'hostages'], cohorts: [] },
        },
      }),
    )
    const local = privatePvpState(base, 'opponent')
    const release = { action: 'judgment-return-hostage' as const, target: 'opponent:hostage' }
    expect(
      arsenalOptions(local, 'player').find((option) => option.command.target === release.target)
        ?.ready,
    ).toBe(true)
    const actual = needleCommand(base, release, 'opponent')
    const predicted = needleCommand(local, release)
    expect(predicted).not.toBe(local)
    const actualHostage = privatePvpState(actual, 'opponent').battlefield!.entities.find(
      (entry) => entry.id === release.target,
    )
    expect(predicted.battlefield!.entities.find((entry) => entry.id === release.target)).toEqual(
      actualHostage,
    )
    expect(actualHostage?.captiveOf).toBeUndefined()
    const implant = { action: 'illumi-corpse' as const, target: 'opponent:corpse' }
    const controlled = mapFrames(needleCommand(base, implant, 'opponent'), 60)
    const controlledLocal = mapFrames(needleCommand(local, implant), 60)
    const actualCorpse = privatePvpState(controlled, 'opponent').battlefield!.entities.find(
      (entry) => entry.id === implant.target,
    )
    expect(
      controlledLocal.battlefield!.entities.find((entry) => entry.id === implant.target)
        ?.controller,
    ).toEqual(actualCorpse?.controller)
    expect(actualCorpse?.controller).toMatchObject({ side: 'player', source: 'illumi' })
  })
  it.each<FightSide>(['player', 'opponent'])(
    'records actual implantation, scripted speech, physical removal and release for %s',
    (side) => {
      let state = beginFight(
        createFight(
          side === 'player' ? 'illumi' : 'theta',
          side === 'opponent' ? 'illumi' : 'theta',
          {
            mode: 'versus-local',
            formatId: 'knockout',
            environment: {
              preparation: { mode: 'scenario', resources: ['corpses', 'hostages'], cohorts: [] },
            },
          },
        ),
      )
      state = { ...state, [side]: { ...state[side], aura: 100 } }
      expect(
        arsenalOptions(state, side).find(
          (option) =>
            option.command.action === 'illumi-corpse' && option.command.target === `${side}:corpse`,
        )?.ready,
      ).toBe(true)
      const recorder = createReplayRecorder(state)!
      const plan: Record<number, ArsenalCommand> = {
        0: { action: 'illumi-corpse', target: `${side}:corpse` },
        61: { action: 'illumi-corpse-speak', target: `${side}:corpse` },
        62: { action: 'illumi-corpse-release', target: `${side}:corpse` },
        63: { action: 'judgment-return-hostage', target: `${side}:hostage` },
      }
      for (let index = 0; index < 80; index++) {
        const command = plan[index]
        const preview = command ? needleCommand(state, command, side) : state
        if (command) expect(preview).not.toBe(state)
        const packet: ReplayPacket = [
          1 / 60,
          0,
          0,
          command ? [panelReplayCommand(state, preview)] : [],
        ]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
        if (index === 60)
          expect(
            state.battlefield!.entities.find((entry) => entry.id === `${side}:corpse`)?.controller,
          ).toMatchObject({ side, source: 'illumi' })
      }
      const corpse = state.battlefield!.entities.find((entry) => entry.id === `${side}:corpse`)!
      expect(corpse.controller).toBeUndefined()
      expect(corpse.present).toBe(true)
      expect(state[side].heardCorpse?.source).toBe(corpse.id)
      expect(
        state.battlefield!.entities.find((entry) => entry.id === `${side}:hostage`),
      ).toMatchObject({ captiveOf: undefined, releasedAt: expect.any(Number), present: true })
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let index = 0; index < 100 && !replay.done; index++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
})
