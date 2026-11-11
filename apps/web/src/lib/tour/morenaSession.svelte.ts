import {
  dealTheGame,
  openTheBookHere,
  type AnswerCard,
  type MorenaGame,
  type TableKind,
} from './morena'
import {
  morenaDetectionSeed,
  morenaChallengeRandom,
  newMorenaChallengeSeed,
  type MorenaChallenge,
} from './morenaChallenge'
import { applyMorenaCommand, type MorenaCommand } from './morenaCommands'

export type MorenaView = 'menu' | 'rules' | 'lab' | 'table'
export type MorenaMode = 'canonical' | 'lab' | 'challenge'

export interface MorenaLoadout {
  tableKind: TableKind | null
  carryingBook: boolean
  bookmark?: TableKind | null
}

const LAB_UNLOCKED_KEY = 'black-whale:morena-lab'
const EMPTY_LOADOUT: MorenaLoadout = { tableKind: null, carryingBook: false }

const markedForDeal = (invitation: MorenaChallenge | null, cheats: boolean): AnswerCard | null => {
  if (invitation) return invitation.marked
  return cheats ? 'back' : null
}

interface DealContext {
  seed: number
  detectionSeed: number
  previousStreak: number
}

const contextForDeal = (invitation: MorenaChallenge | null): DealContext => {
  const seed = invitation?.seed ?? newMorenaChallengeSeed()
  return {
    seed,
    detectionSeed: invitation?.detectionSeed ?? morenaDetectionSeed(seed),
    previousStreak: invitation?.streak ?? 0,
  }
}

const pagesForDeal = (
  invitation: MorenaChallenge | null,
  loadout: MorenaLoadout,
): [TableKind | null, TableKind | null] => {
  if (invitation) return [invitation.loadout.technique, invitation.loadout.bookmark]
  if (loadout.carryingBook) return openTheBookHere()
  return [loadout.tableKind, loadout.bookmark ?? null]
}

const rememberedLoadout = (
  invitation: MorenaChallenge | null,
  loadout: MorenaLoadout,
  pages: [TableKind | null, TableKind | null],
): MorenaLoadout =>
  invitation ? { tableKind: pages[0], carryingBook: false, bookmark: pages[1] } : { ...loadout }

const challengeKey = (challenge: MorenaChallenge | null) =>
  challenge
    ? [
        challenge.seed,
        challenge.detectionSeed,
        challenge.streak,
        challenge.rounds,
        challenge.verdict,
        challenge.marked,
        challenge.loadout.technique,
        challenge.loadout.bookmark,
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
  currentDetectionSeed = $state(0)
  previousChallengeStreak = $state(0)
  currentMode = $state<MorenaMode>('canonical')
  labUnlocked = $state(false)
  labHatsuId = $state<string | null>(null)
  labClean = $state(false)
  lastLoadout = $state<MorenaLoadout>({ ...EMPTY_LOADOUT })

  #drawRandom = morenaChallengeRandom(0)
  #detectionRandom = morenaChallengeRandom(morenaDetectionSeed(0))

  get challengeWaiting() {
    return Boolean(this.challenge && !this.challengeConsumed)
  }

  readonly drawRandom = () => this.#drawRandom()
  readonly detectionRandom = () => this.#detectionRandom()

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

  showLab() {
    if (this.labUnlocked) this.view = 'lab'
  }

  hydrateLab() {
    if (typeof sessionStorage !== 'undefined') {
      this.labUnlocked = sessionStorage.getItem(LAB_UNLOCKED_KEY) === 'true'
    }
  }

  unlockLab() {
    this.labUnlocked = true
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(LAB_UNLOCKED_KEY, 'true')
  }

  selectLabHatsu(id: string) {
    this.labHatsuId = id
  }

  setLabClean(clean: boolean) {
    this.labClean = clean
    this.cheats = !clean
  }

  choose(card: AnswerCard | null) {
    this.choice = card
  }

  deal(loadout: MorenaLoadout, mode: Exclude<MorenaMode, 'challenge'> = 'canonical') {
    const invitation = this.challengeWaiting ? this.challenge : null
    const context = contextForDeal(invitation)
    this.currentChallengeSeed = context.seed
    this.currentDetectionSeed = context.detectionSeed
    this.previousChallengeStreak = context.previousStreak
    this.#drawRandom = morenaChallengeRandom(this.currentChallengeSeed)
    this.#detectionRandom = morenaChallengeRandom(this.currentDetectionSeed)
    this.challengeConsumed = true
    const pages = pagesForDeal(invitation, loadout)
    this.currentMode = invitation ? 'challenge' : mode
    this.lastLoadout = rememberedLoadout(invitation, loadout, pages)
    this.game = dealTheGame({
      marked: markedForDeal(invitation, this.cheats),
      technique: pages[0],
      bookmark: pages[1],
    })
    this.choice = null
    this.view = 'table'
  }

  dispatch(command: MorenaCommand) {
    this.game = applyMorenaCommand(this.game, command, {
      random: this.drawRandom,
      drawRandom: this.drawRandom,
      detectionRandom: this.detectionRandom,
    })
    this.choice = null
    this.recordCompletion()
    return this.game
  }

  replaceGame(game: MorenaGame) {
    this.game = game
    this.recordCompletion()
  }

  replay() {
    this.deal(this.lastLoadout, this.currentMode === 'canonical' ? 'canonical' : 'lab')
  }

  private recordCompletion() {
    if (this.currentMode === 'canonical' && this.game.phase === 'over') this.unlockLab()
  }
}
