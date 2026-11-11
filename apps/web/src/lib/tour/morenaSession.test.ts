import { describe, expect, it } from 'vitest'
import type { MorenaChallenge } from './morenaChallenge'
import { MorenaSession } from './morenaSession.svelte'

const challenge: MorenaChallenge = {
  v: 1,
  seed: 407,
  streak: 3,
  rounds: 4,
  verdict: 'infected',
  marked: 'back',
}

describe('Morena session', () => {
  it('owns the menu, setup choice and live game', () => {
    const session = new MorenaSession()
    session.showRules()
    expect(session.view).toBe('rules')
    session.setCheats(false)
    session.deal({ tableKind: null, carryingBook: false })

    expect(session.view).toBe('table')
    expect(session.game.marked).toBeNull()
  })

  it('consumes a challenge seed once and keeps its random draw reproducible', () => {
    const first = new MorenaSession()
    const second = new MorenaSession()
    for (const session of [first, second]) {
      session.setChallenge(challenge)
      session.deal({ tableKind: null, carryingBook: false })
      session.dispatch({ kind: 'ask', question: session.game.questions[0] })
    }

    expect(first.currentChallengeSeed).toBe(challenge.seed)
    expect(first.previousChallengeStreak).toBe(challenge.streak)
    expect(first.challengeWaiting).toBe(false)
    expect(first.game).toEqual(second.game)
  })

  it('clears a half-made settlement choice after every command', () => {
    const session = new MorenaSession()
    session.deal({ tableKind: null, carryingBook: false })
    session.choose('yes')
    session.dispatch({ kind: 'leave' })

    expect(session.choice).toBeNull()
  })

  it('preserves a settlement choice when an external clock only replaces the game', () => {
    const session = new MorenaSession()
    session.choose('no')
    session.replaceGame(session.game)

    expect(session.choice).toBe('no')
  })
})
