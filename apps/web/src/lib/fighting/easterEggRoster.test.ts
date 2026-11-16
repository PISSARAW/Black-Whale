import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { canPerformEasterEgg, performEasterEgg, runOutsideEasterEgg } from './easterEggs'
import {
  EASTER_EGGS,
  easterEggsFor,
  eggBit,
  type EasterEggFighter,
  type EasterEggSlot,
} from './easterEggCatalogue'
import { easterEggPreviewOpponent, easterEggSecretRequirement } from './easterEggSecrets'
import { EASTER_GESTURES } from './easterEggMotion'
import { easterEggBodyPlan } from './easterEggPoses'
import { createEasterEggScene } from './easterEggScene'
import { easterEggCaption } from './easterEggCaptions'
import {
  defaultEasterEggPreferences,
  readEasterEggPreferences,
  rememberEasterEggs,
  saveEasterEggPreferences,
} from './easterEggPreferences'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from './types'

const ids = Object.keys(EASTER_EGGS) as EasterEggFighter[]
const slots = [1, 2, 3, 4] as const
function fresh(id: EasterEggFighter, side: FightSide = 'player'): FightState {
  const target = easterEggPreviewOpponent({ fighterId: id, opponentId: 'hisoka', slot: 4 })
  return beginFight(
    createFight(side === 'player' ? id : target, side === 'opponent' ? id : target, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
}
function advance(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function finishGesture(state: FightState, slot: EasterEggSlot): FightState {
  const started = performEasterEgg(state, 'player', slot)
  expect(started.player.easterEgg).toBeDefined()
  return advance(started, started.player.easterEgg!.duration)
}

describe('Every playable Clash fighter has a personal series', () => {
  it('covers exactly the selectable roster with four complete, distinct entries each', () => {
    expect(ids.sort()).toEqual(FIGHTING_ROSTER.map((fighter) => fighter.id).sort())
    expect(ids).toHaveLength(40)
    expect(ids.flatMap(easterEggsFor)).toHaveLength(160)
    for (const id of ids) {
      const scenes = easterEggsFor(id)
      expect(scenes.map((scene) => scene.slot)).toEqual(slots)
      expect(new Set(scenes.map((scene) => scene.name.fr)).size).toBe(4)
      expect(new Set(scenes.map((scene) => scene.name.en)).size).toBe(4)
      for (const scene of scenes) {
        expect(scene.frames).toBeGreaterThanOrEqual(60)
        expect(scene.frames).toBeLessThanOrEqual(240)
        expect(scene.hint.fr.length).toBeGreaterThan(10)
        expect(scene.hint.en.length).toBeGreaterThan(10)
        if (scene.motion) expect(EASTER_GESTURES[scene.motion.gesture]).toBeDefined()
      }
    }
    for (const id of ['morena', 'marayam', 'kacho', 'fugetsu'] as FighterId[])
      expect(easterEggsFor(id)).toEqual([])
  })

  it.each(ids)('can discover %s’s secret using its actual condition', (id) => {
    let state = fresh(id)
    const secret = easterEggSecretRequirement(id)
    if (secret.kind === 'sequence') {
      expect(canPerformEasterEgg(state, 'player', 4)).toBe(false)
      state = finishGesture(state, 3)
      expect(canPerformEasterEgg(state, 'player', 4)).toBe(false)
      for (const slot of [1, 2, 3] as const) state = finishGesture(state, slot)
    } else if (secret.kind === 'gesture') {
      expect(canPerformEasterEgg(state, 'player', 4)).toBe(false)
      const started = performEasterEgg(state, 'player', secret.slot)
      const partial = advance(started, started.player.easterEgg!.duration - 1)
      expect(partial.player.easterEggDiscoveries ?? 0).toBe(0)
      state = advance(partial, 1)
    } else {
      expect(secret.fighters.length).toBeGreaterThan(0)
      for (const target of secret.fighters)
        expect(FIGHTING_ROSTER.some((fighter) => fighter.id === target)).toBe(true)
      const wrong = FIGHTING_ROSTER.find((fighter) => !secret.fighters.includes(fighter.id))!.id
      const denied = { ...state, opponent: { ...state.opponent, id: wrong } }
      expect(canPerformEasterEgg(denied, 'player', 4)).toBe(false)
      expect(secret.fighters).toContain(
        easterEggPreviewOpponent({ fighterId: id, opponentId: wrong, slot: 4 }),
      )
    }
    expect(canPerformEasterEgg(state, 'player', 4)).toBe(true)
    state = finishGesture(state, 4)
    expect((state.player.easterEggDiscoveries ?? 0) & eggBit(4)).toBe(8)
  })

  it.each(ids)('keeps %s vulnerable and interrupts both sides on an ordinary hit', (id) => {
    for (const side of ['player', 'opponent'] as const) {
      let state = fresh(id, side)
      const other = side === 'player' ? 'opponent' : 'player'
      state = {
        ...state,
        [side]: { ...state[side], x: 42 },
        [other]: { ...state[other], x: 48, id: 'hisoka' },
      }
      state = performEasterEgg(state, side, 1)
      expect(state[side].easterEgg).toBeDefined()
      state = advance(performAttack(state, other, 'light'), 40)
      expect(state[side].health).toBeLessThan(state[side].maxHealth)
      expect(state[side].easterEgg).toBeUndefined()
      expect(state[side].easterEggDiscoveries ?? 0).toBe(0)
    }
  })

  it('blocks direct Hatsu-panel commands only for the performer and refuses an ongoing infusion', () => {
    const state = performEasterEgg(fresh('zakuro'), 'player', 1)
    let calls = 0
    const command = (current: FightState) => {
      calls++
      return current
    }
    expect(runOutsideEasterEgg(state, 'player', command)).toBe(state)
    expect(calls).toBe(0)
    runOutsideEasterEgg(state, 'opponent', command)
    expect(calls).toBe(1)
    const busy = fresh('zakuro')
    busy.player = {
      ...busy.player,
      bloodyMary: {
        available: 6,
        bags: 6,
        drops: [],
        infusion: { remainingFrames: 120, originX: 22, health: 250 },
      },
    }
    expect(canPerformEasterEgg(busy, 'player', 1)).toBe(false)
  })

  it('renders all props with unlit materials, follows the live hand and disposes every allocation once', () => {
    const scene = new THREE.Scene()
    const hand = new THREE.Group()
    hand.position.set(5, 2, 0.4)
    const effects = createEasterEggScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      handAnchor: () => hand,
    })
    const poses = new Set<string>()
    for (const id of ids)
      for (const slot of slots) {
        let state = fresh(id)
        state.player = { ...state.player, easterEggDiscoveries: 7, easterEggSequence: 3 }
        state = performEasterEgg(state, 'player', slot)
        state.player = {
          ...state.player,
          easterEgg: {
            ...state.player.easterEgg!,
            frame: Math.floor(state.player.easterEgg!.duration * 0.7),
          },
        }
        const before = structuredClone(state)
        effects.sync(state, 0)
        expect(state).toEqual(before)
        poses.add(JSON.stringify(easterEggBodyPlan(state.player)?.pose))
        const definition = easterEggsFor(id)[slot - 1]
        if (definition.prop) {
          const root = scene.getObjectByName('roster-easter-props-player')!
          expect(root.visible).toBe(true)
          expect(root.position.distanceTo(hand.position)).toBeLessThan(0.001)
          expect(scene.getObjectByName(`${id}-cosmetic-${definition.prop.kind}`)?.visible).toBe(
            true,
          )
        }
        expect(easterEggCaption(state.player, 'fr')).not.toBe('')
        expect(easterEggCaption(state.player, 'en')).not.toBe('')
      }
    expect(poses.size).toBe(160)
    const shapes = new Set<THREE.BufferGeometry>()
    const paints = new Set<THREE.Material>()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      shapes.add(object.geometry)
      for (const paint of Array.isArray(object.material) ? object.material : [object.material]) {
        expect(paint).toBeInstanceOf(THREE.MeshBasicMaterial)
        paints.add(paint)
      }
    })
    let shapeDisposals = 0
    let paintDisposals = 0
    shapes.forEach((shape) => shape.addEventListener('dispose', () => shapeDisposals++))
    paints.forEach((paint) => paint.addEventListener('dispose', () => paintDisposals++))
    effects.dispose()
    expect(shapeDisposals).toBe(shapes.size)
    expect(paintDisposals).toBe(paints.size)
    expect(scene.children).toHaveLength(0)
  })

  it('retains the original four collections while saving new fighters in the same storage format', () => {
    let encoded = JSON.stringify({
      keys: { player: 'F7', opponent: 'F8' },
      discoveries: { hisoka: 15, kurapika: 7, leorio: 3, rihan: 1 },
    })
    const storage = {
      getItem: () => encoded,
      setItem: (_key: string, value: string) => {
        encoded = value
      },
    }
    let preferences = readEasterEggPreferences(storage)
    for (const id of ids) {
      const state = fresh(id)
      state.player = { ...state.player, easterEggDiscoveries: 15 }
      preferences = rememberEasterEggs(preferences, state)
    }
    saveEasterEggPreferences(preferences, storage)
    const loaded = readEasterEggPreferences(storage)
    expect(loaded.keys).toEqual({ player: 'F7', opponent: 'F8' })
    expect(Object.keys(loaded.discoveries)).toHaveLength(40)
    expect(Object.values(loaded.discoveries).every((mask) => mask === 15)).toBe(true)
    expect(defaultEasterEggPreferences().discoveries).toEqual({})
  })
})
