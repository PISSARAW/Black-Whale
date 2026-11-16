import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { activeHitbox } from './frameData'
import { hatsuFor, hatsuSourceFor } from './hatsu'
import { finisherReady, moveForSlot, movesetFor, canUseMovesetMove } from './movesets'
import { projectileProfile, rangedAuraCost, canUseRangedAttack } from './projectiles'
import { stealableChainMove } from './kurapikaDolphin'
import { CHROLLO_STEAL } from './chrolloBook'
import { buildFightFigure } from './fighterFigure'
import { createProjectileScene } from './projectileScene'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

function duel(side: FightSide = 'player'): FightState {
  const base = beginFight(
    createFight(side === 'player' ? 'theta' : 'hisoka', side === 'player' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25, aura: 60 },
    opponent: { ...base.opponent, x: 75, aura: 60 },
  }
}
function advance(
  state: FightState,
  frames: number,
  input: FightInput = EMPTY_INPUT,
  opponentInput: FightInput = EMPTY_INPUT,
): FightState {
  for (let i = 0; i < frames; i++) state = tickFight(state, input, { dt: 1 / 60, opponentInput })
  return state
}
function cast(state: FightState, side: FightSide, slot: MoveSlot): FightState {
  const move = moveForSlot('theta', slot)!
  return performAuraAttack({
    state,
    side,
    kind: move.kind,
    moveId: move.id,
    variant: move.variant,
    auraCharged: true,
  })
}
const SPECIALS = ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial'] as const

describe('Theta’s real handgun and unknown Hatsu', () => {
  it('exposes physical pistol shots and removes the invented Nen finisher', () => {
    expect(projectileProfile('theta')).toMatchObject({
      shape: 'bullet',
      matter: 'object',
      labelFr: 'Tir de pistolet',
    })
    expect(rangedAuraCost('theta')).toBe(0)
    const moves = movesetFor('theta')!
    expect(moves.moves).toHaveLength(14)
    expect(moves.moves.filter((move) => move.category === 'special')).toHaveLength(4)
    expect(moves.moves.some((move) => move.category === 'finisher')).toBe(false)
    expect(moves.mechanicFr).toContain('Hatsu personnel reste inconnu')
    const state = duel()
    state.opponent.aura = 0
    state.opponent.hatsuEffects.forcedZetsuFrames = 90
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'theta:finisher',
        auraCharged: false,
      }),
    ).toBe(state)
  })

  it.each(['player', 'opponent'] as const)(
    'fires a travelling, non-Nen bullet with U for %s',
    (side) => {
      const state = duel(side)
      const defender = side === 'player' ? 'opponent' : 'player'
      state[defender].aura = 100
      const started = performAttack(state, side, 'ranged')
      expect(started[side].aura).toBe(state[side].aura)
      expect(started[side].attack?.hatsuSource).toBeNull()
      const flight = advance(started, 12)
      expect(flight.projectiles).toHaveLength(1)
      expect(flight.projectiles[0]).toMatchObject({
        fighterId: 'theta',
        shape: 'bullet',
        matter: 'object',
        owner: side,
      })
      expect(flight[defender].health).toBe(state[defender].health)
      expect(activeHitbox(flight[side])).toBeNull()
      const result = advance(flight, 70)
      expect(result[defender].health).toBeLessThan(state[defender].health)
      expect(result[defender].aura).toBe(100)
      expect(result[defender].hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(result[defender].nen.mode).toBe('ten')
      expect(result[defender].hatsuEffects.witnessedHatsu).toBeNull()
    },
  )

  it.each(SPECIALS)('makes %s an actual shot, usable without aura or Nen', (slot) => {
    const state = duel()
    state.player = {
      ...state.player,
      aura: 0,
      auraExhausted: true,
      nen: { ...state.player.nen, mode: 'zetsu' },
      on: { grudge: 0, sealFrames: 120 },
    }
    expect(canUseMovesetMove(state, 'player', moveForSlot('theta', slot)!)).toBe(true)
    expect(canUseRangedAttack(state.player)).toBe(true)
    const started = cast(state, 'player', slot)
    expect(started.player.attack).toMatchObject({
      kind: 'ranged',
      moveId: `theta:${slot}`,
      auraCharged: false,
      hatsuSource: null,
    })
    expect(started.player.aura).toBe(0)
    const flight = advance(started, 18, { ...EMPTY_INPUT, down: true, aura: true })
    expect(flight.projectiles).toHaveLength(1)
    expect(flight.projectiles[0].matter).toBe('object')
    if (slot === 'downSpecial') expect(flight.projectiles[0].targetZone).toBe('feet')
    if (slot === 'forwardSpecial') expect(flight.projectiles[0].targetZone).toBe('head')
  })

  it('normalizes legacy special calls into a gunshot, including zero aura', () => {
    const state = duel()
    state.player.aura = 0
    state.player.nen.mode = 'zetsu'
    const legacy = performAuraAttack({ state, side: 'player', kind: 'special', auraCharged: false })
    expect(legacy.player.attack?.kind).toBe('ranged')
    expect(legacy.player.aura).toBe(0)
  })

  it('uses directional L inputs for aiming, with no close-range aura hitbox', () => {
    const state = duel()
    const shot = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, down: true },
    })
    expect(shot.player.attack?.moveId).toBe('theta:downSpecial')
    expect(shot.player.attack?.kind).toBe('ranged')
    const shotActive = { ...shot.player, attack: { ...shot.player.attack!, frame: 8 } }
    expect(activeHitbox(shotActive)).toBeNull()
  })

  it('applies ordinary guard and lets an existing bullet survive interruption of its shooter', () => {
    const state = duel()
    const flight = advance(performAttack(state, 'player', 'ranged'), 12)
    const interrupted = { ...flight, player: { ...flight.player, attack: null, hitStun: 60 } }
    const hit = advance(interrupted, 70)
    const guarded = advance(flight, 70, EMPTY_INPUT, { ...EMPTY_INPUT, guard: true })
    expect(hit.opponent.health).toBeLessThan(state.opponent.health)
    expect(guarded.opponent.health).toBeGreaterThan(hit.opponent.health)
    expect(guarded.impact?.blocked).toBe(true)
    expect(guarded.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
  })

  it('does not fire if a faster close-range blow interrupts startup', () => {
    const state = duel()
    state.player.x = 45
    state.opponent.x = 51
    const shot = cast(state, 'player', 'forwardSpecial')
    const counter = performAttack(shot, 'opponent', 'light')
    const result = advance(counter, 50)
    expect(result.player.health).toBeLessThan(state.player.health)
    expect(result.nextProjectileId).toBe(1)
    expect(result.projectiles).toHaveLength(0)
  })

  it('does not turn Ren, Ko or a Hatsu damage buff into a stronger ordinary bullet', () => {
    const state = duel()
    const baseline = advance(performAttack(state, 'player', 'ranged'), 82)
    const boosted = {
      ...state,
      player: {
        ...state.player,
        nen: { ...state.player.nen, mode: 'ren' as const },
        hatsuEffects: { ...state.player.hatsuEffects },
      },
    }
    const result = advance(performAttack(boosted, 'player', 'ranged'), 82, {
      ...EMPTY_INPUT,
      aura: true,
    })
    expect(result.opponent.health).toBe(baseline.opponent.health)
  })

  it('has no Hatsu to activate, reveal or steal with Skill Hunter or Steal Chain', () => {
    const state = duel()
    const unknown = hatsuFor('theta')
    expect(unknown.martialOnly).toBe(true)
    expect(hatsuSourceFor(state.player, 'theta:neutralSpecial')).toBeNull()
    expect(stealableChainMove(state.player)).toBeNull()
    expect(
      unknown.onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'theta',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    const thief = beginFight(createFight('chrollo', 'theta'))
    thief.player.hatsuEffects.witnessedHatsu = 'theta'
    const stolen = hatsuFor('chrollo').onImpact({
      state: thief,
      side: 'player',
      defenderSide: 'opponent',
      source: 'chrollo',
      moveId: CHROLLO_STEAL,
      blocked: false,
      concealed: false,
    })
    expect(stolen.player.chrolloBook?.pages).not.toContain('theta')
    expect(stolen.opponent.hatsuEffects.hatsuStolen).toBe(0)
  })

  it('shows a physical handgun held by Theta', () => {
    const figure = buildFightFigure({
      THREE,
      glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
      fighter: duel().player,
    })
    expect(figure.root.getObjectByName('theta-physical-handgun')?.parent?.name).toBe('hand-right')
  })
  it('renders a compact metal bullet without an aura material and disposes its material', () => {
    const flight = advance(performAttack(duel(), 'player', 'ranged'), 12)
    const scene = new THREE.Scene()
    let glowCalls = 0
    const renderer = createProjectileScene({
      THREE,
      scene,
      worldX: (value) => value,
      worldY: (value) => value,
      geometry: (made) => made,
      glow: (colour) => {
        glowCalls++
        return new THREE.MeshBasicMaterial({ color: colour })
      },
    })
    renderer.sync(flight.projectiles, 0)
    const bullet = scene.children.find((object) => object instanceof THREE.Mesh) as THREE.Mesh
    expect(bullet).toBeDefined()
    expect(glowCalls).toBe(0)
    const dimensions = new THREE.Box3().setFromObject(bullet).getSize(new THREE.Vector3())
    expect(dimensions.x).toBeLessThan(0.15)
    expect(dimensions.x).toBeGreaterThan(dimensions.y)
    let disposed = false
    ;(bullet.material as THREE.Material).addEventListener('dispose', () => (disposed = true))
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
    expect(disposed).toBe(true)
  })
})
