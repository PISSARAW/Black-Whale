import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createBenjaminBaton } from './benjaminBaton'
import { createBenjaminEffectScene } from './benjaminEffectScene'
import { benjaminKeyedMove } from './benjaminPoses'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { attackData, attackTotal } from './frameData'
import { hatsuDamageFactor, hatsuSourceFor } from './hatsu'
import { canUseMovesetMove, finisherReady, moveForSlot } from './movesets'
import { canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

const BULLET: FightProjectile = {
  id: 1,
  owner: 'opponent',
  fighterId: 'franklin',
  x: 42,
  y: 6.1,
  velocityX: -70,
  width: 0.6,
  height: 0.24,
  damage: 11,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2.2,
  targetZone: 'torso',
  shape: 'bullet',
  colour: '#ffffff',
  age: 0,
  lifetime: 120,
  matter: 'nen',
}

function duel(): FightState {
  const state = beginFight(
    createFight('benjamin', 'franklin', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
}

function advance(state: FightState, frames: number): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

function technique(
  state: FightState,
  slot: 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher',
): FightState {
  const input = { ...EMPTY_INPUT, right: slot === 'forwardSpecial', down: slot === 'downSpecial' }
  return performMove({
    state,
    side: 'player',
    action: slot === 'finisher' ? 'finisher' : 'special',
    input,
  })
}

function atActive(state: FightState, side: FightSide = 'player'): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, frame: attackData(fighter.attack!.kind, fighter).startup },
    },
  }
}

function incoming(state: FightState, changes: Partial<FightProjectile> = {}): FightState {
  return resolveFightImpacts(state, [
    { projectile: { ...BULLET, ...changes }, defenderSide: 'player', position: { x: 42, y: 6.1 } },
  ])
}

describe('Benjamin’s canonical loadout', () => {
  it('inherits only from dead loyal academy graduates serving in his army', () => {
    const soldier = {
      ability: 'air-blow' as const,
      deceased: true,
      loyal: true,
      academyGraduate: true,
      privateArmy: true,
    }
    expect(createBenjaminBaton([soldier, soldier]).inherited).toEqual(['air-blow'])
    for (const key of ['deceased', 'loyal', 'academyGraduate', 'privateArmy'] as const) {
      expect(createBenjaminBaton([{ ...soldier, [key]: false }]).inherited).toEqual([])
    }
    expect(duel().player.hatsuEffects.baton?.inherited).toEqual([
      'air-blow',
      'secret-window',
      'culdcept',
    ])
  })

  it('uses Air Blow as a left-palm attack without building damage charges', () => {
    const result = advance(technique(duel(), 'neutralSpecial'), 45)
    expect(result.opponent.health).toBeLessThan(100)
    expect(hatsuDamageFactor(result.player)).toBe(1)
    expect(result.player.hatsuEffects.baton?.inherited).toHaveLength(3)
    expect(finisherReady(result, 'player')).toBe(false)
    expect(moveForSlot('benjamin', 'neutralSpecial')?.canon.evidence).toBe('gameplay-abstraction')
  })

  it('marks at contact without damage, stun, knockback, score or aura vision', () => {
    const result = advance(technique(duel(), 'forwardSpecial'), 30)
    expect(result.player.hatsuEffects.baton?.markedTarget).toBe('opponent')
    expect(result.opponent).toMatchObject({
      health: 100,
      hitStun: 0,
      blockStun: 0,
      x: 48,
    })
    expect(result.score.player).toBe(0)
    expect(result.player.nen.gyo).toBe(false)
  })

  it.each(['far', 'guard', 'invulnerable'] as const)(
    'does not attach Secret Window to a %s target',
    (condition) => {
      const base = duel()
      const state = {
        ...base,
        opponent: {
          ...base.opponent,
          x: condition === 'far' ? 65 : 48,
          wakeupInvulnerableFrames: condition === 'invulnerable' ? 60 : 0,
        },
      }
      let next = technique(state, 'forwardSpecial')
      for (let i = 0; i < 30; i++)
        next = tickFight(next, EMPTY_INPUT, {
          dt: 1 / 60,
          opponentInput: { ...EMPTY_INPUT, guard: condition === 'guard' },
        })
      expect(next.player.hatsuEffects.baton?.markedTarget).toBeNull()
    },
  )

  it('captures a Nen projectile only after charging, then releases its card once', () => {
    const charging = technique(duel(), 'downSpecial')
    expect(incoming(charging).player.health).toBeLessThan(100)
    const held = incoming(atActive(charging))
    expect(held.player.health).toBe(100)
    expect(held.player.hatsuEffects.baton?.card).toEqual(BULLET)
    expect(finisherReady(held, 'player')).toBe(true)
    const reset = { ...held, player: { ...held.player, attack: null } }
    const released = advance(technique(reset, 'finisher'), 19)
    expect(released.nextProjectileId).toBe(2)
    expect(released.player.hatsuEffects.baton?.card).toBeNull()
    expect(advance(released, 30).nextProjectileId).toBe(2)
  })

  it('captures through the real tick/collision pipeline for either player', () => {
    const charged = atActive(technique(duel(), 'downSpecial'))
    const state = { ...charged, projectiles: [{ ...BULLET, id: 8, x: 44 }], nextProjectileId: 9 }
    const caught = advance(state, 1)
    expect(caught.projectiles).toHaveLength(0)
    expect(caught.player.health).toBe(100)
    expect(caught.player.hatsuEffects.baton?.card?.id).toBe(8)
    const mirrored: FightState = {
      ...state,
      player: { ...state.opponent, x: 48 },
      opponent: { ...state.player, x: 42, facing: 1 },
      projectiles: [{ ...BULLET, id: 8, owner: 'player', x: 44 }],
    }
    expect(advance(mirrored, 1).opponent.hatsuEffects.baton?.card?.id).toBe(8)
  })

  it('never captures ordinary bullets, a second card, or Halkenburg’s arrow', () => {
    const active = atActive(technique(duel(), 'downSpecial'))
    for (const changes of [{ matter: 'object' as const }, { fighterId: 'halkenburg' as const }]) {
      const struck = incoming(active, changes)
      expect(struck.player.health).toBeLessThan(100)
      expect(struck.player.hatsuEffects.baton?.card).toBeNull()
    }
    const held = incoming(active)
    expect(incoming(held).player.health).toBeLessThan(100)
    expect(incoming(held).player.hatsuEffects.baton?.card).toEqual(BULLET)
  })

  it('locks the finisher without a card and retains the card when startup is interrupted', () => {
    const base = duel()
    expect(technique(base, 'finisher')).toBe(base)
    const held = incoming(atActive(technique(base, 'downSpecial')))
    const started = technique({ ...held, player: { ...held.player, attack: null } }, 'finisher')
    const struck = incoming(started, { matter: 'object' })
    expect(struck.player.attack).toBeNull()
    expect(advance(struck, 40).nextProjectileId).toBe(1)
    expect(struck.player.hatsuEffects.baton?.card).toEqual(BULLET)
  })

  it('suspends inherited techniques under Zetsu, theft or On, while retaining the loadout', () => {
    const base = duel()
    const variants = [
      { ...base.player, nen: { ...base.player.nen, mode: 'zetsu' as const } },
      { ...base.player, hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: 1 } },
      { ...base.player, on: { grudge: 0, sealFrames: 60 } },
    ]
    for (const player of variants) {
      const state = { ...base, player }
      expect(canUseMovesetMove(state, 'player', moveForSlot('benjamin', 'neutralSpecial')!)).toBe(
        false,
      )
      expect(performAttack(state, 'player', 'special')).toBe(state)
      expect(player.hatsuEffects.baton?.inherited).toHaveLength(3)
    }
    const chrollo = createFight('chrollo', 'benjamin').player
    expect(chrollo.hatsuEffects.baton).toBeNull()
    expect(hatsuSourceFor(base.player, 'benjamin:backSpecial')).toBeNull()
  })

  it('fires three physical bullets on separate frames without requiring Nen or aura', () => {
    const base = duel()
    const ready = {
      ...base,
      player: { ...base.player, aura: 0, nen: { ...base.player.nen, mode: 'zetsu' as const } },
      opponent: { ...base.opponent, x: 90 },
    }
    expect(canUseRangedAttack(ready.player)).toBe(true)
    const started = performAttack(ready, 'player', 'ranged')
    expect(started.player.aura).toBe(0)
    const first = advance(started, 11)
    expect(first.nextProjectileId).toBe(2)
    expect(spawnRangedProjectiles(first).nextProjectileId).toBe(2)
    const burst = advance(first, 12)
    expect(burst.nextProjectileId).toBe(4)
    expect(
      burst.projectiles.every(
        (projectile) => projectile.matter === 'object' && projectile.shape === 'bullet',
      ),
    ).toBe(true)
    expect(advance(burst, 30).nextProjectileId).toBe(4)
    expect(
      advance({ ...first, player: { ...first.player, attack: null, hitStun: 30 } }, 20)
        .nextProjectileId,
    ).toBe(2)
  })

  it('resets marks and cards between rounds while keeping the inherited abilities', () => {
    const held = incoming(atActive(technique(duel(), 'downSpecial')))
    const round = nextRound({
      ...held,
      phase: 'finished',
      winner: 'player',
      roundsWon: { player: 1, opponent: 0 },
    })
    expect(round.player.hatsuEffects.baton).toEqual(createBenjaminBaton())
    expect(attackTotal(attackData('ranged', held.player))).toBeGreaterThan(0)
  })

  it.each([1, -1] as const)('keeps Air Blow on the physical left hand when facing %s', (facing) => {
    const fighter = technique(duel(), 'neutralSpecial').player
    const keyed = benjaminKeyedMove({ ...fighter, facing })!
    const contact = keyed.timeline.find((key) => key.phase === 'active' && key.at === 0)!
    expect(contact.pose[facing === 1 ? 'rearWrist' : 'leadWrist']).toBeDefined()
    expect(contact.pose[facing === 1 ? 'leadWrist' : 'rearWrist']).toBeUndefined()
  })

  it('shows distinct weapon, bird, rectangle and card effects, and disposes them', () => {
    const scene = new THREE.Scene()
    const effects = createBenjaminEffectScene({
      THREE,
      scene,
      worldX: (value) => value / 5,
      worldY: (value) => value / 5,
    })
    effects.sync(performAttack(duel(), 'player', 'ranged'), 0)
    expect(scene.getObjectByName('benjamin-firearm')?.visible).toBe(true)
    const marked = advance(technique(duel(), 'forwardSpecial'), 30)
    effects.sync(marked, 0)
    expect(scene.getObjectByName('benjamin-firearm')?.visible).toBe(false)
    expect(scene.getObjectByName('benjamin-secret-window')?.visible).toBe(true)
    const charged = atActive(technique(duel(), 'downSpecial'))
    effects.sync(charged, 0)
    expect(scene.getObjectByName('benjamin-culdcept-rectangle')?.visible).toBe(true)
    effects.sync(incoming(charged), 0)
    expect(scene.getObjectByName('benjamin-culdcept-card')?.visible).toBe(true)
    effects.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
