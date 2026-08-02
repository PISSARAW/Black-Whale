/**
 * The duel AI, tested against the invariant it exists to produce.
 *
 * I4 says a player never beats an intact hunter, and I3 says a duel can be won
 * without attacking. Both are claims about behaviour over a whole duel rather
 * than about any one function, so they are checked by playing duels out.
 */
import { describe, it, expect } from 'vitest'
import { poolOf } from '../aura'
import { duelReducer } from '../duel/reducer'
import { STRIKE_THRESHOLD } from '../duel/ryu'
import { ENTRAVE_HOLD } from '../nen/entrave'
import { BODY_ZONES, initialDuelState, type DuelState } from '../duel/state'
import { readAura } from '../duel/gyo'
import { PATIENCE, playHunter } from './duel'

const DT = 1 / 30

/** One tick of a duel: the clock, then the hunter's move. */
function tick(state: DuelState): DuelState {
  return playHunter(duelReducer(state, { type: 'TICK', dt: DT }), DT)
}

function play(state: DuelState, seconds: number, each?: (current: DuelState) => DuelState): DuelState {
  let current = state
  for (let elapsed = 0; elapsed < seconds && current.outcome === 'playing'; elapsed += DT) {
    current = each ? each(current) : current
    if (current.outcome !== 'playing') break
    current = tick(current)
  }
  return current
}

function opening(over: Partial<DuelState> = {}): DuelState {
  return { ...initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 }), ...over }
}

/**
 * A player playing properly: Gyo up, aura forward, and a Ko gathered into a
 * zone the hunter is not covering, as often as the rules allow. This is the
 * strongest thing a player can do, which is what makes it the right strategy to
 * test I4 with — if anything beats an intact hunter, this does.
 */
function swingAway(state: DuelState): DuelState {
  const looking = duelReducer(state, { type: 'GYO', side: 'player', on: true })
  const forward = duelReducer(looking, {
    type: 'RYU',
    side: 'player',
    setting: { attack: STRIKE_THRESHOLD + 0.2 },
  })
  const reading = readAura(forward.player, forward.hunter)
  const open = BODY_ZONES.find((zone) => zone !== (reading.guard ?? forward.hunter.guard))!
  return duelReducer(forward, { type: 'KO', side: 'player', zone: open })
}

describe('an intact hunter — invariant I4', () => {
  it('is not beaten by a player swinging at him from the first second', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = opening({ ...initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed }) })
      expect(play(state, 60, swingAway).outcome, `seed ${seed}`).not.toBe('won')
    }
  })

  it('reads the player and answers, rather than being told what they are doing', () => {
    // With In up he is reading nothing, and he still has to act — the branch is
    // a guess, not a peek at the player's state.
    const hidden = duelReducer(opening(), { type: 'IN', side: 'player', on: true })
    const after = play(hidden, 5)
    expect(after.hunter.gyo || after.hunter.ken || after.hunter.attack > 0).toBe(true)
  })
})

describe('a hunter the hunt has already emptied', () => {
  it('is beaten by the same player doing the same thing', () => {
    const spent = initialDuelState({ player: poolOf(100), hunter: poolOf(12), seed: 3 })
    expect(play(spent, 60, swingAway).outcome).toBe('won')
  })

  it('is beaten while an entrave still has him — the junction, at full length', () => {
    const held = initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 })
    const opened = { ...held, hunter: { ...held.hunter, held: ENTRAVE_HOLD } }
    expect(play(opened, ENTRAVE_HOLD - 1, swingAway).outcome).toBe('won')
  })
})

describe('winning without ever attacking — invariant I3', () => {
  it('is possible against a hunter the hunt left short, by holding Ken', () => {
    // His patience runs out, he closes on a Ken he cannot break, and the twenty
    // it costs him is the last twenty he had.
    const short = initialDuelState({ player: poolOf(100), hunter: poolOf(20), seed: 3 })
    const guarded = duelReducer(short, { type: 'KEN', side: 'player', on: true })
    const finished = play(guarded, 90)
    expect(finished.outcome).toBe('won')
    // And nothing was ever thrown.
    expect(finished.player.ko).toBeNull()
  })
})

describe('the hunter’s own economy', () => {
  it('stops looking when he cannot afford to', () => {
    const thin = initialDuelState({ player: poolOf(100), hunter: poolOf(14), seed: 3 })
    expect(play(thin, 2).hunter.gyo).toBe(false)
    const rich = initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 })
    expect(play(rich, 2).hunter.gyo).toBe(true)
  })

  it('spends what he uses', () => {
    const after = play(initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 }), 5)
    expect(after.hunter.pool.available).toBeLessThan(100)
  })

  it('waits out a Ken rather than emptying himself into it straight away', () => {
    const rich = initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 })
    const walled = duelReducer(rich, { type: 'KEN', side: 'player', on: true })
    const early = play(walled, PATIENCE - 1)
    // Three seconds of standoff: the player has paid for three seconds of Ken
    // and the hunter has paid for nothing.
    expect(early.player.pool.available).toBeLessThan(early.hunter.pool.available)
  })

  it('does nothing at all while he is held', () => {
    const held = initialDuelState({ player: poolOf(100), hunter: poolOf(100), seed: 3 })
    const stuck = { ...held, hunter: { ...held.hunter, held: 5 } }
    expect(playHunter(stuck, DT)).toBe(stuck)
  })

  it('replays identically from the same seed', () => {
    const a = play(opening(), 20, swingAway)
    const b = play(opening(), 20, swingAway)
    expect(a.outcome).toBe(b.outcome)
    expect(a.hunter.pool).toEqual(b.hunter.pool)
  })
})
