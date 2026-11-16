import { performTrainingAction as performMove } from './trainingAction'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { resetTraining, setTrainingDummy, setTrainingResources } from './trainingSession'
import {
  playTrainingRecording,
  toggleTrainingRecording,
  setTrainingLoop,
} from './trainingRecording'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import { trainingCanAct } from './trainingMeasurement'
import { attackData, attackTotal } from './frameData'

function lab(): FightState {
  return resetTraining(
    beginFight(createFight('hisoka', 'phinks', { mode: 'training', formatId: 'knockout' })),
  )
}
function frame(
  state: FightState,
  input: Partial<FightInput> = {},
  opponent: Partial<FightInput> = {},
): FightState {
  return tickFight(
    state,
    { ...EMPTY_INPUT, ...input },
    { dt: FIXED_STEP, opponentInput: { ...EMPTY_INPUT, ...opponent }, ai: false },
  )
}
function advance(state: FightState, frames: number, input: Partial<FightInput> = {}): FightState {
  for (let i = 0; i < frames; i++) state = frame(state, input)
  return state
}

describe('training session and resets', () => {
  it.each(['center', 'left', 'right'] as const)(
    'rebuilds the entire scenario at %s without carrying effects or forecasts',
    (position) => {
      let state = setTrainingResources(lab(), 'player', { health: 85, aura: 37 })
      state = setTrainingDummy(state, { behavior: 'guard' })
      const dirty: FightState = {
        ...state,
        frame: 42,
        hitstop: 6,
        frameAccumulator: 0.01,
        rng: 2,
        bungeeGum: { owner: 'player', target: 'opponent', hidden: false, retracting: true },
        player: {
          ...state.player,
          health: 1,
          attack: {
            kind: 'special',
            frame: 15,
            impacted: true,
            auraCharged: false,
            concealed: true,
            hatsuSource: 'hisoka',
            projectileSpawned: false,
            reversal: false,
          },
          moonlightZetsu: true,
          needlePuppet: { owner: 'opponent', order: 'stay', needleEmbedded: true },
        },
        opponent: { ...state.opponent, hitStun: 14, knockdownFrames: 30 },
      }
      const next = resetTraining(dirty, position)
      const expected = { center: [44, 56], left: [7, 19], right: [81, 93] }[position]
      expect([next.player.x, next.opponent.x]).toEqual(expected)
      expect(next.player).toMatchObject({ health: 85, aura: 37, attack: null, facing: 1 })
      expect(next.opponent).toMatchObject({ hitStun: 0, knockdownFrames: 0, facing: -1 })
      expect(next.player.moonlightZetsu).toBeUndefined()
      expect(next.player.needlePuppet).toBeUndefined()
      expect(next).toMatchObject({
        frame: 0,
        frameAccumulator: 0,
        hitstop: 0,
        bungeeGum: null,
        projectiles: [],
        phase: 'fighting',
      })
      expect(next.training!.settings).toEqual(state.training!.settings)
      expect(dirty.player.health).toBe(1)
      expect(next.battlefield).not.toBe(dirty.battlefield)
    },
  )
  it('is unavailable in real duels', () => {
    const duel = beginFight(createFight('hisoka', 'phinks', { mode: 'versus-local' }))
    expect(duel.training).toBeUndefined()
    expect(resetTraining(duel)).toBe(duel)
    expect(setTrainingResources(duel, 'player', { aura: 100 })).toBe(duel)
  })
  it('clamps editable resources and preserves Nen seals and earned conditions', () => {
    const state = lab()
    const sealed = {
      ...state,
      player: {
        ...state.player,
        moonlightZetsu: true,
        hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    const next = setTrainingResources(sealed, 'player', {
      health: -4,
      aura: 999,
      infiniteAura: true,
    })
    expect(next.player).toMatchObject({ health: 1, aura: 100, moonlightZetsu: true })
    const rejected = performMove({ state: next, side: 'player', action: 'special' })
    expect(rejected.player.attack).toBeNull()
    expect(rejected.training!.history.at(-1)?.outcome).toBe('refused')
    expect(next.player.hatsuEffects.hatsuStolen).toBe(1)
  })
  it('refills fixed resources per simulated frame without copying equipment or removing theft', () => {
    let state = setTrainingResources(lab(), 'player', {
      aura: 90,
      health: 200,
      infiniteAura: true,
      infiniteHealth: true,
    })
    state = {
      ...state,
      player: {
        ...state.player,
        health: 5,
        aura: 8,
        stolenChainAbility: { owner: 'opponent', moveId: 'hisoka:neutralSpecial' },
      },
    }
    const next = frame(state)
    expect(next.player).toMatchObject({
      aura: 90,
      health: 200,
      stolenChainAbility: state.player.stolenChainAbility,
    })
    expect(next.player.equipment).toEqual(state.player.equipment)
  })
  it('keeps normal damage and aura costs when resource assists are off', () => {
    const state = performMove({ state: lab(), side: 'player', action: 'special' })
    expect(state.player.aura).toBeLessThan(55)
    expect(frame(state).player.aura).toBeLessThan(55)
  })
})

describe('frame-based input and command history', () => {
  it('records P1 and P2 holds and their exact duration at 60 Hz', () => {
    let state = lab()
    for (let i = 0; i < 5; i++) state = frame(state, { left: true }, { guard: true })
    const history = state.training!.history
    expect(history.filter((entry) => entry.side === 'player')).toEqual([
      expect.objectContaining({ frame: 0, label: 'left', duration: 5 }),
    ])
    expect(history.filter((entry) => entry.side === 'opponent')).toEqual([
      expect.objectContaining({ frame: 0, label: 'guard', duration: 5 }),
    ])
    state = frame(state)
    expect(state.training!.history.slice(-2)).toEqual([
      expect.objectContaining({ frame: 5, side: 'player', label: 'neutral' }),
      expect.objectContaining({ frame: 5, side: 'opponent', label: 'neutral' }),
    ])
  })
  it('samples all fixed frames in a slow rendering tick', () => {
    const state = tickFight(
      lab(),
      { ...EMPTY_INPUT, left: true },
      { dt: FIXED_STEP * 3, opponentInput: EMPTY_INPUT },
    )
    expect(state.frame).toBe(3)
    expect(state.training!.history[0].duration).toBe(3)
  })
  it('labels accepted, refused and buffered commands once despite nested engine routing', () => {
    let state = performMove({ state: lab(), side: 'player', action: 'light' })
    expect(state.training!.history).toHaveLength(1)
    expect(state.training!.history[0].outcome).toBe('started')
    state = performMove({ state, side: 'player', action: 'heavy' })
    expect(state.training!.history.at(-1)?.outcome).toBe('refused')
    const total = attackTotal(attackData(state.player.attack!.kind, state.player))
    state = {
      ...state,
      player: { ...state.player, attack: { ...state.player.attack!, frame: total - 2 } },
    }
    state = performMove({ state, side: 'player', action: 'heavy' })
    expect(state.training!.history.at(-1)?.outcome).toBe('buffered')
    expect(state.player.bufferedAttack).not.toBeNull()
  })
  it('records throw and direct projectile commands', () => {
    let state = performMove({ state: lab(), side: 'player', action: 'throw' })
    expect(state.training!.history[0].label).toBe('throw')
    state = performMove({ state, side: 'opponent', action: 'ranged' })
    expect(state.training!.history.at(-1)?.label).toBe('ranged')
  })
  it('retains a bounded chronological history and never mutates older snapshots', () => {
    const original = lab()
    let state = original
    for (let i = 0; i < 100; i++) state = frame(state, { left: i % 2 === 0 })
    expect(state.training!.history).toHaveLength(60)
    expect(state.training!.history[0].id).toBeGreaterThan(1)
    expect(original.training!.history).toEqual([])
  })
})

describe('configurable training dummy', () => {
  it.each(['idle', 'guard', 'crouch-guard', 'jump'] as const)(
    'executes the %s preset through ordinary controls',
    (behavior) => {
      let state = setTrainingDummy(lab(), { behavior })
      state = advance(state, 8)
      expect(state.opponent.blocking).toBe(behavior.includes('guard'))
      expect(state.opponent.crouching).toBe(behavior === 'crouch-guard')
      if (behavior === 'jump') expect(state.opponent.y).toBeGreaterThan(0)
      expect(state.opponent.attack).toBeNull()
    },
  )
  it('repeats a selected physical attack and records it', () => {
    const state = frame(setTrainingDummy(lab(), { behavior: 'attack', action: 'heavy' }))
    expect(state.opponent.attack?.kind).toBe('heavy')
    expect(
      state.training!.history.some((entry) => entry.side === 'opponent' && entry.label === 'heavy'),
    ).toBe(true)
  })
  it('waits until recovery then applies the configured reversal delay once', () => {
    let state = setTrainingDummy(lab(), { behavior: 'reversal', action: 'light', delay: 2 })
    state = { ...state, opponent: { ...state.opponent, hitStun: 3 } }
    state = advance(state, 5)
    expect(state.opponent.attack).toBeNull()
    expect(trainingCanAct(state.opponent)).toBe(true)
    state = frame(state)
    expect(state.opponent.attack?.kind).toBe('light')
    expect(state.training!.reversalArmed).toBe(false)
  })
  it('does not invent a Hatsu finisher condition for the dummy', () => {
    const state = frame(setTrainingDummy(lab(), { behavior: 'attack', action: 'finisher' }))
    expect(state.opponent.attack).toBeNull()
    expect(state.opponent.hatsuEffects.cyclotronTurns).toBe(0)
  })
})

describe('dummy recording playback', () => {
  it('keeps input-only tracks and trailing holds until the recorded end, then releases', () => {
    let state = toggleTrainingRecording(lab())
    for (let i = 0; i < 8; i++) state = frame(state, {}, { guard: true })
    state = toggleTrainingRecording(state)
    expect(state.training!.recording.duration).toBe(8)
    expect(state.training!.recording.commands).toEqual([])
    state = playTrainingRecording(state)
    state = advance(state, 8)
    expect(state.opponent.blocking).toBe(true)
    state = frame(state)
    expect(state.opponent.blocking).toBe(false)
    expect(state.training!.recording.playing).toBe(false)
  })
  it('replays a same-frame direction and attack in its original context', () => {
    let state = toggleTrainingRecording(lab())
    state = performMove({
      state,
      side: 'opponent',
      action: 'light',
      input: { ...EMPTY_INPUT, down: true },
    })
    state = advance(state, 35)
    state = toggleTrainingRecording(state)
    state = playTrainingRecording(resetTraining(state))
    state = frame(state)
    expect(state.opponent.attack?.moveId).toBe('phinks:lowLight')
    expect(state.training!.recording.commands).toHaveLength(1)
  })
  it('loops at simulation-frame boundaries and reset retains the track but stops playback', () => {
    let state = toggleTrainingRecording(lab())
    state = frame(state, {}, { guard: true })
    state = frame(state)
    state = toggleTrainingRecording(state)
    state = setTrainingLoop(playTrainingRecording(state), true)
    state = frame(state)
    expect(state.opponent.blocking).toBe(true)
    state = frame(state)
    expect(state.opponent.blocking).toBe(false)
    state = frame(state)
    expect(state.opponent.blocking).toBe(true)
    state = resetTraining(state, 'right')
    expect(state.training!.recording).toMatchObject({
      playing: false,
      recording: false,
      duration: 2,
      loop: true,
    })
  })
  it('gives recording priority over an automatic dummy preset', () => {
    let state = toggleTrainingRecording(setTrainingDummy(lab(), { behavior: 'attack' }))
    state = frame(state, {}, { guard: true })
    expect(state.opponent.attack).toBeNull()
    expect(state.opponent.blocking).toBe(true)
    expect(state.training!.recording.inputs[0].input.guard).toBe(true)
  })
  it('does not record speculative future commands or refill speculative resources', () => {
    const state = toggleTrainingRecording(lab())
    const forecast = { ...state, forecastSimulation: true }
    const next = performMove({ state: forecast, side: 'opponent', action: 'light' })
    expect(next.training).toBe(state.training)
    expect(next.training!.history).toEqual([])
  })
})

describe('lab resource aids retain Hatsu conditions', () => {
  it('editing Feitan HP does not manufacture the injuries needed for Pain Packer', () => {
    const state = beginFight(createFight('feitan', 'phinks', { mode: 'training' }))
    const edited = setTrainingResources(state, 'player', {
      health: 1,
      aura: 100,
      infiniteAura: true,
    })
    expect(edited.player.hatsuEffects.painPacker?.injuries).toBe(0)
    expect(
      performMove({ state: edited, side: 'player', action: 'special' }).player.attack,
    ).toBeNull()
  })
  it('fixed HP does not resurrect Camilla in the middle of her post-mortem sequence', () => {
    let state = resetTraining(beginFight(createFight('camilla', 'phinks', { mode: 'training' })))
    state = { ...state, opponent: { ...state.opponent, x: 50 } }
    state = setTrainingResources(state, 'player', { health: 1, infiniteHealth: true })
    state = performMove({ state, side: 'opponent', action: 'light' })
    for (let i = 0; i < 30 && !state.catsName; i++) state = frame(state)
    expect(state.catsName).toBeDefined()
    expect(state.player.health).toBe(0)
    state = frame(state)
    expect(state.player.health).toBe(0)
    expect(state.catsName).toBeDefined()
  })
})
