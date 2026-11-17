import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import { groundedComboStun } from './groundedComboStun'
import { probeGroundedExchange } from './exchangeProbe'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { strikeDefender, strikeProjectileDefender } from './combatDamage'
import { EMPTY_INPUT, type FightSide } from './types'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayRecorder } from './fightReplayRecorder'
import { REPLAY_RULESET } from './fightReplayTypes'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { packReplayInput } from './fightReplayInput'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import type { ReplayPacket } from './fightReplayTypes'

describe('grounded exchanges retain a defensive opportunity', () => {
  for (const { id } of FIGHTING_ROSTER)
    for (const side of ['player', 'opponent'] as const)
      it.each(['center', 'left', 'right'] as const)(`${id} as ${side}, %s`, (position) => {
        const result = probeGroundedExchange({ fighter: id, defender: 'bill', side, position })
        expect(result.hits).toBeGreaterThanOrEqual(3)
        expect(result.maxCombo).toBeLessThanOrEqual(6)
        // At the corners spacing cannot create an accidental escape: guard must actually work.
        if (position !== 'center') expect(result.guardAt).not.toBeNull()
      })
  it.each(['bill', 'melody', 'morena', 'yokotani'] as const)(
    'gives support defender %s a real guard against the fastest jab',
    (defender) => {
      expect(
        probeGroundedExchange({ fighter: 'feitan', defender, position: 'right' }).guardAt,
      ).not.toBeNull()
    },
  )
})

function attack(side: FightSide = 'player') {
  const state = beginFight(createFight('hisoka', 'bill', { mode: 'versus-local' }))
  return performMove({ state, side, action: 'light', input: EMPTY_INPUT })
}

describe('hitstun tuning is limited to long grounded physical combos', () => {
  it('replays the actual escape from a long corner string with identical checkpoints', () => {
    let state = beginFight(createFight('feitan', 'bill', { mode: 'training' }))
    state = setTrainingDummy(state, { behavior: 'manual' })
    state = setTrainingResources(state, 'opponent', { infiniteHealth: true })
    state = { ...state, player: { ...state.player, x: 87 }, opponent: { ...state.opponent, x: 93 } }
    const recorder = createReplayRecorder(state)!
    let blocked = false
    for (let frame = 0; frame < 240; frame++) {
      const packet: ReplayPacket = [
        1 / 60,
        0,
        packReplayInput({ ...EMPTY_INPUT, guard: frame > 50 }),
        [{ kind: 'move', side: 'player', action: 'light', input: 0 }],
      ]
      const after = executeReplayPacket(state, packet)
      recorder.append(state, packet, after)
      state = after
      blocked ||= Boolean(state.impact?.blocked || state.impact?.parried)
    }
    expect(blocked).toBe(true)
    const replay = decodeFightReplay(JSON.stringify(recorder.snapshot()))
    const player = createReplayPlayer(replay)
    while (!player.done) player.advance(0.05)
    expect(player.error).toBe('')
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
  })
  it('preserves the first three contacts, including existing corner and counter bonuses', () => {
    const state = attack()
    for (const comboHits of [1, 2, 3])
      expect(
        groundedComboStun({
          attacker: state.player,
          defender: state.opponent,
          hitstun: 24,
          comboHits,
        }),
      ).toBe(24)
  })
  it('keeps aerial juggles and personal techniques under their existing rules', () => {
    const state = attack()
    const options = { attacker: state.player, defender: state.opponent, hitstun: 24, comboHits: 20 }
    expect(groundedComboStun({ ...options, defender: { ...state.opponent, y: 3 } })).toBe(24)
    for (const moveId of ['hisoka:neutralSpecial', 'hisoka:throw', 'hisoka:finisher'])
      expect(
        groundedComboStun({
          ...options,
          attacker: { ...state.player, attack: { ...state.player.attack!, moveId } },
        }),
      ).toBe(24)
  })
  it('never lets an unrelated current melee attack change a projectile’s stun', () => {
    const state = attack()
    const options = {
      fighter: state.opponent,
      attacker: state.player,
      damage: 4,
      blocked: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 20,
    }
    expect(strikeDefender(options).hitStun).toBe(1)
    const projectile = { knockback: 1, hitstun: 18, blockstun: 8 }
    expect(
      strikeProjectileDefender({
        ...options,
        projectile: projectile as Parameters<typeof strikeProjectileDefender>[0]['projectile'],
      }).hitStun,
    ).toBe(18)
    expect(strikeDefender({ ...options, blocked: true }).blockStun).toBe(9)
  })
  it('refuses old combat recordings instead of silently replaying them with new balance', () => {
    const before = attack()
    const recorder = createReplayRecorder(before)!
    const after = tickFight(before, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    recorder.append(before, [1 / 60, 0, 0, []], after)
    const replay = recorder.snapshot()!
    expect(decodeFightReplay(JSON.stringify(replay)).ruleset).toBe(REPLAY_RULESET)
    expect(REPLAY_RULESET).toBe('clash-combat-33')
    expect(() =>
      decodeFightReplay(JSON.stringify({ ...replay, ruleset: 'clash-combat-18' })),
    ).toThrow('replay-version')
  })
})
