import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  opponentAttack,
  performAttack,
  performMove,
  tickFight,
} from './engine'
import { FUTURE_PREPARATION_FRAMES, FUTURE_WINDOW_FRAMES } from './parallelFutureTypes'
import { fightReplayHash } from './fightReplayHash'
import { decodeReplay, encodeReplay } from './clashReplayCodec'
import { privatePvpState } from './pvp/view'
import { futureVisibleState } from './parallelFuturePresentation'
import { hatsuAvoidsImpact, triggerHatsu } from './hatsu'
import { finisherReady, movesetFor } from './movesets'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 80 },
    opponent: { ...state.opponent, x: 78, aura: 80 },
  }
}

function advance(state: FightState, frames: number, input: Partial<FightInput> = {}): FightState {
  let next = state
  for (let frame = 0; frame < frames; frame++)
    next = tickFight(next, { ...EMPTY_INPUT, ...input }, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

function vision(base = duel()): FightState {
  return advance(performAttack(base, 'player', 'special'), FUTURE_PREPARATION_FRAMES)
}

function incomingBullet(state: FightState): FightState {
  return {
    ...state,
    nextProjectileId: 2,
    projectiles: [
      {
        id: 1,
        owner: 'opponent',
        fighterId: 'benjamin',
        x: 78,
        y: 6.1,
        velocityX: -24,
        width: 0.65,
        height: 0.3,
        damage: 25,
        hitstun: 13,
        blockstun: 9,
        hitstop: 0,
        knockback: 2,
        targetZone: 'torso',
        shape: 'bullet',
        colour: '#ffffff',
        matter: 'object',
        age: 0,
        lifetime: 300,
      },
    ],
  }
}

describe('Laplace Devil in the real 2D engine', () => {
  it('enters Zetsu with closed eyes, without attacking, guarding or granting an evade', () => {
    const state = performAttack(duel(), 'player', 'special')
    expect(state.parallelFuture).toMatchObject({
      owner: 'player',
      phase: 'preparing',
      preparation: 0,
    })
    expect(state.player).toMatchObject({
      parallelEyesClosed: true,
      attack: null,
      blocking: false,
      aura: 80,
      nen: { mode: 'zetsu' },
    })
    expect(hatsuAvoidsImpact(state.player)).toBe(false)
    expect(triggerHatsu(duel(), 'player', 'tserriednich').player.hatsuEffects).not.toHaveProperty(
      'futureSight',
    )
    const moving = advance(state, 10, { right: true, jump: true, guard: true, aura: true })
    expect(moving.player).toMatchObject({ x: 40, y: 0, blocking: false, nen: { mode: 'zetsu' } })
  })

  it('is interrupted by a real hit during the vulnerable preparation', () => {
    const base = duel()
    const close = { ...base, opponent: { ...base.opponent, x: 46 } }
    const armed = performAttack(performAttack(close, 'player', 'special'), 'opponent', 'light')
    const struck = advance(armed, 12)
    expect(struck.player.health).toBeLessThan(base.player.health)
    expect(struck.parallelFuture).toBeUndefined()
    expect(struck.player.parallelEyesClosed).toBe(false)
    expect(struck.impact?.avoided).toBe(false)
  })

  it.each(['hitStun', 'blockStun', 'knockdownFrames'] as const)(
    'cannot start while %s is active',
    (field) => {
      const base = duel()
      const state = { ...base, player: { ...base.player, [field]: 30 } }
      expect(performAttack(state, 'player', 'special')).toBe(state)
    },
  )

  it('extends the vision four frames at a time to 600 without changing the real world', () => {
    const base = incomingBullet(duel())
    const ready = vision(base)
    const future = ready.parallelFuture!
    expect(future.phase).toBe('vision')
    expect(future.frames).toHaveLength(4)
    const next = advance(ready, 1).parallelFuture!
    expect(next.frames).toHaveLength(8)
    expect(advance(ready, 1).parallelFuture!.frames).toBe(next.frames)
    expect(ready.player.health).toBe(base.player.health)
    expect(ready.frame).toBe(FUTURE_PREPARATION_FRAMES)
    expect(ready.projectiles[0].age).toBe(FUTURE_PREPARATION_FRAMES)
    const watched = advance(ready, 149, { left: true, guard: true })
    expect(watched.parallelFuture!.frames).toHaveLength(FUTURE_WINDOW_FRAMES)
    expect(watched.parallelFuture!.forecast).toBeUndefined()
    expect(watched.parallelFuture!.frames[0]).toBe(future.frames[0])
    expect(
      watched.parallelFuture!.frames.some((frame) => frame.player.health < base.player.health),
    ).toBe(true)
    expect(watched.frame).toBe(ready.frame)
    expect(watched.time).toBe(ready.time)
    expect(watched.rng).toBe(ready.rng)
    expect(watched.projectiles).toEqual(ready.projectiles)
    expect(watched.player.health).toBe(ready.player.health)
  })

  it('does not apply a predicted KO, points or round victory to reality', () => {
    const base = incomingBullet(duel())
    base.player = { ...base.player, health: 1 }
    const ready = advance(vision(base), 80)
    expect(ready.parallelFuture!.frames.some((frame) => frame.phase === 'finished')).toBe(true)
    expect(ready.phase).toBe('fighting')
    expect(ready.winner).toBeNull()
    expect(ready.roundsWon).toEqual({ player: 0, opponent: 0 })
    expect(ready.score).toEqual(base.score)
  })

  it('lets the user physically diverge while the opponent still sees the predicted body', () => {
    const ready = vision(incomingBullet(duel()))
    const started = performMove({ state: ready, side: 'player', action: 'finisher' })
    expect(started.parallelFuture?.phase).toBe('diverging')
    expect(started.player.parallelEyesClosed).toBe(false)
    const moved = advance(started, 90, { left: true })
    expect(moved.player.x).toBeLessThan(ready.player.x)
    expect(moved.player.health).toBe(ready.player.health)
    expect(futureVisibleState(moved, 'player').player.x).toBe(moved.player.x)
    expect(futureVisibleState(moved, 'opponent').player.x).not.toBe(moved.player.x)
    expect(moved.score.opponent).toBe(0)
  })

  it('still takes the predicted hit if the user stays in its real trajectory', () => {
    const ready = vision(incomingBullet(duel()))
    const started = performAttack(ready, 'player', 'special')
    const struck = advance(started, 90)
    expect(struck.player.health).toBeLessThan(ready.player.health)
    expect(struck.impact?.avoided).toBe(false)
  })

  it('ends after ten real seconds and restores the opponent’s live commands', () => {
    const started = performAttack(vision(), 'player', 'special')
    const before = advance(started, FUTURE_WINDOW_FRAMES - 1)
    expect(before.parallelFuture?.cursor).toBe(FUTURE_WINDOW_FRAMES - 1)
    expect(performAttack(before, 'opponent', 'light')).toBe(before)
    const ended = advance(before, 1)
    expect(ended.parallelFuture).toBeUndefined()
    expect(performAttack(ended, 'opponent', 'light').opponent.attack).not.toBeNull()
  })

  it('does not let either fighter queue attacks during the detached vision', () => {
    const ready = vision()
    expect(performAttack(ready, 'player', 'light')).toBe(ready)
    expect(performAttack(ready, 'opponent', 'ranged')).toBe(ready)
  })

  it.each(['hatsuStolen', 'forcedZetsuFrames'] as const)(
    'cancels safely when %s cuts the ability',
    (field) => {
      const ready = vision()
      const sealed = {
        ...ready,
        player: { ...ready.player, hatsuEffects: { ...ready.player.hatsuEffects, [field]: 30 } },
      }
      const ended = advance(sealed, 1)
      expect(ended.parallelFuture).toBeUndefined()
      expect(ended.player.parallelEyesClosed).toBe(false)
    },
  )

  it('resumes a serialized partial forecast and generates the same prefix whether read in vision or divergence', () => {
    const first = vision(incomingBullet(duel()))
    const restored = decodeReplay(encodeReplay(first)) as FightState
    expect(restored.parallelFuture?.frames).toHaveLength(4)
    expect(restored.parallelFuture?.forecast?.parallelFuture).toBeUndefined()
    expect(privatePvpState(first, 'player').parallelFuture?.forecast).toBeUndefined()
    const watched = advance(first, 30)
    const replayed = advance(restored, 30)
    expect(fightReplayHash(replayed)).toBe(fightReplayHash(watched))
    const diverged = advance(performAttack(first, 'player', 'special'), 60)
    expect(diverged.parallelFuture!.frames).toEqual(watched.parallelFuture!.frames.slice(0, 60))
  })

  it('uses one non-damaging ability instead of invented beast and prophetic attacks', () => {
    const moves = movesetFor('tserriednich')!.moves
    expect(moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(
      moves
        .filter((move) => ['special', 'finisher'].includes(move.category))
        .every((move) => move.tuning.damage === 0 && move.auraCost === 0),
    ).toBe(true)
    expect(finisherReady(duel(), 'player')).toBe(false)
    expect(finisherReady(vision(), 'player')).toBe(true)
  })

  it('supports the AI opponent and resets the branch between rounds', () => {
    const base = duel()
    const mirrored = {
      ...base,
      player: { ...base.opponent, x: 22 },
      opponent: { ...base.player, x: 78 },
      mode: 'versus-ai' as const,
    }
    const preparing = opponentAttack(mirrored)
    expect(preparing.parallelFuture?.owner).toBe('opponent')
    let next = preparing
    for (let frame = 0; frame < 32; frame++)
      next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(next.parallelFuture?.phase).toBe('diverging')
    const round = nextRound({
      ...next,
      phase: 'finished',
      winner: 'player',
      roundsWon: { player: 1, opponent: 0 },
    })
    expect(round.parallelFuture).toBeUndefined()
    expect(round.opponent.parallelEyesClosed).toBeUndefined()
  })

  it('makes the AI follow the perceived body rather than tracking the real divergence', () => {
    let ready = performAttack(duel(), 'player', 'special')
    for (let frame = 0; frame < FUTURE_PREPARATION_FRAMES; frame++)
      ready = tickFight(ready, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(ready.parallelFuture?.phase).toBe('vision')
    const started = performAttack(ready, 'player', 'special')
    const displaced = { ...started, player: { ...started.player, x: 90 } }
    let next = displaced
    for (let frame = 0; frame < 60; frame++)
      next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(next.opponent.x).toBeLessThan(displaced.opponent.x)
    expect(next.opponent.facing).toBe(next.parallelFuture!.frames[59].opponent.facing)
    expect(next.opponent.facing).toBe(-1)
    expect(next.player.x).toBe(90)
  })

  it('renders the chosen forecast frame without advancing or mutating reality', () => {
    const ready = advance(vision(incomingBullet(duel())), 75)
    const shown = futureVisibleState(ready, 'player', 300)
    expect(shown.player.health).toBe(ready.parallelFuture!.frames[300].player.health)
    expect(shown.player.health).toBeLessThan(ready.player.health)
    expect(ready.player.health).toBe(duel().player.health)
    expect(shown.projectiles).toEqual(ready.parallelFuture!.frames[300].projectiles)
    expect(futureVisibleState(ready, 'opponent')).toBe(ready)
  })
})
