import {
  dealTheGame,
  openTheBookHere,
  type AnswerCard,
  type MorenaGame,
  type TableKind,
} from './morena'
import {
  morenaChallengeRandom,
  newMorenaChallengeSeed,
  type MorenaChallenge,
} from './morenaChallenge'
import { applyMorenaCommand, type MorenaCommand } from './morenaCommands'

export type MorenaView = 'menu' | 'rules' | 'table'

interface MorenaLoadout {
  tableKind: TableKind | null
  carryingBook: boolean
}

const markedForDeal = (invitation: MorenaChallenge | null, cheats: boolean): AnswerCard | null => {
  if (invitation) return invitation.marked
  return cheats ? 'back' : null
}

const challengeKey = (challenge: MorenaChallenge | null) =>
  challenge
    ? [
        challenge.seed,
        challenge.streak,
        challenge.rounds,
        challenge.verdict,
        challenge.marked,
      ].join(':')
    : ''

/** Owns the route-level negotiation state and its deterministic challenge draw. */
export class MorenaSession {
  view = $state<MorenaView>('menu')
  cheats = $state(true)
  game = $state<MorenaGame>(dealTheGame())
  choice = $state<AnswerCard | null>(null)
  challenge = $state<MorenaChallenge | null>(null)
  challengeConsumed = $state(false)
  currentChallengeSeed = $state(0)
  previousChallengeStreak = $state(0)

  #drawFromChallenge = morenaChallengeRandom(0)

  get challengeWaiting() {
    return Boolean(this.challenge && !this.challengeConsumed)
  }

  readonly random = () => this.#drawFromChallenge()

  setChallenge(challenge: MorenaChallenge | null) {
    if (challengeKey(challenge) === challengeKey(this.challenge)) return
    this.challenge = challenge
    this.challengeConsumed = false
    if (challenge) this.cheats = challenge.marked !== null
  }

  setCheats(cheats: boolean) {
    this.cheats = cheats
  }

  showRules() {
    this.view = 'rules'
  }

  showMenu() {
    this.view = 'menu'
  }

  choose(card: AnswerCard | null) {
    this.choice = card
  }

  deal(loadout: MorenaLoadout) {
    const invitation = this.challengeWaiting ? this.challenge : null
    this.currentChallengeSeed = invitation?.seed ?? newMorenaChallengeSeed()
    this.previousChallengeStreak = invitation?.streak ?? 0
    this.#drawFromChallenge = morenaChallengeRandom(this.currentChallengeSeed)
    this.challengeConsumed = true
    const pages = loadout.carryingBook ? openTheBookHere() : null
    this.game = dealTheGame({
      marked: markedForDeal(invitation, this.cheats),
      technique: pages ? pages[0] : loadout.tableKind,
      bookmark: pages ? pages[1] : null,
    })
    this.choice = null
    this.view = 'table'
  }

  dispatch(command: MorenaCommand) {
    this.game = applyMorenaCommand(this.game, command, { random: this.random })
    this.choice = null
    return this.game
  }

  replaceGame(game: MorenaGame) {
    this.game = game
  }
}
