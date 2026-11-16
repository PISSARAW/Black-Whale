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
import { hatsuFor } from './hatsu'
import { addChrolloPage } from './chrolloBook'
import { createKurapika } from './kurapika'
import {
  machiBindReady,
  machiThreadForOwner,
  MACHI_BIND_RANGE,
  MACHI_SUTURE_HEAL,
  releaseMachiThread,
} from './machiThread'
import { finisherReady, moveForSlot } from './movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

function duel(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight('machi', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const close = {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48 },
  }
  return side === 'player'
    ? close
    : {
        ...close,
        player: { ...close.opponent, x: 42, facing: 1 },
        opponent: { ...close.player, x: 48, facing: -1 },
      }
}

function advance(
  state: FightState,
  frames: number,
  opponent: FightInput = EMPTY_INPUT,
): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: opponent })
  return state
}

function cast(state: FightState, slot: MoveSlot, side: FightSide = 'player'): FightState {
  const move = moveForSlot('machi', slot)!
  return performAuraAttack({
    state,
    side,
    kind: move.kind,
    variant: move.variant,
    moveId: move.id,
    auraCharged: false,
  })
}

function rested(state: FightState): FightState {
  return {
    ...state,
    hitstop: 0,
    player: { ...state.player, attack: null, hitStun: 0, blockStun: 0, aura: 100 },
    opponent: { ...state.opponent, attack: null, hitStun: 0, blockStun: 0 },
  }
}

describe('Machi real thread uses', () => {
  it('sutures only the wounded caster after preparation, without an offensive hitbox', () => {
    const state = duel()
    const wounded = { ...state, player: { ...state.player, health: 40 } }
    const started = cast(wounded, 'neutralSpecial')
    expect(started.player.aura).toBe(80)
    expect(advance(started, 20).player.health).toBe(40)
    const active = {
      ...started.player,
      attack: { ...started.player.attack!, frame: attackData('special', started.player).startup },
    }
    expect(activeHitbox(active)).toBeNull()
    const healed = advance(started, 65)
    expect(healed.player.health).toBe(40 + MACHI_SUTURE_HEAL)
    expect(healed.opponent.health).toBe(state.opponent.health)
    expect(healed.opponent.machiThread).toBeUndefined()
    expect(healed.score.player).toBe(0)
  })

  it('does not heal an interrupted cast, exceed maximum health or resurrect a dead body', () => {
    const state = duel()
    const maximum = state.player.health
    const started = cast({ ...state, player: { ...state.player, health: 40 } }, 'neutralSpecial')
    expect(
      advance({ ...started, player: { ...started.player, attack: null, hitStun: 40 } }, 70).player
        .health,
    ).toBe(40)
    expect(
      advance(
        cast({ ...state, player: { ...state.player, health: maximum - 2 } }, 'neutralSpecial'),
        70,
      ).player.health,
    ).toBe(maximum)
    const dead = { ...state, player: { ...state.player, health: 0 } }
    expect(cast(dead, 'neutralSpecial')).toBe(dead)
  })

  it('marks through contact with no damage or restraint, and U routes to the same marking gesture', () => {
    const state = duel()
    const marked = advance(cast(state, 'forwardSpecial'), 70)
    expect(marked.opponent.machiThread).toMatchObject({ kind: 'mark', owner: 'player' })
    expect(marked.opponent.health).toBe(state.opponent.health)
    expect(marked.opponent.hitStun).toBe(0)
    expect(marked.opponent.hatsuEffects.stitchedFrames).toBe(0)
    expect(advance(marked, 20, { ...EMPTY_INPUT, right: true }).opponent.x).toBeGreaterThan(
      marked.opponent.x,
    )
    const shot = performAttack(state, 'player', 'ranged')
    expect(shot.player.attack?.moveId).toBe('machi:forwardSpecial')
    expect(advance(shot, 70).projectiles).toHaveLength(0)
  })

  it.each(['forwardSpecial', 'downSpecial'] as const)(
    '%s requires unguarded contact, not a miss or a canceled startup',
    (slot) => {
      const state = duel()
      expect(
        advance(cast(state, slot), 70, { ...EMPTY_INPUT, guard: true }).opponent.machiThread,
      ).toBeUndefined()
      expect(
        advance(cast({ ...state, opponent: { ...state.opponent, x: 90 } }, slot), 70).opponent
          .machiThread,
      ).toBeUndefined()
      const started = cast(state, slot)
      expect(
        advance({ ...started, player: { ...started.player, attack: null, hitStun: 40 } }, 70)
          .opponent.machiThread,
      ).toBeUndefined()
    },
  )

  it.each(['player', 'opponent'] as const)(
    'maintains a real bind beyond 90 frames for %s, with no forced Zetsu or perpetual hitstun',
    (owner) => {
      const target = owner === 'player' ? 'opponent' : 'player'
      const bound = advance(cast(duel(owner), 'downSpecial', owner), 180)
      expect(bound[target].machiThread).toMatchObject({ kind: 'bind', owner })
      expect(bound[target].hatsuEffects.stitchedFrames).toBe(1)
      expect(bound[target].hitStun).toBe(0)
      expect(bound[target].nen.mode).toBe('ten')
      expect(bound[target].hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(performAttack(bound, target, 'light')[target].attack).toBeNull()
      expect(machiBindReady(bound, owner)).toBe(true)
    },
  )

  it('anchors a bound body under movement, jumping and owner pushbox contact', () => {
    const bound = advance(cast(duel(), 'downSpecial'), 65)
    const x = bound.opponent.x
    const moved = advance(bound, 50, { ...EMPTY_INPUT, right: true, jump: true })
    expect(moved.opponent.x).toBe(x)
    expect(moved.opponent.y).toBe(bound.opponent.y)
    const pressed = { ...bound, player: { ...bound.player, x: x - 0.1 } }
    expect(advance(pressed, 20).opponent.x).toBe(x)
  })

  it('loses contention when the owner is hit, guards, attacks with the holding hand or stretches the thread', () => {
    const bound = rested(advance(cast(duel(), 'downSpecial'), 65))
    const variants = [
      { ...bound.player, hitStun: 20 },
      { ...bound.player, blocking: true, guardFrames: 20 },
      { ...bound.player, x: bound.opponent.x - MACHI_BIND_RANGE - 2 },
    ]
    for (const owner of variants) {
      const released = hatsuFor('machi').onFrame({ ...bound, player: owner })
      expect(released.opponent.machiThread?.kind).toBe('mark')
      expect(released.opponent.hatsuEffects.stitchedFrames).toBe(0)
      expect(performAttack(released, 'opponent', 'light').opponent.attack).not.toBeNull()
    }
    expect(advance(performAttack(bound, 'player', 'light'), 1).opponent.machiThread?.kind).toBe(
      'mark',
    )
  })

  it('ends the actual link on release, loss of Nen, theft and the next round', () => {
    const bound = rested(advance(cast(duel(), 'downSpecial'), 65))
    expect(cast(bound, 'backSpecial').opponent.machiThread).toBeUndefined()
    expect(releaseMachiThread(bound, 'player').opponent.hatsuEffects.stitchedFrames).toBe(0)
    const lost = {
      ...bound,
      player: { ...bound.player, nen: { ...bound.player.nen, mode: 'zetsu' as const } },
    }
    expect(hatsuFor('machi').onFrame(lost).opponent.machiThread).toBeUndefined()
    const stolen = {
      ...bound,
      player: {
        ...bound.player,
        stolenChainAbility: { owner: 'opponent' as const, moveId: 'machi:downSpecial' },
      },
    }
    expect(hatsuFor('machi').onFrame(stolen).opponent.machiThread).toBeUndefined()
    expect(
      nextRound({ ...bound, phase: 'finished', winner: 'player' }).opponent.machiThread,
    ).toBeUndefined()
  })

  it('never grants a finisher from a counter or tracking mark, and consumes a maintained binding on hit', () => {
    const state = duel()
    expect(
      finisherReady(
        {
          ...state,
          opponent: {
            ...state.opponent,
            hatsuEffects: { ...state.opponent.hatsuEffects, stitchedFrames: 90 },
          },
        },
        'player',
      ),
    ).toBe(false)
    expect(finisherReady(rested(advance(cast(state, 'forwardSpecial'), 65)), 'player')).toBe(false)
    const bound = rested(advance(cast(state, 'downSpecial'), 65))
    expect(finisherReady(bound, 'player')).toBe(true)
    const hit = advance(cast(bound, 'finisher'), 100)
    expect(hit.opponent.health).toBeLessThan(bound.opponent.health)
    expect(machiThreadForOwner(hit, 'player')).toBeNull()
  })

  it('lets Skill Hunter copy the actual suture without an invisible offensive bind', () => {
    const state = beginFight(
      createFight('chrollo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const copied = {
      ...state,
      player: {
        ...state.player,
        health: 40,
        aura: 100,
        chrolloBook: addChrolloPage(state.player.chrolloBook!, 'machi'),
      },
    }
    const cast = performAuraAttack({
      state: copied,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:neutralSpecial',
      auraCharged: false,
    })
    const healed = advance(cast, 80)
    expect(healed.player.health).toBe(40 + MACHI_SUTURE_HEAL)
    expect(healed.opponent.machiThread).toBeUndefined()
    expect(healed.opponent.health).toBe(state.opponent.health)
  })

  it('keeps a borrowed ligature in Dolphin until Kurapika releases the actual thread', () => {
    const state = beginFight(
      createFight('kurapika', 'machi', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const loaded: FightState = {
      ...state,
      player: {
        ...state.player,
        x: 42,
        aura: 100,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            source: 'machi',
            victim: 'opponent',
            moveId: 'machi:downSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
      opponent: {
        ...state.opponent,
        x: 48,
        stolenChainAbility: { owner: 'player', moveId: 'machi:downSpecial' },
      },
    }
    const cast = performAuraAttack({
      state: loaded,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    const bound = advance(cast, 90)
    expect(bound.opponent.machiThread).toMatchObject({ owner: 'player', kind: 'bind' })
    expect(bound.player.kurapika?.held?.used).toBe(true)
    const released = performAuraAttack({
      state: rested(bound),
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    expect(released.opponent.machiThread).toBeUndefined()
    expect(released.player.kurapika?.held).toBeNull()
    expect(released.opponent.stolenChainAbility).toBeUndefined()
  })
})
