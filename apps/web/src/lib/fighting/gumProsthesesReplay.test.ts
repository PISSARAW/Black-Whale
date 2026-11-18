import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup, parsePvpPacket } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { createFightEnvironment } from './fightEnvironment'
import type { ReplayPacket } from './fightReplayTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

function ready(): FightState {
  const state = beginFight(
    createFight('theta', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { opponent: 'hand-and-lower-leg' },
        },
      },
    }),
  )
  return { ...state, opponent: { ...state.opponent, health: 37, aura: 100 } }
}
function config(injuries: unknown, mode: string = 'scenario') {
  return {
    player: 'theta',
    opponent: 'hisoka',
    formatId: 'knockout',
    environment: {
      ...createFightEnvironment(),
      preparation: { mode, resources: [], cohorts: [], injuries },
    },
  }
}

describe('physical injury premises and prosthesis commands across the real network and replay boundary', () => {
  it('preserves the chosen side without providing a Hatsu or a ready-made prosthesis', () => {
    const parsed = parsePvpSetup(config({ opponent: 'hand-and-lower-leg' }))!
    expect(parsed.environment.preparation?.injuries).toEqual({ opponent: 'hand-and-lower-leg' })
    const state = createFight(parsed.player, parsed.opponent, { environment: parsed.environment })
    expect(state.player.bodyDamage).toBeUndefined()
    expect(state.opponent.bodyDamage?.parts).toEqual(['left-hand', 'right-lower-leg'])
    expect(state.opponent.gumProstheses).toBeUndefined()
    const local = privatePvpState(beginFight(state), 'opponent')
    expect(local.player.id).toBe('hisoka')
    expect(local.environment.preparation?.injuries).toEqual({ player: 'hand-and-lower-leg' })
    expect(local.player.bodyDamage?.parts).toEqual(['left-hand', 'right-lower-leg'])
  })
  it('keeps the physical support identifier identical in P2’s predicted and authoritative commands', () => {
    const state = ready()
    const command: ArsenalCommand = { action: 'gum-prosthesis' }
    const actual = performArsenalAction({ state, side: 'opponent', command }, performAuraAttack)
    const local = privatePvpState(state, 'opponent')
    const predicted = applyPvpCommand(local, 'player', { kind: 'arsenal', command })
    expect(predicted.player.gumProstheses).toEqual(actual.opponent.gumProstheses)
    expect(predicted.player.bodyDamage).toEqual(actual.opponent.bodyDamage)
  })
  it.each([
    null,
    [],
    true,
    { player: 'heal' },
    { player: { health: 999 } },
    { third: 'hand-and-lower-leg' },
    { __proto__: null, health: 999 },
  ])('rejects a forged injury premise %j', (value) => {
    expect(parsePvpSetup(config(value))).toBeNull()
  })
  it('requires an explicit scenario rather than accepting injuries hidden in an ordinary duel', () => {
    expect(parsePvpSetup(config({ player: 'hand-and-lower-leg' }, 'duel'))).toBeNull()
  })
  it.each<ArsenalCommand>([
    { action: 'gum-prosthesis' },
    { action: 'gum-prosthesis-release' },
    { action: 'texture-target', target: 'gum-prostheses' },
    { action: 'texture-apply' },
    { action: 'texture-remove' },
  ])('accepts only semantic commands without a client-supplied body for $action', (command) => {
    const packet = { sequence: 0, input: 0, commands: [{ kind: 'arsenal', command }] }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          {
            kind: 'arsenal',
            command: {
              ...command,
              gumProstheses: { parts: ['left-hand'] },
            },
          },
        ],
      }),
    ).toBeNull()
  })
  it('replays P2’s actual formation, surface selection and Texture Surprise with the same final state', () => {
    let state = ready()
    const recorder = createReplayRecorder(state)!
    const planned: Record<number, ArsenalCommand> = {
      0: { action: 'gum-prosthesis' },
      30: { action: 'texture-target', target: 'gum-prostheses' },
      31: { action: 'texture-apply' },
    }
    for (let frame = 0; frame < 100; frame++) {
      const command = planned[frame]
      const preview = command
        ? performArsenalAction({ state, side: 'opponent', command }, performAuraAttack)
        : state
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
    }
    expect(state.opponent.textureSurprise).toMatchObject({
      surface: 'gum-prostheses',
      supportId: state.opponent.gumProstheses!.id,
    })
    expect(state.opponent.health).toBe(37)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let step = 0; step < 100 && !replay.done; step++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
