import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Panel from '$lib/components/fighting/FightBashoPoem.svelte'
import { beginFight, createFight, performAuraAttack } from './engine'
import { composeBashoPoem } from './bashoAction'
import { BASHO_POEMS } from './bashoPoem'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

function html(state: FightState, language: 'fr' | 'en' = 'fr'): string {
  return render(Panel, { props: { state, language, onCompose: () => {} } }).body
}

describe('Basho poem panel', () => {
  it('shows editable three-line composition, the exact trigger and disclosed duel tuning', () => {
    const state = beginFight(createFight('basho', 'hisoka'))
    const body = html(state)
    expect(body).toContain('textarea')
    expect(body).toContain('Tout ce que je frappe')
    expect(body).toContain('Avec mon poing')
    expect(body).toContain('Prendra feu')
    expect(body).toContain('25 aura')
    expect(body).toContain('Aucun bonus général')
    expect(body).toContain('parade, coup de pied, projection et projectile')
    expect(body).toContain('aucun souhait libre n’est interprété')
    expect(body).toContain('Réponses mensongères')
    expect(body).toContain('Talisman hivernal')
    expect(body).toContain('Feuilles restantes : 3')
    expect(body).not.toContain('Poème funéraire')
  })

  it('shows committed text and writing status without presenting it as immediately armed', () => {
    const base = beginFight(createFight('basho', 'hisoka'))
    const state = composeBashoPoem(
      { state: base, side: 'player', text: BASHO_POEMS.en },
      performAuraAttack,
    )
    const body = html(state)
    expect(body).toContain('Écriture en cours')
    expect(body).toContain('Whatever I strike')
    expect(body).not.toContain('Poème écrit :')
  })

  it('gives each local human their own paper, and does not let P1 write for the AI', () => {
    const base = beginFight(createFight('basho', 'basho', { mode: 'versus-local' }))
    expect(html(base)).toContain('haiku-player')
    expect(html(base)).toContain('haiku-opponent')
    expect(html({ ...base, mode: 'versus-ai' })).not.toContain('haiku-opponent')
  })

  it('displays burning on the actual recipient and offers the English composition', () => {
    const base = beginFight(createFight('basho', 'hisoka'))
    const state = {
      ...base,
      opponent: { ...base.opponent, bashoBurn: { owner: 'player' as const, remainingFrames: 60 } },
    }
    expect(html(state)).toContain('En feu')
    expect(html(base, 'en')).toContain('Whatever I strike')
    expect(html(base, 'en')).toContain('Write on paper')
  })
})
