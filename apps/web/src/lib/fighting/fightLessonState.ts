import { prepareNenLesson, NEN_LESSON_CHECKS } from './nenCombat/lessonState'
import { FOUNDATION_CHECKS } from './fightFoundationLessons'
import {
  ADVANCED_LESSON_CHECKS,
  prepareAdvancedLesson,
  normalizeAdvancedProgress,
} from './fightAdvancedLessonState'
import { createFightState } from './fightState'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import { bungeeVisible } from './hisokaTechnique'
import { nenTacticalState } from './nen'
import { fightLesson, type LessonId } from './fightLessons'
import type { FightState } from './types'

export interface LessonProgress {
  setupHitFrame?: number
  id: LessonId
  step: number
  heldFrames: number
  lastImpact: number
  lastAura: number
  auraRecovered: number
  lastFrame: number
  complete: boolean
  invalid: boolean
}
export function createLessonFight(id: LessonId): FightState {
  const lesson = fightLesson(id)
  let state = createFightState(lesson.fighter, lesson.opponent, {
    mode: 'training',
    formatId: 'knockout',
    environment: { stageId: 'heavens-arena', arenaInteractions: false },
  })
  state = {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: id === 'throw' ? 56 : id === 'punish' ? 54 : 50 },
  }
  for (const side of ['player', 'opponent'] as const)
    state = setTrainingResources(state, side, {
      aura: id === 'zetsu' && side === 'player' ? 20 : 90,
      infiniteHealth: true,
      infiniteAura: false,
    })
  state = setTrainingDummy(state, {
    behavior: ['ken', 'guard', 'punish'].includes(id) ? 'attack' : 'idle',
    action: id === 'punish' ? 'heavy' : 'light',
    delay: 90,
  })
  if (id === 'gyo')
    state = {
      ...state,
      bungeeGum: { owner: 'opponent', target: 'player', hidden: true, retracting: false },
    }
  return prepareNenLesson(prepareAdvancedLesson(state, id), id)
}
export function initialLessonProgress(id: LessonId): LessonProgress {
  return {
    id,
    step: 0,
    heldFrames: 0,
    lastFrame: 0,
    lastImpact: 0,
    lastAura: id === 'zetsu' ? 20 : 90,
    auraRecovered: 0,
    complete: false,
    invalid: false,
  }
}
type Check = (state: FightState, progress: LessonProgress) => boolean
const CHECKS: Record<LessonId, Check> = {
  ...FOUNDATION_CHECKS,
  ...ADVANCED_LESSON_CHECKS,
  ...NEN_LESSON_CHECKS,
  ren: (s) => {
    const { player } = s
    const { technique } = nenTacticalState(player)
    return player.nen.mode === 'ren' && ['ren', 'shu'].includes(technique) && player.aura < 90
  },
  ken: (s, p) =>
    s.player.nen.ken &&
    s.impact?.sequence !== p.lastImpact &&
    s.impact?.attacker === 'opponent' &&
    s.impact.blocked &&
    !s.impact.avoided,
  zetsu: (s, p) => s.player.nen.mode === 'zetsu' && p.auraRecovered >= 6,
  gyo: (s) => s.player.nen.gyo && bungeeVisible(s),
  ryu: (s) => Number(s.player.nen.ryu.hands ?? 0) >= 0.7 && !s.player.nen.ko,
  ko: (s, p) =>
    s.impact?.sequence !== p.lastImpact &&
    s.impact?.attacker === 'player' &&
    s.impact.critical &&
    !s.impact.blocked &&
    !s.impact.avoided,
  emperor: (s, p) =>
    p.step === 0
      ? Boolean(s.player.kurapika?.emperorTime && s.player.kurapika.lifespanFrames >= 60)
      : !s.player.kurapika?.emperorTime,
  gum: (s, p) => s.bungeeGum?.owner === 'player' && (p.step === 0 || recalledTarget(s)),
  bookmark: (s, p) => {
    const book = s.player.chrolloBook
    return (
      book?.bookmark === 'sun-and-moon' &&
      (p.step === 0 ? !book.open : book.open && book.pages[book.page] === 'black-voice')
    )
  },
  window: (s) => s.player.hatsuEffects.baton?.markedTarget === 'opponent',
}
const HOLD_FRAMES: Partial<Record<LessonId, number>> = {
  spacing: 30,
  ten: 60,
  ren: 60,
  gyo: 30,
  ryu: 30,
}

function recalledTarget(state: FightState): boolean {
  return Boolean(
    state.bungeeGum?.retracting &&
    !state.bungeeGum.rebounding &&
    state.player.attack?.moveId === 'hisoka:forwardSpecial',
  )
}

/** Only simulation frames advance a lesson; rendering, pausing and menu clicks do not. */
export function observeLesson(progress: LessonProgress, state: FightState): LessonProgress {
  if (progress.complete || progress.invalid) return progress
  if (changedScenario(progress, state)) return { ...progress, invalid: true }
  if (state.frame === progress.lastFrame) return progress
  progress = normalizeAdvancedProgress(progress, state)
  progress = observeAuraRecovery(progress, state)
  const delta = state.frame - progress.lastFrame
  const passed = CHECKS[progress.id](state, progress) === true
  const heldFrames = passed ? progress.heldFrames + delta : 0
  const advances = passed && heldFrames >= (HOLD_FRAMES[progress.id] ?? 1)
  const step = progress.step + Number(advances)
  return {
    ...progress,
    lastFrame: state.frame,
    lastImpact: impactSequence(state, progress.lastImpact),
    heldFrames: advances ? 0 : heldFrames,
    step,
    complete: step >= fightLesson(progress.id).steps.length,
  }
}

function observeAuraRecovery(progress: LessonProgress, state: FightState): LessonProgress {
  const recovered =
    state.player.nen.mode === 'zetsu' ? Math.max(0, state.player.aura - progress.lastAura) : 0
  return {
    ...progress,
    lastAura: state.player.aura,
    auraRecovered: progress.auraRecovered + recovered,
  }
}

function impactSequence(state: FightState, fallback: number): number {
  return state.impact?.sequence ?? fallback
}

function changedScenario(progress: LessonProgress, state: FightState): boolean {
  const lesson = fightLesson(progress.id)
  return (
    state.mode !== 'training' ||
    state.player.id !== lesson.fighter ||
    state.opponent.id !== lesson.opponent ||
    state.frame < progress.lastFrame
  )
}
