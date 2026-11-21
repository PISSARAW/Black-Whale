import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Panel from '$lib/components/fighting/FightMoonlightPanel.svelte'
import { beginFight, createFight } from './engine'
import { offerMoonlightContract, respondMoonlightContract } from './moonlightContract'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

function offered(): FightState {
  const base = beginFight(createFight('longhi', 'hisoka', { mode: 'versus-local' }))
  return offerMoonlightContract({
    state: { ...base, player: { ...base.player, x: 42 }, opponent: { ...base.opponent, x: 50 } },
    side: 'player',
  })
}

function html(state: FightState): string {
  return render(Panel, { props: { state, language: 'fr', onOffer: () => {}, onRespond: () => {} } })
    .body
}

describe('Moonlight Act consent panel', () => {
  it('discloses the terms before Chrollo offers a copied Moonlight Act', () => {
    const base = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['longhi' as const], page: 0, open: true, bookmark: null },
      },
    }
    expect(html(state)).toContain('5 secondes de combat')
    expect(html(state)).toContain('Proposer ce pacte')
    expect(html(state)).not.toContain('Signer librement')
  })

  it('shows the duration, reward and penalty before offering sign and refuse controls', () => {
    const body = html(offered())
    expect(body).toContain('5 secondes de combat')
    expect(body).toContain('un usage de Moonlight Act')
    expect(body).toContain('une semaine de simulation')
    expect(body).toContain('Signer librement')
    expect(body).toContain('Refuser')
  })

  it('keeps the player from supplying an AI recipient’s signature', () => {
    const body = html({ ...offered(), mode: 'versus-ai' })
    expect(body).not.toContain('Signer librement')
    expect(body).toContain('L’IA peut accepter')
  })

  it('keeps controls for a human recipient when Longhi is P2', () => {
    const base = offered()
    const state = {
      ...base,
      mode: 'versus-ai' as const,
      player: base.opponent,
      opponent: base.player,
      moonlight: {
        offer: {
          ...base.moonlight!.offer!,
          issuer: 'opponent' as const,
          recipient: 'player' as const,
        },
      },
    }
    expect(html(state)).toContain('Signer librement')
    expect(html(state)).toContain('Refuser')
  })

  it('shows the active truce only after a voluntary signature', () => {
    const signed = respondMoonlightContract({ state: offered(), side: 'opponent', accept: true })
    expect(html(signed)).toContain('Deux signatures · trêve en cours')
    expect(html(signed)).not.toContain('Signer librement')
  })

  it('displays a refusal without a sanction or lingering signature prompt', () => {
    const declined = respondMoonlightContract({ state: offered(), side: 'opponent', accept: false })
    expect(html(declined)).toContain('Hisoka refuse. Aucun effet ni sanction.')
    expect(html(declined)).not.toContain('Signer librement')
  })
})
