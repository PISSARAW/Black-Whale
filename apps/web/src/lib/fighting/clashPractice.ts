import { get, writable } from 'svelte/store'
import {
  arcadeFight,
  initialArcade,
  nextArcade,
  observeArcade,
  type ArcadeProgress,
} from './clashArcade'
import {
  createChallengeFight,
  initialChallengeProgress,
  observeChallenge,
  type ChallengeId,
  type ChallengeProgress,
} from './fightChallenges'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'

export function createClashPractice() {
  const session = writable<{ challenge: ChallengeProgress | null; arcade: ArcadeProgress | null }>({
    challenge: null,
    arcade: null,
  })
  return {
    subscribe: session.subscribe,
    get active() {
      const current = get(session)
      return Boolean(current.challenge || current.arcade)
    },
    opponentInput(input: FightInput): FightInput {
      return get(session).challenge ? EMPTY_INPUT : input
    },
    observe(state: FightState | null) {
      const current = get(session)
      if (!state || (!current.challenge && !current.arcade)) return
      const challenge = current.challenge ? observeChallenge(current.challenge, state) : null
      const arcade = current.arcade ? observeArcade(current.arcade, state) : null
      if (challenge !== current.challenge || arcade !== current.arcade)
        session.set({ challenge, arcade })
    },
    challenge(id: ChallengeId): FightState {
      const state = createChallengeFight(id)
      session.set({ challenge: initialChallengeProgress(id, state), arcade: null })
      return state
    },
    arcade(fighter: FighterId): FightState {
      const arcade = initialArcade(fighter)
      session.set({ challenge: null, arcade })
      return arcadeFight(arcade)
    },
    next(state: FightState): FightState {
      const current = get(session).arcade
      if (!current) return state
      const arcade = nextArcade(current, state)
      if (arcade === current) return state
      session.set({ challenge: null, arcade })
      return arcadeFight(arcade)
    },
    retry(): FightState | null {
      const current = get(session).arcade
      if (!current || current.complete) return null
      const arcade = { ...current, failed: false }
      session.set({ challenge: null, arcade })
      return arcadeFight(arcade)
    },
    exit() {
      session.set({ challenge: null, arcade: null })
    },
  }
}
export type ClashPractice = ReturnType<typeof createClashPractice>
