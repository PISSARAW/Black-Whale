import { describe, expect, it } from 'vitest'
import type { MorenaChallenge } from './morenaChallenge'
import { MorenaSession } from './morenaSession.svelte'

const challenge: MorenaChallenge = {
  v: 2,
  seed: 407,
  detectionSeed: 410,
  streak: 3,
  rounds: 4,
  verdict: 'infected',
  marked: 'back',
  loadout: { technique: 'dowsing', bookmark: null },
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
    expect(first.currentDetectionSeed).toBe(challenge.detectionSeed)
    expect(first.previousChallengeStreak).toBe(challenge.streak)
    expect(first.challengeWaiting).toBe(false)
    expect(first.game.technique).toBe(challenge.loadout.technique)
    expect(first.game).toEqual(second.game)
  })

  it('unlocks the lab only after a canonical game reaches a verdict', () => {
    const session = new MorenaSession()
    session.deal({ tableKind: null, carryingBook: false }, 'canonical')
    expect(session.labUnlocked).toBe(false)

    session.replaceGame({ ...session.game, phase: 'over', verdict: 'refused' })

    expect(session.labUnlocked).toBe(true)
    session.showLab()
    expect(session.view).toBe('lab')
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

  it('restores a hand at the same random cursor and remembers discovered answers', () => {
    const session = new MorenaSession()
    session.deal({ tableKind: null, carryingBook: false })
    session.dispatch({ kind: 'ask', question: 'goal' })
    const restored = new MorenaSession()
    restored.hydrate(session.snapshot())
    restored.resume()

    session.dispatch({ kind: 'ask', question: 'power' })
    restored.dispatch({ kind: 'ask', question: 'power' })
    expect(restored.game).toEqual(session.game)
    expect(restored.discoveredQuestions).toEqual(['goal', 'power'])
  })

  it('lets a challenge take priority without replacing the resumable hand', () => {
    const original = new MorenaSession()
    original.deal({ tableKind: null, carryingBook: false })
    original.dispatch({ kind: 'ask', question: 'goal' })
    const savedHand = original.snapshot().active

    const challenged = new MorenaSession()
    challenged.hydrate(original.snapshot())
    challenged.setChallenge(challenge)
    challenged.deal({ tableKind: null, carryingBook: false })
    challenged.dispatch({ kind: 'ask', question: challenged.game.questions[0] })

    expect(challenged.currentMode).toBe('challenge')
    expect(challenged.snapshot().active).toEqual(savedHand)
    challenged.showMenu()
    expect(challenged.resumeAvailable).toBe(true)
    expect(challenged.game).toEqual(savedHand?.game)
  })

  it('completes the third condition once and persists the local recruit', () => {
    const session = new MorenaSession()
    session.deal({ tableKind: null, carryingBook: false })
    session.replaceGame({
      ...session.game,
      phase: 'over',
      verdict: 'infected',
      kissed: true,
      ending: 'played',
    })
    expect(session.epilogue).toBe('pending')
    session.observeMurder()
    session.recordKill('nen-user')
    expect(session.progress.member).toMatchObject({ memberId: 'local-player', level: 10, kills: 1 })

    const restored = new MorenaSession()
    restored.hydrate(session.snapshot())
    expect(restored.progress.member).toMatchObject({ memberId: 'local-player', level: 10 })
    restored.observeMurder()
    expect(restored.progress.member?.memberId).toBe('local-player')
  })
})
