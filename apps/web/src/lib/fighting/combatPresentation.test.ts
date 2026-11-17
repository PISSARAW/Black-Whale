import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import MoveProperties from '$lib/components/fighting/FightMoveProperties.svelte'
import TrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
import ActiveObjective from '$lib/components/fighting/FightActiveObjective.svelte'
import { readable } from 'svelte/store'
import { createFightLessons } from './fightLessonController'
import { initialLessonProgress } from './fightLessonState'
import { fightLesson } from './fightLessons'
import { createCombatSchool } from './combatSchool'
import { createClashPractice } from './clashPractice'
import { beginFight, createFight, performMove } from './engine'
import { moveForSlot } from './movesets'
import type { MoveSlot } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

describe('exercise objective counters', () => {
  it.each([
    { id: 'ren', step: 0, complete: false, expected: '1/1' },
    { id: 'ren', step: 1, complete: true, expected: '1/1' },
    { id: 'emperor', step: 0, complete: false, expected: '1/2' },
    { id: 'emperor', step: 1, complete: false, expected: '2/2' },
    { id: 'emperor', step: 2, complete: true, expected: '2/2' },
  ] as const)(
    'renders $id at step $step as $expected (complete: $complete)',
    ({ id, step, complete, expected }) => {
      const progress = { ...initialLessonProgress(id), step, complete }
      const lessons = { ...createFightLessons(), subscribe: readable(progress).subscribe }
      const body = render(ActiveObjective, {
        props: {
          language: 'fr',
          lessons,
          school: createCombatSchool(),
          practice: createClashPractice(),
        },
      }).body
      expect(body).toContain(`${fightLesson(id).title[0]} · ${expected}`)
      if (complete) expect(body).toContain('Exercice réussi.')
    },
  )
})

function properties(slot: MoveSlot, language: 'fr' | 'en' = 'fr'): string {
  return render(MoveProperties, { props: { move: moveForSlot('kurapika', slot)!, language } }).body
}

describe('defensive explanations use the actual guard property', () => {
  it.each([
    ['standingLight', 'Garde haute ou basse'],
    ['standingHeavy', 'Garde haute ou basse'],
    ['lowLight', 'Garde basse'],
    ['airLight', 'Garde haute'],
    ['throw', 'Déprojection / saut'],
  ] as const)('explains %s', (slot, expected) => {
    expect(properties(slot)).toContain(expected)
  })
  it('names the authorized block-cancel destination', () => {
    const body = properties('standingLight')
    expect(body).toContain('Cancel sur garde')
    expect(body).toContain(moveForSlot('kurapika', 'standingHeavy')!.nameFr)
    expect(properties('standingHeavy')).not.toContain('Cancel sur garde')
  })
  it('also explains guards and block cancels in English', () => {
    expect(properties('standingLight', 'en')).toContain('Standing or crouching guard')
    expect(properties('standingLight', 'en')).toContain('Block cancel')
    expect(properties('lowLight', 'en')).toContain('Crouching guard')
  })
  it('does not describe a non-striking performance as a blockable attack', () => {
    const move = moveForSlot('melody', 'neutralSpecial')!
    expect(render(MoveProperties, { props: { move, language: 'fr' } }).body).not.toContain('Garde')
  })
  it('shows the guard requirement alongside startup and recovery in the lab', () => {
    const state = performMove({
      state: beginFight(createFight('kurapika', 'hisoka', { mode: 'training' })),
      side: 'player',
      action: 'heavy',
    })
    const html = render(TrainingOverlay, { props: { state, language: 'fr' } }).body
    expect(html).toContain('Garde haute ou basse')
    expect(html).toContain('AVANTAGE MESURÉ')
    expect(html).not.toContain('ON BLOCK')
  })
})
