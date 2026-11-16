import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import MoveProperties from '$lib/components/fighting/FightMoveProperties.svelte'
import TrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
import { beginFight, createFight, performMove } from './engine'
import { moveForSlot } from './movesets'
import type { MoveSlot } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
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
