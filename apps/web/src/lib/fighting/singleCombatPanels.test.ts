import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Window from '$lib/components/fighting/FightSecretWindowStatus.svelte'
import Melody from '$lib/components/fighting/FightMelodyStatus.svelte'
import { beginFight, createFight } from './engine'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

it('shows Melody’s physiological clue privately, without presenting a verdict', () => {
  const state = beginFight(createFight('melody', 'melody', { mode: 'versus-ai' }))
  state.player.melodyHearing = {
    target: 'opponent',
    frames: 12,
    direction: 1,
    pulse: 'agitated',
    acceleration: 'sudden',
    threat: null,
  }
  state.opponent.melodyHearing = { ...state.player.melodyHearing, target: 'player' }
  const shown = render(Melody, { props: { state, side: 'player', language: 'fr' } }).body
  expect(shown).toContain('accélération brusque')
  expect(shown).toContain('vérité indéterminée')
  expect(render(Melody, { props: { state, side: 'opponent', language: 'fr' } }).body).not.toContain(
    'accélération brusque',
  )
})

function listening(): FightState {
  const state = beginFight(createFight('musse', 'hisoka', { mode: 'versus-local' }))
  return {
    ...state,
    player: {
      ...state.player,
      secretWindow: {
        target: 'opponent',
        attachedAt: 1,
        mode: 'listening',
        observation: { frame: 60, action: 'audio-only' },
        history: [{ frame: 1, action: 'audio-only' }],
        words: { frame: 60, speaker: 'opponent', text: 'Parole <réelle>.' },
        recordings: [{ frame: 60, speaker: 'opponent', text: 'Parole <réelle>.' }],
      },
    },
  }
}

describe('Secret Window private feed panel', () => {
  it('renders the audio-only mode and escaped, reviewable speech in both languages', () => {
    const state = listening()
    const fr = render(Window, { props: { state, side: 'player', language: 'fr' } }).body
    expect(fr).toContain('Écoute à travers les obstacles')
    expect(fr).toContain('Consulter les observations reçues')
    expect(fr).toContain('&lt;réelle>')
    expect(fr).not.toContain('<réelle>')
    const en = render(Window, { props: { state, side: 'player', language: 'en' } }).body
    expect(en).toContain('Review received observations')
  })

  it('hides the other owner’s feed in a single-view game', () => {
    const base = listening()
    const state = {
      ...base,
      mode: 'versus-ai' as const,
      opponent: { ...base.opponent, id: 'musse' as const, secretWindow: base.player.secretWindow },
    }
    expect(
      render(Window, { props: { state, side: 'opponent', language: 'fr' } }).body,
    ).not.toContain('Parole')
  })
})
