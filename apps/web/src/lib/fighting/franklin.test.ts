import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { activeHitbox, attackData } from './frameData'
import { canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { canUseMovesetMove, finisherReady, moveForSlot } from './movesets'
import { resolveFightImpacts } from './combatImpact'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { franklinSalvo } from './franklinAttack'
import { franklinShotHand } from './franklinPresentation'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('franklin', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 20, aura: 100 },
    opponent: { ...state.opponent, x: 76 },
  }
}

function advance(state: FightState, frames: number, input: FightInput = EMPTY_INPUT): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: input })
  return next
}

function technique(state: FightState, slot: MoveSlot = 'neutralSpecial'): FightState {
  return performMove({
    state,
    side: 'player',
    action: slot === 'finisher' ? 'finisher' : 'special',
    input: {
      ...EMPTY_INPUT,
      right: slot === 'forwardSpecial',
      left: slot === 'backSpecial',
      down: slot === 'downSpecial',
    },
  })
}

function atActive(state: FightState, side: FightSide = 'player'): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: {
        ...fighter.attack!,
        frame: attackData(fighter.attack!.kind, fighter).startup,
      },
    },
  }
}

describe('Franklin’s Double Machine Gun', () => {
  it('fires ten travelling Nen bullets from alternating hands for U, without duplicate emissions', () => {
    const ready = duel()
    const started = performAttack(ready, 'player', 'ranged')
    expect(started.player.aura).toBe(88)
    expect(started.projectiles).toHaveLength(0)
    const first = spawnRangedProjectiles(atActive(started))
    expect(first.projectiles).toHaveLength(1)
    expect(spawnRangedProjectiles(first)).toEqual(first)
    const fired = advance(first, 18)
    expect(fired.nextProjectileId).toBe(11)
    expect(fired.projectiles.every((p) => p.matter === 'nen' && p.fighterId === 'franklin')).toBe(
      true,
    )
    expect(new Set(fired.projectiles.map((p) => p.y)).size).toBeGreaterThan(4)
    expect(advance(fired, 40).nextProjectileId).toBe(11)
  })

  it('does not hit through an invisible special hitbox; bullets must reach the target', () => {
    const active = atActive(technique(duel()))
    expect(activeHitbox(active.player)).toBeNull()
    const noBullet = resolveFightImpacts(active, [])
    expect(noBullet.opponent.health).toBe(noBullet.opponent.maxHealth)
    const flying = advance(technique(duel()), 20)
    expect(flying.nextProjectileId).toBeGreaterThan(1)
    expect(flying.opponent.health).toBe(flying.opponent.maxHealth)
    const struck = advance(flying, 75)
    expect(struck.opponent.health).toBeLessThan(struck.opponent.maxHealth)
    expect(struck.nextProjectileId).toBe(21)
    expect(struck.impact).toMatchObject({ kind: 'ranged', attacker: 'player' })
  })

  it('stops future shots when a hit interrupts Franklin, while emitted bullets keep travelling', () => {
    const firing = advance(performAttack(duel(), 'player', 'ranged'), 12)
    const fired = firing.nextProjectileId
    const incoming = {
      ...firing.projectiles[0],
      id: 100,
      owner: 'opponent' as const,
      fighterId: 'hisoka' as const,
      damage: 7,
    }
    const interrupted = resolveFightImpacts(firing, [
      { projectile: incoming, defenderSide: 'player', position: { x: 20, y: 7 } },
    ])
    expect(interrupted.player.attack).toBeNull()
    expect(interrupted.projectiles).toHaveLength(firing.projectiles.length)
    expect(advance(interrupted, 45).nextProjectileId).toBe(fired)
  })

  it('retains normal guard and invulnerability rules for every bullet', () => {
    const ready = duel()
    const bullet = spawnRangedProjectiles(atActive(technique(ready))).projectiles[0]
    const hit = { projectile: bullet, defenderSide: 'opponent' as const, position: { x: 76, y: 7 } }
    const guarded = resolveFightImpacts(
      { ...ready, opponent: { ...ready.opponent, blocking: true, guardFrames: 20 } },
      [hit],
    )
    expect(guarded.impact?.blocked).toBe(true)
    expect(guarded.impact?.damage).toBeLessThan(bullet.damage)
    const immune = resolveFightImpacts(
      { ...ready, opponent: { ...ready.opponent, wakeupInvulnerableFrames: 10 } },
      [hit],
    )
    expect(immune.opponent.health).toBe(immune.opponent.maxHealth)
  })

  it.each(['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'] as const)(
    '%s uses the same gun with its own firing duration and aim',
    (slot) => {
      const started = technique(duel(), slot)
      const firing = spawnRangedProjectiles(atActive(started))
      expect(activeHitbox(firing.player)).toBeNull()
      expect(firing.projectiles).toHaveLength(1)
      expect(firing.projectiles[0].targetZone).toBe(slot === 'downSpecial' ? 'feet' : 'torso')
      expect(firing.player.x).toBe(20)
      expect(moveForSlot('franklin', slot)?.canon.source).toContain('76')
      expect(franklinSalvo(firing.player).shots).toBe(
        slot === 'finisher' ? 40 : ['forwardSpecial', 'downSpecial'].includes(slot) ? 10 : 20,
      )
    },
  )

  it('does not require a wounded opponent to use the prolonged barrage', () => {
    const ready = duel()
    expect(ready.opponent.health).toBe(ready.opponent.maxHealth)
    expect(finisherReady(ready, 'player')).toBe(true)
    expect(finisherReady({ ...ready, player: { ...ready.player, aura: 54 } }, 'player')).toBe(false)
  })

  it('suspends all gun attacks under Zetsu, theft and On, including a volley in progress', () => {
    const ready = atActive(technique(duel()))
    const variants = [
      { ...ready.player, nen: { ...ready.player.nen, mode: 'zetsu' as const } },
      { ...ready.player, hatsuEffects: { ...ready.player.hatsuEffects, hatsuStolen: 60 } },
      { ...ready.player, on: { grudge: 0, sealFrames: 60 } },
    ]
    for (const player of variants) {
      const state = { ...ready, player }
      expect(canUseRangedAttack(player)).toBe(false)
      expect(canUseMovesetMove(state, 'player', moveForSlot('franklin', 'neutralSpecial')!)).toBe(
        false,
      )
      expect(spawnRangedProjectiles(state).nextProjectileId).toBe(1)
    }
  })

  it('mirrors the volley for P2 and lets Chrollo replay the actual travelling bullets', () => {
    const base = duel()
    const mirrored = {
      ...base,
      player: { ...base.opponent, x: 20 },
      opponent: { ...base.player, x: 76, facing: -1 as const },
    }
    const p2 = spawnRangedProjectiles(
      atActive(performAttack(mirrored, 'opponent', 'ranged'), 'opponent'),
    )
    expect(p2.projectiles[0]).toMatchObject({
      owner: 'opponent',
      velocityX: -82,
      fighterId: 'franklin',
    })
    const copy = beginFight(createFight('chrollo', 'franklin', { mode: 'versus-local' }))
    const copied = {
      ...copy,
      player: {
        ...copy.player,
        aura: 100,
        chrolloBook: { pages: ['franklin' as const], page: 0, open: true, bookmark: null },
      },
    }
    const firing = spawnRangedProjectiles(atActive(technique(copied)))
    expect(firing.projectiles[0]).toMatchObject({
      owner: 'player',
      fighterId: 'franklin',
      matter: 'nen',
    })
    expect(activeHitbox(firing.player)).toBeNull()
  })

  it('opens ten chained fingertips and flashes the firing finger without rebuilding the model', () => {
    const ready = duel()
    const model = buildFightFigure({
      THREE,
      fighter: ready.player,
      glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
    })
    const caps: THREE.Object3D[] = []
    const chains: THREE.Object3D[] = []
    const flashes: THREE.Object3D[] = []
    model.root.traverse((part) => {
      if (part.name === 'franklin-fingertip') caps.push(part)
      if (part.name === 'franklin-finger-chain') chains.push(part)
      if (part.name === 'franklin-muzzle-flash') flashes.push(part)
    })
    expect(caps).toHaveLength(10)
    const active = atActive(technique(ready)).player
    model.animate(1, 'idle', {
      motion: fightBodyMotion({ fighter: active, seconds: 1, progress: 0 }),
    })
    expect(caps.every((part) => part.rotation.z > 1)).toBe(true)
    expect(chains.every((part) => part.visible)).toBe(true)
    expect(flashes.filter((part) => part.visible)).toHaveLength(1)
    const muzzle = flashes.find((part) => part.visible)!
    const firstFinger = franklinShotHand(active.facing, 0)
    expect(muzzle.parent?.name).toBe(`franklin-finger-${firstFinger}-0`)
    expect(muzzle.position.toArray()).toEqual([0, -0.1, 0])
    expect(fightFigureKey(active)).toBe(fightFigureKey(ready.player))
    model.animate(2, 'idle', {
      motion: fightBodyMotion({
        fighter: { ...active, attack: null, pose: 'hit' },
        seconds: 2,
        progress: 0,
      }),
    })
    expect(caps.every((part) => part.rotation.z === 0)).toBe(true)
    expect(flashes.some((part) => part.visible)).toBe(false)
  })

  it('hits at point-blank range even when the target is inside his outstretched arms', () => {
    const base = duel()
    const ready = { ...base, opponent: { ...base.opponent, x: 25 } }
    const struck = advance(technique(ready), 24)
    expect(struck.opponent.health).toBeLessThan(struck.opponent.maxHealth)
    expect(struck.impact?.kind).toBe('ranged')
  })
})
