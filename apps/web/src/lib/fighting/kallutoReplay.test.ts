import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { paperDolls } from './kallutoSurveillance'
import { paperListening } from './kallutoListening'
import { paperAbilityAvailable } from './kallutoAccess'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightState } from './types'
import type { PreparationResource } from './preparationTypes'

describe('physical paper receivers at P2, replay and Dolphin boundaries', () => {
  it('imports a recording that starts after the physical kit was dropped, with all thirteen scenario resources', () => {
    const resources: PreparationResource[] = [
      'animals',
      'birds',
      'plants',
      'objects',
      'flutes',
      'needles',
      'rooms',
      'devices',
      'writing',
      'spirits',
      'people',
      'musse-history',
      'paper',
    ]
    const base = beginFight(
      createFight('hisoka', 'kalluto', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { preparation: { mode: 'scenario', resources, cohorts: [] } },
      }),
    )
    const initial = applyPvpCommand(base, 'opponent', {
      kind: 'arsenal',
      command: { action: 'paper-kit-drop' },
    })
    expect(initial.opponent.paperKit).toBeUndefined()
    const id = base.opponent.paperKit!.sourceId
    const after = applyPvpCommand(initial, 'opponent', {
      kind: 'arsenal',
      command: { action: 'paper-kit-take', target: id },
    })
    expect(after.opponent.paperKit).toEqual(base.opponent.paperKit)
    const recorder = createReplayRecorder(initial)!
    const packet: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(initial, after)]]
    const final = executeReplayPacket(initial, packet)
    recorder.append(initial, packet, final)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 100; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(final))
  })
  it('replays P2 paper contact, doll activation, actual private speech and voluntary stop', () => {
    const base = beginFight(
      createFight('hisoka', 'kalluto', { mode: 'versus-local', formatId: 'knockout' }),
    )
    let state: FightState = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: { ...base.opponent, x: 48, aura: 100 },
    }
    const recorder = createReplayRecorder(state)!
    function packet(entry: ReplayPacket) {
      const after = executeReplayPacket(state, entry)
      recorder.append(state, entry, after)
      state = after
    }
    function command(run: (before: FightState) => FightState) {
      const after = run(state)
      expect(after).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, after)]])
    }
    for (const slot of ['neutralSpecial', 'backSpecial']) {
      command((before) =>
        performAuraAttack({
          state: before,
          side: 'opponent',
          kind: 'special',
          moveId: `kalluto:${slot}`,
          auraCharged: false,
        }),
      )
      for (let index = 0; index < 80; index++) packet([1 / 60, 0, 0, []])
    }
    expect(state.player.plantedPaper?.[0]).toMatchObject({ owner: 'opponent', ownerMember: 0 })
    command((before) =>
      applyPvpCommand(before, 'player', {
        kind: 'talk',
        words: 'Une parole effectivement prononcée.',
      }),
    )
    const view = privatePvpState(state, 'opponent')
    expect(paperDolls(view.player)[0]).toMatchObject({
      target: 'opponent',
      targetMember: 0,
      heard: { text: 'Une parole effectivement prononcée.' },
    })
    expect(paperDolls(privatePvpState(state, 'player').opponent)[0].heard).toBeUndefined()
    command((before) =>
      applyPvpCommand(before, 'opponent', {
        kind: 'arsenal',
        command: { action: 'paper-stop-listening' },
      }),
    )
    expect(paperDolls(state.opponent)[0].active).toBe(false)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 300; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
  it('uses the actual stolen reserve for an active receiver without granting the other paper Hatsu or native Ten', () => {
    const base = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    const donor = createFight('kalluto', 'hisoka').player
    const actor = {
      ...base.player,
      aura: 0,
      nen: { ...base.player.nen, mode: 'zetsu' as const },
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        held: {
          victim: 'opponent' as const,
          source: 'kalluto' as const,
          moveId: 'kalluto:backSpecial',
          loaded: true,
          used: true,
          sustainedKeys: ['paper-doll'],
          auraSupply: { ...captureDolphinAura(donor), amount: 0, committed: 12 },
        },
      },
      kallutoPaper: {
        zone: 'torso' as const,
        doll: { target: 'opponent' as const, targetMember: 0, createdAt: 0 },
      },
    }
    const state = {
      ...base,
      player: actor,
      opponent: {
        ...base.opponent,
        plantedPaper: [{ owner: 'player' as const, ownerMember: 0, zone: 'torso' as const }],
      },
    }
    expect(paperListening(state, 'player')).toBe(true)
    expect(paperAbilityAvailable(actor, 'plant')).toBe(false)
    expect(paperAbilityAvailable({ ...actor, on: { grudge: 0, sealFrames: 30 } }, 'doll')).toBe(
      false,
    )
    const different = {
      ...actor,
      kurapika: {
        ...actor.kurapika,
        held: { ...actor.kurapika.held, moveId: 'kalluto:neutralSpecial' },
      },
    }
    expect(paperAbilityAvailable(different, 'doll')).toBe(false)
    expect(paperAbilityAvailable(different, 'plant')).toBe(true)
    expect(actor.aura).toBe(0)
    expect(actor.nen.mode).toBe('zetsu')
  })
})
