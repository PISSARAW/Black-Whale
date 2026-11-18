import type { CombatRoute } from '../combatRoutes'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import { kameoDefinition } from './catalogue'
import type { KameoId } from './types'
import type { KameoComboLesson } from './comboLessonCatalogue'
export { KAMEO_COMBO_LESSONS, type KameoComboLesson } from './comboLessonCatalogue'

/** Observe the actual Hatsu on its recipient, rather than treating a paid call as a hit. */
export function comboSupportLanded(state: FightState, id: KameoId): boolean {
  switch (id) {
    case 'luzurus':
      return state.opponent.hatsuEffects.desireFrames > 0
    case 'zhanglei':
      return state.player.hatsuEffects.coinCharges > 0
    case 'marayam':
      return state.player.hatsuEffects.isolationFrames > 0
    case 'tubeppa':
      return state.player.health > state.player.maxHealth - 40
    case 'morena':
      return state.opponent.hatsuEffects.contagionStacks > 0
    case 'salesale':
      return state.opponent.hatsuEffects.smokeFrames > 0
  }
}

export function waitingForComboSupport(
  state: FightState,
  route: CombatRoute,
  next: { step: number; startup: number },
) {
  const { step, startup } = next
  const lesson = route.kameo
  if (lesson?.landBeforeStep === step) {
    return supportFramesRemaining(state, lesson.id) > startup
  }
  return Boolean(
    lesson &&
    lesson.waitBeforeStep === step &&
    (!comboSupportLanded(state, lesson.id) || (state.player.attack && !lesson.allowCancel)),
  )
}

/** Uses the same input bit and relative directions as a manual call, including hitstop. */
export function comboSupportInput(
  state: FightState,
  lesson: KameoComboLesson,
  step: number,
): FightInput {
  const slot = state.kameos?.player
  if (step < lesson.afterStep || slot?.phase !== 'reserve' || slot.cooldownFrames > 0)
    return EMPTY_INPUT
  const facing = state.player.facing
  return {
    ...EMPTY_INPUT,
    kameo: true,
    right: lesson.call === 'forward' ? facing === 1 : lesson.call === 'back' && facing === -1,
    left: lesson.call === 'forward' ? facing === -1 : lesson.call === 'back' && facing === 1,
  }
}

function supportFramesRemaining(state: FightState, id: KameoId): number {
  const slot = state.kameos?.player
  if (!slot) return Infinity
  const { enter, startup } = kameoDefinition(id).timing
  if (slot.phase === 'entering') return enter - slot.phaseFrames + startup
  if (slot.phase === 'acting') return Math.max(0, startup - slot.phaseFrames)
  return comboSupportLanded(state, id) ? 0 : Infinity
}
