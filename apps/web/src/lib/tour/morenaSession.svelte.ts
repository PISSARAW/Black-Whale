import {
  EMPTY_INFECTION_PROGRESS,
  completeRecruitment,
  dealTheGame,
  openTheBookHere,
  recordMemberKill,
  witnessMurder,
  type AnswerCard,
  type InfectionProgress,
  type MorenaGame,
  type QuestionCard,
  type TableKind,
  type VictimStatus,
} from './morena'
import {
  morenaDetectionSeed,
  morenaChallengeValue,
  newMorenaChallengeSeed,
  type MorenaChallenge,
} from './morenaChallenge'
import { applyMorenaCommand, type MorenaCommand } from './morenaCommands'
import {
  MAX_MORENA_HISTORY,
  type MorenaSavedHand,
  type MorenaSaveV1,
  type MorenaSavedResult,
} from './morenaPersistence'

export type MorenaView = 'menu' | 'rules' | 'lab' | 'table'
export type MorenaMode = 'canonical' | 'lab' | 'challenge'

export interface MorenaLoadout {
  tableKind: TableKind | null
  carryingBook: boolean
  bookmark?: TableKind | null
}

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
  drawCursor = $state(0)
  detectionCursor = $state(0)
  discoveredQuestions = $state<QuestionCard[]>([])
  history = $state<MorenaSavedResult[]>([])
  progress = $state<InfectionProgress>({ ...EMPTY_INFECTION_PROGRESS })
  epilogue = $state<'pending' | 'left' | 'completed' | null>(null)
  resumeAvailable = $state(false)
  emperorTimeLifeHours = $state(0)
  onChange: (() => void) | null = null
  private protectedResume: MorenaSavedHand | null = null

  get challengeWaiting() {
    return Boolean(this.challenge && !this.challengeConsumed)
  }

  readonly drawRandom = () => morenaChallengeValue(this.currentChallengeSeed, this.drawCursor++)
  readonly detectionRandom = () =>
    morenaChallengeValue(this.currentDetectionSeed, this.detectionCursor++)

  private changed() {
    this.onChange?.()
  }

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
    this.changed()
  }

  showMenu() {
    if (this.protectedResume) {
      this.restoreHand(this.protectedResume)
      this.protectedResume = null
      this.resumeAvailable = true
    } else {
      this.resumeAvailable = false
    }
    this.view = 'menu'
    this.changed()
  }

  showLab() {
    if (this.labUnlocked) {
      this.view = 'lab'
      this.resumeAvailable = false
      this.changed()
    }
  }

  unlockLab() {
    this.labUnlocked = true
    this.changed()
  }

  selectLabHatsu(id: string) {
    this.labHatsuId = id
    this.changed()
  }

  setLabClean(clean: boolean) {
    this.labClean = clean
    this.cheats = !clean
    this.changed()
  }

  choose(card: AnswerCard | null) {
    this.choice = card
    this.changed()
  }

  deal(loadout: MorenaLoadout, mode: Exclude<MorenaMode, 'challenge'> = 'canonical') {
    const invitation = this.challengeWaiting ? this.challenge : null
    if (invitation && this.resumeAvailable) this.protectedResume = this.activeHand()
    const context = contextForDeal(invitation)
    this.currentChallengeSeed = context.seed
    this.currentDetectionSeed = context.detectionSeed
    this.previousChallengeStreak = context.previousStreak
    this.drawCursor = 0
    this.detectionCursor = 0
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
    this.epilogue = null
    this.resumeAvailable = false
    this.view = 'table'
    this.changed()
  }

  dispatch(command: MorenaCommand) {
    const before = this.game
    this.game = applyMorenaCommand(before, command, {
      random: this.drawRandom,
      drawRandom: this.drawRandom,
      detectionRandom: this.detectionRandom,
    })
    if (command.kind === 'ask' && this.game !== before) this.discover(command.question)
    this.choice = null
    this.recordCompletion()
    this.changed()
    return this.game
  }

  replaceGame(game: MorenaGame) {
    this.game = game
    this.recordCompletion()
    this.changed()
  }

  replay() {
    this.deal(this.lastLoadout, this.currentMode === 'canonical' ? 'canonical' : 'lab')
  }

  discover(question: QuestionCard) {
    if (!this.discoveredQuestions.includes(question)) {
      this.discoveredQuestions = [...this.discoveredQuestions, question]
    }
  }

  observeMurder() {
    const witnessed = witnessMurder(this.game, this.progress)
    this.progress = completeRecruitment(this.game, witnessed)
    this.epilogue = this.progress.member ? 'completed' : 'left'
    this.changed()
  }

  leaveEpilogue() {
    this.epilogue = 'left'
    this.changed()
  }

  recordKill(status: VictimStatus) {
    if (!this.progress.member) return
    this.progress = { ...this.progress, member: recordMemberKill(this.progress.member, status) }
    this.changed()
  }

  setEmperorTimeLifeHours(hours: number) {
    const next = Math.max(0, hours)
    if (next === this.emperorTimeLifeHours) return
    this.emperorTimeLifeHours = next
    this.changed()
  }

  hydrate(save: MorenaSaveV1 | null) {
    if (!save) return
    this.labUnlocked = save.labUnlocked
    this.labHatsuId = save.labHatsuId
    this.discoveredQuestions = [...save.discoveredQuestions]
    this.history = [...save.history]
    this.progress = { ...save.progress, completedSteps: [...save.progress.completedSteps] }
    if (!save.active) return
    this.restoreHand(save.active)
    this.resumeAvailable = true
    this.view = 'menu'
  }

  resume() {
    if (!this.resumeAvailable) return
    this.resumeAvailable = false
    this.view = 'table'
    this.changed()
  }

  abandonResume() {
    this.resumeAvailable = false
    this.game = dealTheGame()
    this.choice = null
    this.epilogue = null
    this.changed()
  }

  snapshot(): MorenaSaveV1 {
    const active =
      this.protectedResume ??
      (this.view === 'table' || this.resumeAvailable ? this.activeHand() : null)
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      active,
      labUnlocked: this.labUnlocked,
      labHatsuId: this.labHatsuId,
      discoveredQuestions: [...this.discoveredQuestions],
      history: this.history.slice(0, MAX_MORENA_HISTORY),
      progress: $state.snapshot(this.progress),
    }
  }

  private activeHand(): MorenaSavedHand {
    return {
      game: $state.snapshot(this.game),
      choice: this.choice,
      mode: this.currentMode,
      seed: this.currentChallengeSeed,
      detectionSeed: this.currentDetectionSeed,
      drawCursor: this.drawCursor,
      detectionCursor: this.detectionCursor,
      previousStreak: this.previousChallengeStreak,
      loadout: { ...this.lastLoadout },
      epilogue: this.epilogue,
      emperorTimeLifeHours: this.emperorTimeLifeHours,
    }
  }

  private restoreHand(active: MorenaSavedHand) {
    this.game = active.game
    this.choice = active.choice
    this.currentMode = active.mode
    this.currentChallengeSeed = active.seed
    this.currentDetectionSeed = active.detectionSeed
    this.drawCursor = active.drawCursor
    this.detectionCursor = active.detectionCursor
    this.previousChallengeStreak = active.previousStreak
    this.lastLoadout = { ...active.loadout }
    this.epilogue = active.epilogue
    this.emperorTimeLifeHours = active.emperorTimeLifeHours
  }

  private recordCompletion() {
    if (this.game.phase !== 'over') return
    if (this.currentMode === 'canonical') this.labUnlocked = true
    const id = `${this.currentMode}:${this.currentChallengeSeed}`
    if (!this.history.some((result) => result.id === id)) {
      this.history = [
        {
          id,
          completedAt: new Date().toISOString(),
          verdict: this.game.verdict,
          asked: [...this.game.asked],
          kissed: this.game.kissed,
          technique: this.game.technique,
        },
        ...this.history,
      ].slice(0, MAX_MORENA_HISTORY)
    }
    if (
      !this.game.proxied &&
      this.game.kissed &&
      !this.progress.member &&
      (this.game.verdict === 'infected' || this.game.verdict === 'forced')
    ) {
      this.epilogue = 'pending'
    }
  }
}
