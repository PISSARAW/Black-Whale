import { toggleEmperorTime } from './kurapikaActions'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions, validArsenalCommand } from './retrospectiveArsenal'
import { recordFightDeath, type FightDeathCause } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { physicalBodyKey } from './fightBodyIdentity'
import { GUM_RESUSCITATION_FRAMES } from './gumResuscitationRules'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { AsphyxiaCertificate } from './gumResuscitationTypes'

function setup(side: FightSide = 'player', scene = false): FightState {
  return beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: scene
        ? { preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] } }
        : {},
    }),
  )
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function certificate(state: FightState, side: FightSide): AsphyxiaCertificate {
  return {
    bodyKey: physicalBodyKey(state, side),
    cause: 'asphyxia',
    heartIntact: true,
    lungsIntact: true,
    airwayClear: true,
    oxygenRestored: true,
    viable: true,
    traumaHealth: 23,
  }
}
function programmed(side: FightSide = 'player'): FightState {
  const state = setup(side)
  const prepared = performArsenalCommand(state, side, { action: 'gum-program-resuscitation' })
  return {
    ...prepared,
    [side]: { ...prepared[side], asphyxiaCertificate: certificate(prepared, side) },
  }
}
function death(
  state: FightState,
  side: FightSide = 'player',
  cause: FightDeathCause = 'asphyxia',
): FightState {
  const killed: FightState = { ...state, [side]: { ...state[side], health: 0 } }
  return resolveFightOutcome(
    recordFightDeath(killed, { victimSide: side, killerSide: null, cause, fatalCondition: true }),
  )
}
describe('Hisoka’s prior order and actual asphyxia', () => {
  it.each(['player', 'opponent'] as const)(
    'performs the declared historical scene for %s without repairing its trauma',
    (side) => {
      const start = setup(side, true)
      const other = side === 'player' ? 'opponent' : 'player'
      expect(start.gumResuscitation?.victimSide).toBe(side)
      expect(start[side].health).toBe(0)
      expect(start.phase).toBe('fighting')
      expect(start[side].gumResuscitationProgram).toBeUndefined()
      expect(start[side].bodyDamage?.parts).toHaveLength(4)
      const before = frames(start, GUM_RESUSCITATION_FRAMES - 1)
      expect(before[side].health).toBe(0)
      const done = frames(before, 1)
      expect(done.gumResuscitation).toBeUndefined()
      expect(done[side].health).toBe(start[side].maxHealth / 2)
      expect(done[side].gumResuscitationCompleted).toBe(true)
      expect(done[side].bodyDamage).toEqual(start[side].bodyDamage)
      expect(done[side].openWounds).toBe(4)
      expect(done[side].gumProstheses).toBeUndefined()
      expect(done[other].health).toBe(start[other].health)
      expect(done.score).toEqual(start.score)
      expect(done.roundsWon).toEqual({ player: 0, opponent: 0 })
      expect(done.phase).toBe('fighting')
    },
  )
  it('exposes the live preparation and pays once, before death', () => {
    const state = setup()
    expect(
      arsenalOptions(state, 'player').find(
        (entry) => entry.command.action === 'gum-program-resuscitation',
      )?.ready,
    ).toBe(true)
    const ordered = programmed()
    expect(ordered.player.aura).toBe(state.player.aura - 8)
    expect(ordered.player.gumResuscitationProgram?.bodyKey).toBe('player:0')
    expect(performArsenalCommand(ordered, 'player', { action: 'gum-program-resuscitation' })).toBe(
      ordered,
    )
    const done = frames(death(ordered), GUM_RESUSCITATION_FRAMES)
    expect(done.player.health).toBe(23)
  })
  it.each(['strike', 'projectile', 'heat', 'transfer', 'judgment', 'vow', 'blood'] as const)(
    'never converts %s into a viable asphyxia',
    (cause) => {
      const outcome = death(programmed(), 'player', cause)
      expect(outcome.gumResuscitation).toBeUndefined()
      expect(outcome.player.health).toBe(0)
      expect(outcome.phase).toBe('finished')
    },
  )
  it.each(['heartIntact', 'lungsIntact', 'airwayClear', 'oxygenRestored', 'viable'] as const)(
    'refuses the historical success without %s',
    (field) => {
      const state = programmed()
      state.player.asphyxiaCertificate = { ...state.player.asphyxiaCertificate!, [field]: false }
      expect(death(state).gumResuscitation).toBeUndefined()
    },
  )
  it('needs a real prior order, an exact physical body and a positive trauma reserve', () => {
    const state = programmed()
    for (const changes of [
      { gumResuscitationProgram: undefined },
      { asphyxiaCertificate: undefined },
      { asphyxiaCertificate: { ...certificate(state, 'player'), bodyKey: 'opponent:0' } },
      { asphyxiaCertificate: { ...certificate(state, 'player'), traumaHealth: 0 } },
    ])
      expect(
        death({ ...state, player: { ...state.player, ...changes } }).gumResuscitation,
      ).toBeUndefined()
    const dead = {
      ...state,
      player: { ...state.player, health: 0, gumResuscitationProgram: undefined },
    }
    expect(performArsenalCommand(dead, 'player', { action: 'gum-program-resuscitation' })).toBe(
      dead,
    )
  })
  it('does not trigger after an ordinary knockout or at the point victory', () => {
    const state = programmed()
    expect(
      resolveFightOutcome({ ...state, player: { ...state.player, health: 0 } }).gumResuscitation,
    ).toBeUndefined()
    const scored = resolveFightOutcome({ ...state, score: { player: 0, opponent: 10 } })
    expect(scored.gumResuscitation).toBeUndefined()
  })
  it('keeps On and rejects preparation or Nen pumping while its seal applies', () => {
    const base = setup()
    const on = { ...base, player: { ...base.player, nen: { ...base.player.nen, on: true } } }
    expect(performArsenalCommand(on, 'player', { action: 'gum-program-resuscitation' })).toBe(on)
    const ordered = programmed()
    expect(
      death({ ...ordered, player: { ...ordered.player, nen: { ...ordered.player.nen, on: true } } })
        .gumResuscitation,
    ).toBeUndefined()
  })
  it('keeps a private prior order and never accepts client organ/death certificates', () => {
    const state = programmed()
    const own = privatePvpState(state, 'player')
    const other = privatePvpState(state, 'opponent')
    expect(own.player.gumResuscitationProgram).toBeDefined()
    expect(other.opponent.gumResuscitationProgram).toBeUndefined()
    expect(other.opponent.asphyxiaCertificate).toBeUndefined()
    expect(validArsenalCommand({ action: 'gum-program-resuscitation', viable: true })).toBe(false)
    const scene = setup('opponent', true)
    const mirrored = privatePvpState(scene, 'opponent')
    expect(mirrored.gumResuscitation?.victimSide).toBe('player')
  })
  it('restores the exact deterministic continuation from a mid-sequence snapshot', () => {
    const midway = frames(setup('player', true), 41)
    const decoded = decodeFightSnapshot(encodeFightSnapshot(midway), {
      player: midway.player.id,
      opponent: midway.opponent.id,
      formatId: midway.formatId,
      mode: midway.mode,
      environment: midway.environment,
    })
    expect(decoded).not.toBeNull()
    const actual = frames(midway, 80),
      restored = frames(decoded!, 80)
    expect(fightReplayHash(restored)).toBe(fightReplayHash(actual))
  })
  it('does not revive another body or reproduce the scene on the next round', () => {
    const scene = frames(setup('player', true), GUM_RESUSCITATION_FRAMES)
    const next = nextRound({ ...scene, phase: 'finished' })
    expect(next.preparedAsphyxia).toBeUndefined()
    expect(next.gumResuscitation).toBeUndefined()
    expect(beginFight(next).gumResuscitation).toBeUndefined()
  })
  it('executes its paid prior order after living aura is exhausted, without giving any new aura', () => {
    const base = programmed()
    const exhausted = { ...base, player: { ...base.player, aura: 0, auraExhausted: true } }
    const started = death(exhausted)
    expect(started.gumResuscitation).toBeDefined()
    const done = frames(started, GUM_RESUSCITATION_FRAMES)
    expect(done.player.health).toBe(23)
    expect(done.player.aura).toBe(0)
    expect(done.player.auraExhausted).toBe(true)
    const sealed = {
      ...exhausted,
      player: { ...exhausted.player, nen: { ...exhausted.player.nen, on: true } },
    }
    expect(death(sealed).gumResuscitation).toBeUndefined()
  })
  it('counts the living opponent’s Emperor Time during the entire post-mortem sequence', () => {
    const base = beginFight(
      createFight('hisoka', 'kurapika', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const ordered = performArsenalCommand(base, 'player', { action: 'gum-program-resuscitation' })
    const active = toggleEmperorTime(ordered, 'opponent')
    expect(active.opponent.kurapika?.emperorTime).toBe(true)
    const viable = {
      ...active,
      player: { ...active.player, asphyxiaCertificate: certificate(active, 'player') },
    }
    const done = frames(death(viable), GUM_RESUSCITATION_FRAMES)
    expect(done.opponent.kurapika?.lifespanFrames).toBe(GUM_RESUSCITATION_FRAMES)
    expect(done.opponent.health).toBe(active.opponent.health)
    expect(done.time).toBe(active.time)
  })
  it('retains an unspent prior order immediately after the round clock resets', () => {
    const base = frames(setup(), 120)
    const state = performArsenalCommand(base, 'player', { action: 'gum-program-resuscitation' })
    expect(state.player.gumResuscitationProgram?.preparedAt).toBeGreaterThan(0)
    const next = nextRound({ ...state, phase: 'finished' })
    expect(next.player.gumResuscitationProgram).toEqual(state.player.gumResuscitationProgram)
    expect(next.player.asphyxiaCertificate).toBeUndefined()
    const living = beginFight(next)
    const viable = {
      ...living,
      player: { ...living.player, asphyxiaCertificate: certificate(living, 'player') },
    }
    expect(death(viable).gumResuscitation).toBeDefined()
  })
  it('preserves both actual death records when two prepared Hisokas suffocate together', () => {
    const scene = beginFight(
      createFight('hisoka', 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
        },
      }),
    )
    expect(scene.deaths).toHaveLength(1)
    const done = frames(scene, 2 * GUM_RESUSCITATION_FRAMES)
    expect(done.player.gumResuscitationCompleted).toBe(true)
    expect(done.opponent.gumResuscitationCompleted).toBe(true)
    expect(done.phase).toBe('fighting')
    expect(done.roundsWon).toEqual({ player: 0, opponent: 0 })
  })
  it('keeps the ready prelude on P2’s actual body in the private local perspective', () => {
    const ready = createFight('theta', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
      },
    })
    const view = privatePvpState(ready, 'opponent')
    expect(view.player.id).toBe('hisoka')
    expect(view.preparedAsphyxia).toEqual(['player'])
    const started = beginFight(view)
    expect(started.gumResuscitation?.victimSide).toBe('player')
    expect(started.gumResuscitation?.bodyKey).toBe('opponent:0')
    expect(started.opponent.health).toBeGreaterThan(0)
  })
})
