import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { activeHitbox, attackData } from './frameData'
import { advanceBlinky } from './blinkyFrames'
import { musseHatsu } from './hatsu/musse'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { moveForAction, moveForSlot, movesetFor, finisherReady } from './movesets'
import { canUseRangedAttack, projectileProfile, spawnRangedProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { chooseMovesetAttack } from './movesetAi'
import { observeSecretWindow, secretWindowVisibleTo } from './secretWindow'
import { projectHanzo } from './hanzoProjection'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { CHROLLO_USE } from './chrolloBook'
import { dolphinIsBusy } from './kurapikaDolphin'
import { toggleEmperorTime } from './kurapikaActions'
import { createKurapika } from './kurapika'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('musse', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
}
function advance(state: FightState, frames: number, guard = false): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: { ...EMPTY_INPUT, guard } })
  return next
}
function attach(state = duel()): FightState {
  return advance(performAttack(state, 'player', 'special'), 35)
}
function firedBullet(state: FightState): FightState {
  const started = performAttack(state, 'player', 'ranged')
  const player = {
    ...started.player,
    attack: { ...started.player.attack!, frame: attackData('ranged', started.player).startup },
  }
  return spawnRangedProjectiles({ ...started, player })
}
function bulletHit(state: FightState): FightState {
  const firing = firedBullet(state)
  return resolveFightImpacts(firing, [
    { projectile: firing.projectiles[0], defenderSide: 'opponent', position: { x: 48, y: 6 } },
  ])
}
function changedFighter(state: FightState, patch: Partial<ArcadeFighter>): FightState {
  return { ...state, player: { ...state.player, ...patch } }
}

describe('Musse — handgun and Secret Window', () => {
  it('keeps one contact Hatsu and physical normals, without an invented execution finisher', () => {
    const moveset = movesetFor('musse')!
    expect(moveset.moves).toHaveLength(11)
    expect(moveset.moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(moveForSlot('musse', 'finisher')).toBeNull()
    expect(finisherReady(duel(), 'player')).toBe(false)
    for (const input of [
      EMPTY_INPUT,
      { ...EMPTY_INPUT, right: true },
      { ...EMPTY_INPUT, left: true },
      { ...EMPTY_INPUT, down: true },
    ])
      expect(moveForAction(duel().player, 'special', input)?.id).toBe('musse:neutralSpecial')
    expect(moveForSlot('musse', 'neutralSpecial')?.tuning).toMatchObject({
      damage: 0,
      hitstun: 0,
      blockstun: 0,
      knockback: 0,
      lunge: 0,
    })
  })

  it('fires one travelling ordinary bullet per press with no aura, even in Zetsu', () => {
    const base = duel()
    const state = {
      ...base,
      player: { ...base.player, aura: 0, nen: { ...base.player.nen, mode: 'zetsu' as const } },
      opponent: { ...base.opponent, x: 90 },
    }
    expect(projectileProfile('musse')).toMatchObject({
      matter: 'object',
      shape: 'bullet',
      labelEn: 'Handgun',
    })
    expect(canUseRangedAttack(state.player)).toBe(true)
    const started = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: true })
    expect(started.player.aura).toBe(0)
    expect(started.player.attack?.auraCharged).toBe(false)
    const first = advance(started, attackData('ranged', started.player).startup)
    expect(first.projectiles).toHaveLength(1)
    expect(first.opponent.health).toBe(state.opponent.health)
    expect(activeHitbox(first.player)).toBeNull()
    expect(advance(first, 60).nextProjectileId).toBe(2)
  })

  it('keeps the physical handgun usable when Nen is stolen or sealed', () => {
    const base = duel()
    for (const patch of [
      { hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: 1 } },
      { on: { grudge: 0, sealFrames: 60 } },
    ]) {
      const state = changedFighter(base, patch)
      expect(performAttack(state, 'player', 'special')).toBe(state)
      expect(performAttack(state, 'player', 'ranged').player.attack?.kind).toBe('ranged')
    }
  })

  it('does not reinforce the bullet with the shooter’s Ren, Ko or Hatsu buffs', () => {
    const state = duel()
    const normal = bulletHit(state).opponent.health
    const boosted = changedFighter(state, {
      nen: { ...state.player.nen, mode: 'ren', ko: 'hands' },
      hatsuEffects: { ...state.player.hatsuEffects, cyclotronTurns: 5 },
    })
    expect(bulletHit(boosted).opponent.health).toBe(normal)
    const ken = {
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, ken: true },
        blocking: true,
        guardFrames: 20,
      },
    }
    expect(bulletHit(ken).opponent.health).toBe(state.opponent.health)
    const parry = { ...state, opponent: { ...state.opponent, blocking: true, guardFrames: 1 } }
    expect(bulletHit(parry).opponent.health).toBe(state.opponent.health)
  })

  it('can be jumped over and is swallowed only by an active, aligned Blinky nozzle', () => {
    const base = duel()
    const state = { ...base, opponent: { ...base.opponent, x: 58, y: 15, velocityY: 30 } }
    expect(advance(performAttack(state, 'player', 'ranged'), 28).opponent.health).toBe(
      base.opponent.health,
    )
    const blinky = {
      ...base,
      opponent: {
        ...base.opponent,
        id: 'shizuku' as const,
        x: 60,
      },
    }
    const started = performAttack(blinky, 'opponent', 'special')
    const suction = {
      ...started,
      opponent: {
        ...started.opponent,
        attack: {
          ...started.opponent.attack!,
          frame: attackData('special', started.opponent).startup,
        },
      },
    }
    const highBullet = firedBullet(suction)
    // The raised handgun fires above the standing nozzle's aperture.
    expect(advanceBlinky(highBullet).projectiles).toHaveLength(1)
    const aligned = { ...highBullet, opponent: { ...highBullet.opponent, y: 5 } }
    const swallowed = advanceBlinky(aligned)
    expect(swallowed.opponent.health).toBe(base.opponent.health)
    expect(swallowed.opponent.blinky?.lastObject?.shape).toBe('bullet')
    expect(swallowed.projectiles).toHaveLength(0)
  })

  it('attaches by touch without damage, stun, knockback, score or combat modifiers', () => {
    const base = duel()
    const started = performAttack(base, 'player', 'special')
    expect(started.player.aura).toBe(84)
    expect(started.player.x).toBe(base.player.x)
    expect(advance(started, 10).player.secretWindow).toBeUndefined()
    const result = advance(started, 35)
    expect(result.player.secretWindow?.target).toBe('opponent')
    expect(result.opponent).toMatchObject({
      health: base.opponent.health,
      hitStun: 0,
      blockStun: 0,
      x: base.opponent.x,
    })
    expect(result.score).toEqual(base.score)
    expect(result.impact).toBeNull()
    expect(hatsuDamageFactor(result.player)).toBe(1)
    expect(hatsuDefenceFactor(result.player)).toBe(1)
    expect(result.player.nen.gyo).toBe(false)
    expect(result.opponent.hatsuEffects.witnessedHatsu).toBeNull()
    expect(performAttack(result, 'player', 'special')).toBe(result)
  })

  it('permits actual touch of a guarding target without breaking guard', () => {
    const base = duel()
    const result = advance(performAttack(base, 'player', 'special'), 35, true)
    expect(result.player.secretWindow).toBeDefined()
    expect(result.opponent).toMatchObject({
      blocking: true,
      health: base.opponent.health,
      blockStun: 0,
    })
  })

  it('cannot attach out of reach, during wakeup grace or after interrupted startup', () => {
    const state = duel()
    expect(
      attach({ ...state, opponent: { ...state.opponent, x: 70 } }).player.secretWindow,
    ).toBeUndefined()
    expect(
      attach({ ...state, opponent: { ...state.opponent, wakeupInvulnerableFrames: 60 } }).player
        .secretWindow,
    ).toBeUndefined()
    const started = performAttack(state, 'player', 'special')
    expect(
      advance(changedFighter(started, { attack: null, hitStun: 30 }), 35).player.secretWindow,
    ).toBeUndefined()
  })

  it('attaches for P2 and wakes Hanzo only when the hand touches his physical body', () => {
    const state = duel()
    const mirrored = {
      ...state,
      player: { ...state.opponent, x: 42, facing: 1 as const },
      opponent: { ...state.player, x: 48, facing: -1 as const },
    }
    const result = advance(performAttack(mirrored, 'opponent', 'special'), 35)
    expect(result.opponent.secretWindow?.target).toBe('player')
    expect(result.player.health).toBe(state.player.health)
    const hanzo = projectHanzo({ ...state.opponent, id: 'hanzo' })
    const touched = attach({ ...state, opponent: { ...hanzo, x: 75 } })
    expect(touched.player.secretWindow).toBeDefined()
    expect(touched.opponent.hanzoProjection).toBeUndefined()
    expect(touched.opponent.health).toBe(state.opponent.health)
    expect(touched.opponent.x).toBe(48)
    const remoteOnly = attach({
      ...state,
      opponent: { ...projectHanzo({ ...state.opponent, id: 'hanzo', x: 75 }), x: 48 },
    })
    expect(remoteOnly.player.secretWindow).toBeUndefined()
  })

  it('spends an actual evasion once and does not attach through it', () => {
    const state = duel()
    const result = attach({
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, teleportDodges: 2 },
      },
    })
    expect(result.player.secretWindow).toBeUndefined()
    expect(result.opponent.hatsuEffects.teleportDodges).toBe(1)
    expect(result.opponent.health).toBe(state.opponent.health)
  })

  it('reports only current bodily actions, never concealed technique names or a remote double', () => {
    const state = attach()
    const moving = musseHatsu.onFrame({
      ...state,
      frame: 80,
      opponent: { ...state.opponent, pose: 'walk', x: 65 },
    })
    expect(moving.player.secretWindow?.observation).toEqual({ frame: 80, action: 'walk' })
    const concealed = {
      ...state,
      opponent: { ...performAttack(state, 'opponent', 'special').opponent },
    }
    concealed.opponent.attack = { ...concealed.opponent.attack!, concealed: true }
    expect(observeSecretWindow(concealed, 'opponent').action).toBe('concealed-gesture')
    const hanzo = projectHanzo({ ...state.opponent, id: 'hanzo' })
    expect(
      observeSecretWindow({ ...state, opponent: { ...hanzo, pose: 'special', x: 75 } }, 'opponent')
        .action,
    ).toBe('sleeping-body')
    expect(secretWindowVisibleTo(state, 'player', 'player')).toBe(true)
    expect(secretWindowVisibleTo(state, 'player', 'opponent')).toBe(false)
  })

  it('clears the owl on Nen loss and between rounds', () => {
    const state = attach()
    const variants: Partial<ArcadeFighter>[] = [
      { aura: 0 },
      { health: 0 },
      { nen: { ...state.player.nen, mode: 'zetsu' } },
      { hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      { on: { grudge: 0, sealFrames: 30 } },
      { stolenChainAbility: { owner: 'opponent', moveId: 'musse:neutralSpecial' } },
    ]
    for (const patch of variants)
      expect(musseHatsu.onFrame(changedFighter(state, patch)).player.secretWindow).toBeUndefined()
    expect(
      nextRound({
        ...state,
        phase: 'finished',
        winner: 'player',
        roundsWon: { player: 1, opponent: 0 },
      }).player.secretWindow,
    ).toBeUndefined()
  })

  it('lets Chrollo copy only the contact surveillance, preserving book conditions', () => {
    const state = duel()
    const book = { pages: ['musse', 'sun-and-moon'] as const, page: 0, open: true, bookmark: null }
    const copied = changedFighter(state, { id: 'chrollo', chrolloBook: book })
    const result = advance(
      performAuraAttack({
        state: copied,
        side: 'player',
        kind: 'special',
        moveId: CHROLLO_USE,
        auraCharged: false,
      }),
      35,
    )
    expect(result.player.secretWindow).toBeDefined()
    expect(result.opponent.health).toBe(state.opponent.health)
    expect(result.projectiles).toHaveLength(0)
    const closed = changedFighter(result, { chrolloBook: { ...book, open: false } })
    expect(reconcileChrolloPages(result, closed, 'player').player.secretWindow).toBeUndefined()
    const marked = changedFighter(result, {
      chrolloBook: { ...book, open: false, bookmark: 'musse' },
    })
    expect(reconcileChrolloPages(result, marked, 'player').player.secretWindow).toBeDefined()
  })

  it('keeps a borrowed Secret Window and Emperor Time active beyond the contact animation', () => {
    const base = duel()
    const state = changedFighter(base, {
      id: 'kurapika',
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        held: {
          victim: 'opponent',
          source: 'musse',
          moveId: 'musse:neutralSpecial',
          loaded: true,
          used: false,
          sustainedKeys: [],
        },
      },
    })
    const cast = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    const result = advance(cast, 90)
    expect(result.player.id).toBe('kurapika')
    expect(result.player.attack).toBeNull()
    expect(result.player.secretWindow?.target).toBe('opponent')
    expect(result.opponent.health).toBe(base.opponent.health)
    const held = result.player.kurapika!.held!
    expect(held.sustainedKeys).toContain('secret-window')
    expect(dolphinIsBusy(result, 'player', held)).toBe(true)
    expect(toggleEmperorTime(result, 'player')).toBe(result)
    const ended = advance(
      changedFighter(result, {
        nen: { ...result.player.nen, mode: 'zetsu' },
        hatsuEffects: { ...result.player.hatsuEffects, forcedZetsuFrames: 60 },
      }),
      3,
    )
    expect(ended.player.secretWindow).toBeUndefined()
    expect(ended.player.kurapika?.held).toBeNull()
  })

  it('uses contact surveillance opportunistically and keeps the ranged AI path', () => {
    const state = duel()
    const ai = { ...state, opponent: { ...state.player, facing: -1 as const, x: 48 } }
    expect(chooseMovesetAttack(ai, 0.5, 6)?.id).toBe('musse:neutralSpecial')
    expect(chooseMovesetAttack(ai, 0.5, 20)).toBeNull()
    expect(
      chooseMovesetAttack(
        {
          ...ai,
          opponent: {
            ...ai.opponent,
            secretWindow: { ...attach().player.secretWindow!, target: 'player' },
          },
        },
        0.5,
        6,
      )?.category,
    ).not.toBe('special')
  })
})
