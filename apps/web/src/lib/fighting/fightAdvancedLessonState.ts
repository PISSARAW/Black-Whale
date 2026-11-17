import { performMove } from './engine'
import { setTrainingDummy } from './trainingSession'
import type { LessonId } from './fightLessons'
import type { LessonProgress } from './fightLessonState'
import type { AdvancedLessonId } from './fightAdvancedLessons'
import type { FightState } from './types'

export function prepareAdvancedLesson(state: FightState, id: LessonId): FightState {
  if (id === 'anti-air') return setTrainingDummy(state, { behavior: 'jump' })
  if (id === 'throw-escape')
    return setTrainingDummy(state, { behavior: 'attack', action: 'throw', delay: 45 })
  if (id === 'hit-confirm') return setTrainingDummy(state, { behavior: 'guard-after-hit' })
  if (id === 'corner-defense') {
    const placed = {
      ...state,
      player: { ...state.player, x: 7 },
      opponent: { ...state.opponent, x: 13 },
    }
    return setTrainingDummy(placed, { behavior: 'attack', action: 'heavy', delay: 60 })
  }
  if (id === 'interrupt-setup') return performMove({ state, side: 'opponent', action: 'special' })
  return state
}

function hit(state: FightState, progress: LessonProgress) {
  const impact = state.impact
  return Boolean(
    impact &&
    impact.sequence !== progress.lastImpact &&
    impact.attacker === 'player' &&
    !impact.blocked &&
    !impact.avoided &&
    !impact.invulnerable,
  )
}

export const ADVANCED_LESSON_CHECKS: Record<
  AdvancedLessonId,
  (s: FightState, p: LessonProgress) => boolean
> = {
  'anti-air': (s, p) =>
    hit(s, p) && s.impact!.antiAir && s.player.attack?.moveId === 'kurapika:standingHeavy',
  'throw-escape': (s, p) => Boolean(s.throwTech && s.throwTech.frame >= p.lastFrame),
  'hit-confirm': (s, p) =>
    hit(s, p) &&
    (p.step === 0
      ? s.player.attack?.moveId === 'kurapika:standingLight'
      : s.player.attack?.moveId === 'kurapika:standingHeavy' && s.impact!.comboHits === 2),
  'corner-defense': (s, p) =>
    p.step === 0
      ? guarded(s, p)
      : hit(s, p) && s.impact!.punish && s.player.attack?.kind === 'light',
  'interrupt-setup': (s, p) =>
    p.step === 0
      ? Boolean(s.opponent.cyclotronWindup)
      : Boolean(p.setupHitFrame) &&
        !s.opponent.cyclotronWindup &&
        s.opponent.hitStun > 0 &&
        s.opponent.hatsuEffects.cyclotronTurns === 0,
}

function guarded(s: FightState, p: LessonProgress) {
  return Boolean(
    s.impact &&
    s.impact.sequence !== p.lastImpact &&
    s.impact.attacker === 'opponent' &&
    s.player.x <= 10 &&
    s.opponent.attack?.kind === 'heavy' &&
    s.impact.blocked &&
    !s.impact.parried &&
    !s.impact.avoided,
  )
}

export function normalizeAdvancedProgress(
  progress: LessonProgress,
  state: FightState,
): LessonProgress {
  if (progress.id === 'interrupt-setup' && progress.step === 1 && hit(state, progress))
    return { ...progress, setupHitFrame: state.frame }
  if (progress.id !== 'hit-confirm' || progress.step !== 1) return progress
  if (state.opponent.hitStun > 0 || state.hitstop > 0) return progress
  return { ...progress, step: 0, heldFrames: 0 }
}
