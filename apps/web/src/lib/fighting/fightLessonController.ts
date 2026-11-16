import { get, writable } from 'svelte/store'
import { FIGHT_LESSONS, type LessonId } from './fightLessons'
import {
  createLessonFight,
  initialLessonProgress,
  observeLesson,
  type LessonProgress,
} from './fightLessonState'
import type { FightState } from './types'

export function createFightLessons() {
  const session = writable<LessonProgress | null>(null)
  return {
    subscribe: session.subscribe,
    start(id: LessonId): FightState {
      session.set(initialLessonProgress(id))
      return createLessonFight(id)
    },
    observe(state: FightState | null) {
      const current = get(session)
      if (!current) return
      if (!state) return session.set(null)
      const next = observeLesson(current, state)
      if (next !== current) session.set(next)
    },
    next(): LessonId | null {
      const current = get(session)
      if (!current?.complete) return null
      return (
        FIGHT_LESSONS[FIGHT_LESSONS.findIndex((lesson) => lesson.id === current.id) + 1]?.id ?? null
      )
    },
    exit() {
      session.set(null)
    },
  }
}
export type FightLessonsController = ReturnType<typeof createFightLessons>
