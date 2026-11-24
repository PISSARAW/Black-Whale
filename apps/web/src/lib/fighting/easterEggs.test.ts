import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performMove,
  performAuraAttack,
  performThrow,
  tickFight,
} from './engine'
import { canAct, canGuard, canMove } from './fightActorState'
import { canStartFighterAttack } from './fighterAttacks'
import { toggleEmperorTime } from './kurapikaActions'
import {
  EASTER_EGGS,
  easterEggDefinition,
  eggBit,
  type EasterEggFighter,
} from './easterEggCatalogue'
import { canPerformEasterEgg, performEasterEgg } from './easterEggs'
import { easterEggBodyPlan } from './easterEggPoses'
import { createEasterEggScene } from './easterEggScene'
import { easterEggCaption } from './easterEggCaptions'
import { fightSoundEvents } from './audio/events'
import {
  defaultEasterEggPreferences,
  easterEggKeyCommand,
  readEasterEggPreferences,
  rememberEasterEggs,
  saveEasterEggPreferences,
} from './easterEggPreferences'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'
import { FUTURE_PREPARATION_FRAMES } from './parallelFutureTypes'
import { easterEggSecretRequirement } from './easterEggSecrets'

function ready(id: EasterEggFighter = 'hisoka', side: FightSide = 'player'): FightState {
  const requirement = easterEggSecretRequirement(id)
  const target = requirement.kind === 'opponent' ? requirement.fighters[0] : 'hisoka'
  const state = beginFight(
    createFight(side === 'player' ? id : target, side === 'opponent' ? id : target, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return { ...state, [side]: { ...state[side], easterEggSequence: 3, easterEggDiscoveries: 7 } }
}
function frames(state: FightState, count: number, input: FightInput = EMPTY_INPUT): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
const ids = Object.keys(EASTER_EGGS) as EasterEggFighter[]
const slots = [1, 2, 3, 4] as const

describe('Clash cosmetic scenes', () => {
  it.each(ids)('plays four complete, harmless scenes for %s on either side', (id) => {
    for (const side of ['player', 'opponent'] as const)
      for (const slot of slots) {
        const base = ready(id, side)
        const snapshot = structuredClone(base)
        const duration = easterEggDefinition(id, slot)!.frames
        const started = performEasterEgg(base, side, slot)
        expect(started[side].easterEgg).toMatchObject({ slot, frame: 0 })
        expect(base).toEqual(snapshot)
        const almost = frames(started, duration - 1)
        expect(almost[side].easterEgg?.frame).toBe(duration - 1)
        const finished = frames(almost, 1)
        const control = frames(base, duration)
        expect(finished[side].easterEgg).toBeUndefined()
        expect(finished[side].easterEggDiscoveries! & eggBit(slot)).toBeTruthy()
        expect(finished[side].health).toBe(control[side].health)
        expect(finished[side].aura).toBe(control[side].aura)
        expect(finished[side].nen).toEqual(control[side].nen)
        expect(finished[side].x).toBe(control[side].x)
        expect(finished[side].hatsuEffects).toEqual(control[side].hatsuEffects)
        expect(finished.battlefield).toEqual(control.battlefield)
        expect(finished.projectiles).toEqual([])
        expect(finished.score).toEqual(control.score)
        expect(finished.rng).toBe(control.rng)
      }
  })

  it('requires ordered, completed gestures for the card trick and briefcase secret', () => {
    for (const id of ['hisoka', 'leorio'] as const) {
      let state = ready(id)
      state.player = { ...state.player, easterEggSequence: 0, easterEggDiscoveries: 0 }
      expect(performEasterEgg(state, 'player', 4)).toBe(state)
      for (const slot of [1, 2, 3] as const) {
        const started = performEasterEgg(state, 'player', slot)
        expect(canPerformEasterEgg(started, 'player', 4)).toBe(false)
        state = frames(started, easterEggDefinition(id, slot)!.frames)
      }
      expect(canPerformEasterEgg(state, 'player', 4)).toBe(true)
      const wrong = frames(performEasterEgg(state, 'player', 2), easterEggDefinition(id, 2)!.frames)
      expect(canPerformEasterEgg(wrong, 'player', 4)).toBe(false)
    }
  })

  it('requires a full analysis for Rihan and an actual Troupe opponent for Kurapika', () => {
    let state = ready('rihan')
    state.player = { ...state.player, easterEggDiscoveries: 0 }
    const partial = frames(performEasterEgg(state, 'player', 3), 179)
    expect(partial.player.easterEggDiscoveries).toBe(0)
    expect(canPerformEasterEgg(frames(partial, 1), 'player', 4)).toBe(true)
    state = ready('kurapika')
    expect(canPerformEasterEgg(state, 'player', 4)).toBe(true)
    state.opponent = { ...state.opponent, id: 'leorio' }
    expect(canPerformEasterEgg(state, 'player', 4)).toBe(false)
  })

  it('rejects unavailable bodies and noncombat phases without changing state', () => {
    const base = ready()
    for (const player of [
      { ...base.player, y: 1 },
      { ...base.player, hitStun: 8 },
      { ...base.player, blockStun: 8 },
      { ...base.player, health: 0 },
      { ...base.player, blocking: true },
      { ...base.player, knockdownFrames: 10 },
      { ...base.player, wakeupInvulnerableFrames: 10 },
      { ...base.player, chainJail: { owner: 'opponent' as const, x: 22, y: 0 } },
    ]) {
      const invalid = { ...base, player }
      expect(performEasterEgg(invalid, 'player', 1)).toBe(invalid)
    }
    for (const phase of ['ready', 'finished'] as const) {
      const invalid = { ...base, phase }
      expect(performEasterEgg(invalid, 'player', 1)).toBe(invalid)
    }
    const other = beginFight(createFight('morena', 'hisoka'))
    expect(performEasterEgg(other, 'player', 1)).toBe(other)
  })

  it('locks movement, guard and all attack routes without buffering a later attack', () => {
    const state = performEasterEgg(ready('kurapika'), 'player', 2)
    expect(canAct(state.player)).toBe(false)
    expect(canMove(state.player)).toBe(false)
    expect(canGuard(state.player)).toBe(false)
    expect(canStartFighterAttack(state.player, 'light')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'special' })).toBe(state)
    expect(performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })).toBe(
      state,
    )
    expect(performThrow(state, 'player')).toBe(state)
    expect(toggleEmperorTime(state, 'player')).toBe(state)
    const held = frames(state, 40, {
      ...EMPTY_INPUT,
      right: true,
      jump: true,
      guard: true,
      down: true,
      aura: true,
    })
    expect(held.player.x).toBe(state.player.x)
    expect(held.player.y).toBe(0)
    expect(held.player.blocking).toBe(false)
    expect(held.player.bufferedAttack).toBeNull()
  })

  it.each(['light', 'ranged'] as const)(
    'interrupts on a real %s hit, with normal damage and no discovery',
    (kind) => {
      let state = ready('rihan')
      state.player = { ...state.player, x: 42, easterEggDiscoveries: 0 }
      state.opponent = { ...state.opponent, x: 48 }
      state = performEasterEgg(state, 'player', 3)
      const before = state.player.health
      state = frames(performAttack(state, 'opponent', kind), 45)
      expect(state.player.health).toBeLessThan(before)
      expect(state.player.easterEgg).toBeUndefined()
      expect(state.player.easterEggDiscoveries).toBe(0)
      expect(state.player.easterEggSequence).toBe(0)
    },
  )

  it('uses fixed frames, pauses in hitstop and clears playback at the round verdict', () => {
    const state = performEasterEgg(ready(), 'player', 1)
    const batch = tickFight(state, EMPTY_INPUT, { dt: 3 / 60, opponentInput: EMPTY_INPUT })
    expect(batch.player.easterEgg).toEqual(frames(state, 3).player.easterEgg)
    const stopped = frames({ ...state, hitstop: 3 }, 3)
    expect(stopped.player.easterEgg?.frame).toBe(0)
    const ended = frames({ ...state, remainingFrames: 1, time: 1 / 60 }, 1)
    expect(ended.phase).toBe('finished')
    expect(ended.player.easterEgg).toBeUndefined()
    const round = nextRound(ended)
    expect(round.player.easterEggSequence).toBeUndefined()
    expect(round.player.easterEggDiscoveries).toBeUndefined()
  })

  it('has distinct animated poses and caption beats in both languages', () => {
    const poses = new Set<string>()
    for (const id of ids)
      for (const slot of slots) {
        const fighter = performEasterEgg(ready(id), 'player', slot).player
        fighter.easterEgg = { ...fighter.easterEgg!, frame: 45 }
        poses.add(JSON.stringify(easterEggBodyPlan(fighter)?.pose))
        expect(easterEggCaption(fighter, 'fr')).not.toBe('')
        expect(easterEggCaption(fighter, 'en')).not.toBe('')
      }
    expect(poses.size).toBe(ids.length * 4)
    const rihan = frames(performEasterEgg(ready('rihan'), 'player', 4), 140)
    expect(easterEggCaption(rihan.player, 'fr')).toBe('Informations insuffisantes.')
    expect(easterEggCaption(rihan.player, 'en')).toBe('Insufficient information.')
  })

  it('keeps props out of simulation and disposes both sides of the scene', () => {
    const scene = new THREE.Scene()
    const hand = new THREE.Group()
    hand.position.set(50, 2, 0.3)
    const renderer = createEasterEggScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      handAnchor: () => hand,
    })
    for (const id of ids)
      for (const slot of slots) {
        const state = frames(performEasterEgg(ready(id), 'player', slot), 50)
        const original = structuredClone(state)
        renderer.sync(state, 1)
        expect(state).toEqual(original)
        expect(scene.getObjectByName('easter-egg-props-player')?.visible).toBe(true)
        if (id === 'hisoka' && slot === 1) {
          const card = scene.getObjectByName('easter-egg-props-player')!.children[0] as THREE.Mesh
          expect(card.getWorldPosition(new THREE.Vector3()).distanceTo(hand.position)).toBeLessThan(
            0.001,
          )
          expect(card.material).toBeInstanceOf(THREE.MeshBasicMaterial)
        }
      }
    renderer.sync(ready(), 2)
    expect(scene.children.every((child) => !child.visible)).toBe(true)
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
  })

  it('emits short audio cues once on entry and at the scene beat', () => {
    const before = ready()
    const started = performEasterEgg(before, 'player', 1)
    const cues = (a: FightState, b: FightState) =>
      fightSoundEvents(a, b).filter((event) => event.kind === 'easter-egg')
    expect(cues(before, started)).toHaveLength(1)
    expect(cues(started, frames(started, 1))).toHaveLength(0)
    const preBeat = frames(started, 48)
    expect(cues(preBeat, frames(preBeat, 2))).toHaveLength(1)
  })
})

describe('Easter Egg controls and collection', () => {
  it('simulates scenes in Parallel Future without discovering a predicted ending', () => {
    let state = beginFight(createFight('tserriednich', 'hisoka', { mode: 'versus-local' }))
    state = frames(performAttack(state, 'player', 'special'), FUTURE_PREPARATION_FRAMES - 1)
    state = performEasterEgg(state, 'opponent', 1)
    expect(state.opponent.easterEgg).toBeDefined()
    state = frames(state, 26)
    const forecast = state.parallelFuture!.frames
    expect(forecast[0].opponent.easterEgg).toBeDefined()
    expect(forecast[100].opponent.easterEgg).toBeUndefined()
    expect(forecast[100].opponent.easterEggDiscoveries).toBe(1)
    const preferences = defaultEasterEggPreferences()
    expect(rememberEasterEggs(preferences, state)).toBe(preferences)
  })
  it('maps relative directions for both players and refuses AI controls', () => {
    const state = ready()
    const keys = defaultEasterEggPreferences().keys
    const options = { state, keys, input: EMPTY_INPUT, opponentInput: EMPTY_INPUT }
    expect(easterEggKeyCommand('1', options)).toEqual({ side: 'player', slot: 1 })
    expect(
      easterEggKeyCommand('1', { ...options, input: { ...EMPTY_INPUT, right: true } })?.slot,
    ).toBe(2)
    expect(
      easterEggKeyCommand('8', { ...options, opponentInput: { ...EMPTY_INPUT, left: true } })?.slot,
    ).toBe(2)
    expect(
      easterEggKeyCommand('8', { ...options, opponentInput: { ...EMPTY_INPUT, right: true } })
        ?.slot,
    ).toBe(3)
    expect(
      easterEggKeyCommand('1', { ...options, input: { ...EMPTY_INPUT, down: true } })?.slot,
    ).toBe(4)
    expect(
      easterEggKeyCommand('8', { ...options, state: { ...state, mode: 'versus-ai' } }),
    ).toBeNull()
  })

  it('migrates the old defaults while retaining discoveries and explicit legacy choices', () => {
    let record = JSON.stringify({
      keys: { player: 'F2', opponent: 'F7' },
      discoveries: { leorio: 1 },
    })
    const storage = {
      getItem: () => record,
      setItem: (_key: string, value: string) => {
        record = value
      },
    }
    expect(readEasterEggPreferences(storage)).toEqual({
      keys: { player: '1', opponent: 'F7' },
      discoveries: { leorio: 1 },
    })
    const legacy = { keys: { player: 'F2', opponent: 'F4' }, discoveries: { leorio: 1 } }
    saveEasterEggPreferences(legacy, storage)
    expect(readEasterEggPreferences(storage)).toEqual(legacy)
  })

  it('persists only completed discoveries, validates saves and ignores forecast snapshots', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    }
    const fresh = defaultEasterEggPreferences()
    let state = ready('leorio')
    state.player = { ...state.player, easterEggDiscoveries: 0 }
    state = performEasterEgg(state, 'player', 1)
    expect(rememberEasterEggs(fresh, frames(state, 20))).toBe(fresh)
    const completed = frames(state, 72)
    const collected = rememberEasterEggs(fresh, completed)
    expect(collected.discoveries.leorio).toBe(1)
    expect(rememberEasterEggs(fresh, { ...completed, forecastSimulation: true })).toBe(fresh)
    saveEasterEggPreferences({ ...collected, keys: { player: 'F7', opponent: 'F8' } }, storage)
    expect(readEasterEggPreferences(storage)).toEqual({
      ...collected,
      keys: { player: 'F7', opponent: 'F8' },
    })
    for (const key of data.keys()) data.set(key, '{broken')
    expect(readEasterEggPreferences(storage)).toEqual(fresh)
    const blocked = {
      getItem() {
        throw new Error('denied')
      },
      setItem() {
        throw new Error('denied')
      },
    } as unknown as Storage
    expect(readEasterEggPreferences(blocked)).toEqual(fresh)
    expect(() => saveEasterEggPreferences(collected, blocked)).not.toThrow()
  })
})
