import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Panel from '$lib/components/fighting/FightBloodyMary.svelte'
import { createFight, beginFight } from './engine'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

function html(state: FightState, language: 'fr' | 'en' = 'fr'): string {
  return render(Panel, { props: { state, language, onCommand: () => {} } }).body
}

describe('Bloody Mary material and capture panel', () => {
  it('discloses the wound, own blood, finite bags, physical travel and duel resistance before commands', () => {
    const body = html(beginFight(createFight('zakuro', 'hisoka')))
    for (const phrase of [
      'Plaie requise',
      'son propre sang',
      'perfusion réelle',
      'parcourir la distance',
      '6 unités de sang',
      '6 unités en poche',
      'sans rendre de PV',
      'Ren/Ken',
      '30 minutes',
      'Ouvrir une plaie',
    ])
      expect(body).toContain(phrase)
    expect(body).not.toContain('Exsanguination')
  })

  it('does not allow the human to control the AI’s preparation', () => {
    const body = html(beginFight(createFight('hisoka', 'zakuro', { mode: 'versus-ai' })))
    expect(body).not.toContain('<button')
    expect(body).toContain('Plaie requise')
  })

  it('shows missing real equipment for a copied page without providing it', () => {
    const base = beginFight(createFight('chrollo', 'hisoka'))
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: {
          pages: ['zakuro' as const],
          page: 0,
          open: true,
          bookmark: null,
        },
      },
    }
    expect(html(state)).toContain('Perfusion réelle manquante')
  })

  it('shows a physical captive that retains Nen, rather than a stun or forced Zetsu', () => {
    const base = beginFight(createFight('zakuro', 'hisoka'))
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        maryCapture: {
          owner: 'player' as const,
          x: 50,
          y: 0,
          frames: 70,
          resistance: 0,
          health: base.opponent.health,
        },
      },
    }
    expect(html(state)).toContain('Nen libre')
    expect(html(state, 'en')).toContain('Nen remains available')
  })
})
