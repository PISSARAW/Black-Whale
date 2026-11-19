import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import FightSaiyuSenses from '../components/fighting/FightSaiyuSenses.svelte'
import { beginFight, createFight } from './engine'
import type { FightSide } from './types'

// The global text preprocessor reads the request's translation context.
vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ data: { localizedContent: {} } }) }
})
vi.mock('$lib/i18n', async () => {
  const { readable } = await import('svelte/store')
  return { locale: readable('fr') }
})

describe('Three Monkeys screen perception', () => {
  it.each(['player', 'opponent'] as const)(
    'masks the arena only for the blinded %s perspective',
    (side) => {
      const state = beginFight(createFight('saiyu', 'hisoka', { mode: 'versus-local' }))
      state[side] = { ...state[side], hatsuEffects: { ...state[side].hatsuEffects, senseSeals: 1 } }
      const other: FightSide = side === 'player' ? 'opponent' : 'player'
      const blind = render(FightSaiyuSenses, {
        props: { state, language: 'fr', viewer: side },
      }).body
      expect(blind).toContain(`data-saiyu-blind="${side}"`)
      expect(blind).toContain('Vue scellée')
      const sighted = render(FightSaiyuSenses, {
        props: { state, language: 'en', viewer: other },
      }).body
      expect(sighted).not.toContain('data-saiyu-blind=')
    },
  )

  it('shows the correct independent hearing and speech labels without hiding the arena', () => {
    const state = beginFight(createFight('saiyu', 'hisoka'))
    state.player.hatsuEffects.senseSeals = 6
    const result = render(FightSaiyuSenses, { props: { state, language: 'fr' } }).body.replace(
      /<!--.*?-->/gs,
      '',
    )
    expect(result).toContain('Kikazaru · Ouïe')
    expect(result).toContain('Iwazaru · Parole')
    expect(result).not.toContain('data-saiyu-blind=')
  })
})
