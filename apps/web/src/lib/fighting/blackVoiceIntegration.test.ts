import { decodeFightSnapshot, encodeFightSnapshot } from './fightReplaySnapshot'
import * as THREE from 'three'
import { createBlackVoiceScene } from './blackVoiceScene'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { blackVoiceAi } from './blackVoiceAi'
import { advanceBlackVoice } from './blackVoiceFrame'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { resolveFightOutcome } from './fightOutcome'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function ready(side: FightSide = 'player'): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'hisoka',
      side === 'player' ? 'hisoka' : 'chrollo',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...base,
    [side]: {
      ...base[side],
      x: side === 'player' ? 44 : 49,
      aura: 100,
      chrolloBook: { ...base[side].chrolloBook!, page: 1 },
    },
    [other]: { ...base[other], x: side === 'player' ? 49 : 44 },
  }
}
function planted(side: FightSide = 'player'): FightState {
  let state = ready(side)
  state = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: 'chrollo:neutralSpecial',
    auraCharged: false,
  })
  for (let frame = 0; frame < 55; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function controlled(side: FightSide = 'player'): FightState {
  const phone = performArsenalCommand(planted(side), side, { action: 'voice-phone' })
  return performArsenalCommand(phone, side, {
    action: 'voice-stay',
    target: side === 'player' ? 'opponent' : 'player',
  })
}

describe('Black Voice at command, replay and death boundaries', () => {
  it('uses P2 local body references without transferring private phone information', () => {
    const state = performArsenalCommand(planted('opponent'), 'opponent', { action: 'voice-phone' })
    const view = privatePvpState(state, 'opponent')
    const option = arsenalOptions(view, 'player').find(
      (entry) => entry.command.action === 'voice-stay' && entry.ready,
    )!
    expect(option.command.target).toBe('body:opponent:0')
    const ordered = applyPvpCommand(state, 'opponent', { kind: 'arsenal', command: option.command })
    expect(ordered.player.blackVoiceControl).toMatchObject({ owner: 'opponent', active: true })
    expect(
      advanceBlackVoice(privatePvpState(ordered, 'player')).player.blackVoiceControl?.active,
    ).toBe(true)
    const watch = performArsenalCommand(ordered, 'opponent', {
      action: 'voice-watch',
      target: 'player',
    })
    expect(
      watch.opponent.blackVoiceScreen?.pictures.some((image) => image.appearance === 'chrollo'),
    ).toBe(true)
    expect(privatePvpState(watch, 'player').opponent.blackVoiceScreen).toBeUndefined()
    expect(privatePvpState(watch, 'player').opponent.blackVoiceGear?.antennas).toEqual([])
    const blind = {
      ...watch,
      player: { ...watch.player, hatsuEffects: { ...watch.player.hatsuEffects, senseSeals: 1 } },
    }
    const blank = performArsenalCommand(blind, 'opponent', {
      action: 'voice-watch',
      target: 'player',
    })
    expect(blank.opponent.blackVoiceScreen).toMatchObject({ blank: true, pictures: [] })
  })
  it('renders original held objects and keeps an implanted antenna visible after its Nen ends', () => {
    const scene = new THREE.Scene()
    const effect = createBlackVoiceScene({
      THREE,
      scene,
      worldX: (x) => x * 0.1,
      worldY: (y) => y * 0.1,
    })
    const base = ready(),
      phoneId = base.player.blackVoiceGear!.phone!.id
    effect.sync(base, 0)
    expect(scene.getObjectByName(phoneId)).toBeUndefined()
    const ordered = controlled()
    effect.sync(ordered, 0)
    expect(scene.getObjectByName(phoneId)?.visible).toBe(true)
    const pinId = ordered.opponent.blackVoiceControl!.antenna.id
    expect(scene.getObjectByName(pinId)?.visible).toBe(true)
    const lost = resolveFightOutcome({ ...ordered, player: { ...ordered.player, health: 0 } })
    effect.sync(lost, 1)
    expect(scene.getObjectByName(pinId)?.visible).toBe(true)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('lets the AI operate its real phone after a landed implantation', () => {
    const state = planted('opponent')
    expect(state.player.blackVoiceControl).toMatchObject({ active: false })
    const phone = blackVoiceAi(state)!
    expect(phone.opponent.blackVoiceGear?.phone?.hand).toBeDefined()
    const ordered = blackVoiceAi(phone)!
    expect(ordered.player.blackVoiceControl).toMatchObject({ active: true, order: 'stay' })
  })
  it('releases the Nen at death and never replenishes lost physical gear between rounds', () => {
    const state = controlled()
    const dead = resolveFightOutcome({ ...state, player: { ...state.player, health: 0 } })
    expect(dead.opponent.blackVoiceControl).toMatchObject({ active: false })
    const dropped = performArsenalCommand(state, 'player', {
      action: 'voice-drop',
      target: 'phone',
    })
    const round = nextRound({ ...dropped, phase: 'finished', matchWinner: null })
    expect(round.player.blackVoiceGear?.phone).toBeUndefined()
    expect(round.player.blackVoiceGear?.antennas).toHaveLength(1)
  })
  it('accepts absent real possessions in snapshots while validating a phone that remains present', () => {
    const state = ready()
    const setup = {
      player: state.player.id,
      opponent: state.opponent.id,
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    }
    const dropped = performArsenalCommand(state, 'player', {
      action: 'voice-drop',
      target: 'phone',
    })
    expect(
      decodeFightSnapshot(encodeFightSnapshot(dropped), setup).player.blackVoiceGear?.phone,
    ).toBeUndefined()
    const malformed = {
      ...state,
      player: {
        ...state.player,
        blackVoiceGear: {
          ...state.player.blackVoiceGear!,
          phone: { ...state.player.blackVoiceGear!.phone!, pairId: undefined },
        },
      },
    }
    expect(() =>
      decodeFightSnapshot(encodeFightSnapshot(malformed as unknown as FightState), setup),
    ).toThrow('invalid-replay')
    const basho = beginFight(createFight('basho', 'hisoka', { mode: 'versus-local' }))
    const withoutKit = performArsenalCommand(basho, 'player', { action: 'writing-drop' })
    expect(withoutKit.player.writingKit).toBeUndefined()
    expect(createReplayRecorder(withoutKit)).not.toBeNull()
  })
  it('copies the original phone’s appearance without copying its Nen binding', () => {
    let state = performArsenalCommand(ready(), 'player', { action: 'voice-drop', target: 'phone' })
    const original = state.battlefield!.entities.find(
      (entry) => entry.blackVoicePiece?.part === 'phone',
    )!
    state = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
    }
    state = copyHistoricalObject(state, 'player', original.id)
    const copy = state.battlefield!.entities.find((entry) => entry.copy)!
    expect(copy.blackVoiceProp).toBe('phone')
    expect(copy.blackVoicePiece).toBeUndefined()
    expect(
      performArsenalCommand(state, 'player', { action: 'voice-pickup', target: copy.id }),
    ).toBe(state)
  })
  it('replays a real antenna strike, phone orders and observation through export/import', () => {
    let state = ready()
    const recorder = createReplayRecorder(state)!
    function packet(entry: ReplayPacket) {
      const after = executeReplayPacket(state, entry)
      recorder.append(state, entry, after)
      state = after
    }
    function command(run: (current: FightState) => FightState) {
      const after = run(state)
      expect(after).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, after)]])
    }
    packet([0, 0, 0, [{ kind: 'move', side: 'player', action: 'special', input: 0 }]])
    for (let frame = 0; frame < 55; frame++) packet([1 / 60, 0, 0, []])
    expect(state.opponent.blackVoiceControl).toBeDefined()
    command((s) => performArsenalCommand(s, 'player', { action: 'voice-phone' }))
    command((s) => performArsenalCommand(s, 'player', { action: 'voice-stay', target: 'opponent' }))
    for (let frame = 0; frame < 100; frame++) packet([1 / 60, 0, 0, []])
    command((s) =>
      performArsenalCommand(s, 'player', { action: 'voice-watch', target: 'opponent' }),
    )
    command((s) => performArsenalCommand(s, 'player', { action: 'voice-pocket' }))
    const playback = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    while (!playback.done) playback.advance(0.1)
    expect(playback.error).toBe('')
    expect(fightReplayHash(playback.state)).toBe(fightReplayHash(state))
  })
})
