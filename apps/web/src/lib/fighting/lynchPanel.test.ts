import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Panel from '$lib/components/fighting/FightLynchInterrogation.svelte'
import { beginFight, createFight } from './engine'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})
const html = (state: FightState) =>
  render(Panel, { props: { state, language: 'fr', onQuestion: () => {} } }).body

describe('private Body and Soul panel', () => {
  it('offers supported questions to human interrogators without letting P1 command the AI', () => {
    const state = beginFight(createFight('lynch', 'lynch', { mode: 'versus-local' }))
    expect(html(state)).toContain('lynch-question-player')
    expect(html(state)).toContain('lynch-question-opponent')
    expect(html({ ...state, mode: 'versus-ai' })).not.toContain('lynch-question-opponent')
    expect(html(state)).toContain('cible doit rester consciente')
  })

  it('never serializes a private answer into the shared page until explicitly revealed', () => {
    const state = beginFight(createFight('lynch', 'hisoka', { mode: 'versus-ai' }))
    const privateReply = {
      frame: 5,
      question: 'identity' as const,
      questioner: 'player' as const,
      target: 'opponent' as const,
      identity: 'bonolenov' as const,
    }
    const answered = {
      ...state,
      player: { ...state.player, bodyAndSoulReplies: [privateReply] },
      opponent: { ...state.opponent, bodyAndSoulReplies: [privateReply] },
    }
    expect(html(answered)).toContain('Maintenir pour écouter')
    expect(html(answered)).not.toContain('Bonolenov')
    const local = html({ ...answered, mode: 'versus-local' })
    expect(local).toContain('Choisir un participant')
    expect(local).not.toContain('Bonolenov')
  })
})
