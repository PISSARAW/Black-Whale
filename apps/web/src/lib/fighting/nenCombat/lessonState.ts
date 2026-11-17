import { setTrainingDummy } from '../trainingSession'
import { bodyGyoZone } from './bodyGyo'
import { enContactReadings } from '../en/contacts'
import type { LessonId } from '../fightLessons'
import type { LessonProgress } from '../fightLessonState'
import type { FightState } from '../types'
import type { NenCombatLessonId } from './lessons'
export function prepareNenLesson(state: FightState, id: LessonId): FightState {
  if (id === 'ko-defense' || id === 'ryu-switch')
    return setTrainingDummy(state, { behavior: 'attack', action: 'light', delay: 90 })
  if (id !== 'en-intercept') return state
  return setTrainingDummy(
    {
      ...state,
      player: {
        ...state.player,
        x: 30,
        hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 },
      },
      opponent: { ...state.opponent, x: 60 },
    },
    { behavior: 'attack', action: 'ranged', delay: 90 },
  )
}
function cleanHit(state: FightState, progress: LessonProgress): boolean {
  const hit = state.impact
  return Boolean(
    hit &&
    hit.sequence !== progress.lastImpact &&
    hit.attacker === 'player' &&
    !hit.blocked &&
    !hit.avoided,
  )
}
export const NEN_LESSON_CHECKS: Record<
  NenCombatLessonId,
  (s: FightState, p: LessonProgress) => boolean
> = {
  'en-intercept': (s, p) =>
    p.step === 0
      ? enContactReadings(s, 'player').some((point) => point.dx !== 0)
      : Boolean(
          s.impact &&
          s.impact.sequence !== p.lastImpact &&
          s.impact.attacker === 'opponent' &&
          s.impact.kind === 'ranged' &&
          s.impact.parried,
        ),
  'in-ambush': (s, p) =>
    p.step === 0
      ? s.player.nen.in
      : cleanHit(s, p) && Boolean(s.impact?.concealed) && s.impact?.kind === 'ranged',
  'ko-defense': (s, p) => s.player.nen.ko === 'head' && (p.step === 0 || blockedHead(s, p)),
  'shu-ko': (s, p) =>
    s.player.nen.shu.includes('cards') &&
    (p.step === 0 ||
      (p.step === 1 ? s.player.nen.ko === 'hands' : cleanHit(s, p) && Boolean(s.impact?.critical))),
  'ryu-switch': (s, p) =>
    p.step === 0
      ? Number(s.player.nen.ryu.hands ?? 0) >= 0.7
      : Number(s.player.nen.ryu.head ?? 0) >= 0.7 && (p.step === 1 || blockedHead(s, p)),
  'gyo-body': (s, p) =>
    p.step === 0
      ? bodyGyoZone(s.player) === 'hands'
      : s.player.gyoFocus === 'hands' && cleanHit(s, p) && s.player.attack?.kind === 'light',
}

function blockedHead(state: FightState, progress: LessonProgress): boolean {
  const hit = state.impact
  return Boolean(
    hit &&
    hit.sequence !== progress.lastImpact &&
    hit.attacker === 'opponent' &&
    hit.blocked &&
    !hit.avoided &&
    hit.zone === 'head',
  )
}
