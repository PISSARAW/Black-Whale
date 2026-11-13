import {
  ANSWER_CARDS,
  EMPTY_INFECTION_PROGRESS,
  QUESTION_CARDS,
  TABLE_KINDS,
  type AnswerCard,
  type ContagionMember,
  type InfectionProgress,
  type MorenaGame,
  type QuestionCard,
  type TableKind,
  type Verdict,
} from '@black-whale/ability-modules'

export const MORENA_SAVE_KEY = 'black-whale:morena:save:v1'
export const MAX_MORENA_SAVE_BYTES = 100_000
export const MAX_MORENA_HISTORY = 50

export interface MorenaSavedResult {
  id: string
  completedAt: string
  verdict: Verdict | null
  asked: QuestionCard[]
  kissed: boolean
  technique: TableKind | null
}

export interface MorenaSavedHand {
  game: MorenaGame
  choice: AnswerCard | null
  mode: 'canonical' | 'lab' | 'challenge'
  seed: number
  detectionSeed: number
  drawCursor: number
  detectionCursor: number
  previousStreak: number
  loadout: { tableKind: TableKind | null; carryingBook: boolean; bookmark?: TableKind | null }
  epilogue: 'pending' | 'left' | 'completed' | null
  emperorTimeLifeHours: number
}

export interface MorenaSaveV1 {
  version: 1
  savedAt: string
  active: MorenaSavedHand | null
  labUnlocked: boolean
  labHatsuId: string | null
  discoveredQuestions: QuestionCard[]
  history: MorenaSavedResult[]
  progress: InfectionProgress
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const isInteger = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
const isQuestion = (value: unknown): value is QuestionCard =>
  QUESTION_CARDS.includes(value as QuestionCard)
const isAnswer = (value: unknown): value is AnswerCard => ANSWER_CARDS.includes(value as AnswerCard)
const isTableKind = (value: unknown): value is TableKind | null =>
  value === null || TABLE_KINDS.includes(value as TableKind)

function validGame(value: unknown): value is MorenaGame {
  if (!isObject(value)) return false
  const collectionsValid = [
    Array.isArray(value.questions) && value.questions.every(isQuestion),
    Array.isArray(value.asked) && value.asked.every(isQuestion),
    Array.isArray(value.hand) && value.hand.every(isAnswer),
    Array.isArray(value.graveyard) && value.graveyard.every(isAnswer),
    Array.isArray(value.log),
  ].every(Boolean)
  return ['asking', 'deal', 'settling', 'over'].includes(String(value.phase)) &&
    isInteger(value.round)
    ? collectionsValid
    : false
}

function validMember(value: unknown): value is ContagionMember {
  if (!isObject(value)) return false
  return (
    typeof value.memberId === 'string' &&
    typeof value.label === 'string' &&
    isInteger(value.level) &&
    isInteger(value.kills) &&
    typeof value.uniqueAbilityUnlocked === 'boolean'
  )
}

function validProgress(value: unknown): value is InfectionProgress {
  if (!isObject(value)) return false
  return (
    typeof value.witnessedMurder === 'boolean' &&
    Array.isArray(value.completedSteps) &&
    value.completedSteps.every((step) =>
      ['game-won-yes', 'kiss', 'witnessed-murder'].includes(String(step)),
    ) &&
    (value.member === null || validMember(value.member))
  )
}

function validLoadout(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    isTableKind(value.tableKind) &&
    typeof value.carryingBook === 'boolean' &&
    (value.bookmark === undefined || isTableKind(value.bookmark))
  )
}

function validActive(value: unknown): value is MorenaSavedHand | null {
  if (value === null) return true
  if (!isObject(value) || !validGame(value.game) || !validLoadout(value.loadout)) return false
  return [
    value.choice === null || isAnswer(value.choice),
    ['canonical', 'lab', 'challenge'].includes(String(value.mode)),
    ...[
      value.seed,
      value.detectionSeed,
      value.drawCursor,
      value.detectionCursor,
      value.previousStreak,
    ].map(isInteger),
    [null, 'pending', 'left', 'completed'].includes(value.epilogue as never),
    typeof value.emperorTimeLifeHours === 'number',
  ].every(Boolean)
}

function validHistory(value: unknown): value is MorenaSavedResult[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_MORENA_HISTORY &&
    value.every(
      (result) =>
        isObject(result) &&
        typeof result.id === 'string' &&
        typeof result.completedAt === 'string' &&
        (result.verdict === null ||
          ['infected', 'refused', 'cancelled', 'forced'].includes(String(result.verdict))) &&
        Array.isArray(result.asked) &&
        result.asked.every(isQuestion) &&
        typeof result.kissed === 'boolean' &&
        isTableKind(result.technique),
    )
  )
}

export function encodeMorenaSave(save: MorenaSaveV1): string {
  return JSON.stringify(save)
}

function validSave(
  value: Record<string, unknown>,
): value is Record<string, unknown> & MorenaSaveV1 {
  return [
    value.version === 1,
    typeof value.savedAt === 'string',
    typeof value.labUnlocked === 'boolean',
    value.labHatsuId === null || typeof value.labHatsuId === 'string',
    validActive(value.active),
    Array.isArray(value.discoveredQuestions) && value.discoveredQuestions.every(isQuestion),
    validHistory(value.history),
    validProgress(value.progress),
  ].every(Boolean)
}

export function decodeMorenaSave(serialized: string | null): MorenaSaveV1 | null {
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_MORENA_SAVE_BYTES)
    return null
  try {
    const value = JSON.parse(serialized) as Record<string, unknown>
    return validSave(value) ? (value as unknown as MorenaSaveV1) : null
  } catch {
    return null
  }
}

export function readMorenaSave(): MorenaSaveV1 | null {
  if (typeof localStorage === 'undefined') return null
  const saved = decodeMorenaSave(localStorage.getItem(MORENA_SAVE_KEY))
  if (saved) return saved
  // One-time compatibility with the former tab-scoped laboratory flag.
  if (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('black-whale:morena-lab') === 'true'
  ) {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      active: null,
      labUnlocked: true,
      labHatsuId: null,
      discoveredQuestions: [],
      history: [],
      progress: { ...EMPTY_INFECTION_PROGRESS },
    }
  }
  return null
}

export function writeMorenaSave(save: MorenaSaveV1): void {
  if (typeof localStorage === 'undefined') return
  const encoded = encodeMorenaSave(save)
  if (new TextEncoder().encode(encoded).length <= MAX_MORENA_SAVE_BYTES) {
    localStorage.setItem(MORENA_SAVE_KEY, encoded)
  }
}
