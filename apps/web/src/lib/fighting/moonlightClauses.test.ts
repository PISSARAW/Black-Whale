import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Panel from '$lib/components/fighting/FightMoonlightPanel.svelte'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import {
  moonlightAiWaiting,
  offerMoonlightContract,
  respondMoonlightContract,
} from './moonlightContract'
import { MOONLIGHT_CLAUSES, moonlightClause, type MoonlightClauseId } from './moonlightClauses'
import { rewardMoonlightParty } from './moonlightParties'
import { parsePvpPacket } from './pvp/protocol'
import { applyPvpCommand } from './pvp/commands'
import { EMPTY_INPUT, type FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

function duel(mode: 'versus-local' | 'versus-ai' = 'versus-local'): FightState {
  const state = beginFight(createFight('longhi', 'hisoka', { mode, formatId: 'knockout' }))
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 30 },
    opponent: { ...state.opponent, x: 50, aura: 30 },
  }
}

function signed(clause: MoonlightClauseId, state = duel()): FightState {
  const offered = offerMoonlightContract({ state, side: 'player', clause })
  return respondMoonlightContract({ state: offered, side: 'opponent', accept: true })
}

function html(state: FightState): string {
  return render(Panel, { props: { state, language: 'fr', onOffer: () => {}, onRespond: () => {} } })
    .body
}

describe('Moonlight Act predefined contracts', () => {
  it.each(MOONLIGHT_CLAUSES)(
    '$id copies every disclosed field into the offer and only starts on signature',
    (clause) => {
      const offered = offerMoonlightContract({ state: duel(), side: 'player', clause: clause.id })
      expect(offered.moonlight?.offer).toMatchObject({
        clause: clause.id,
        terms: clause.terms,
        reward: clause.reward,
        penalty: clause.penalty,
      })
      expect(offered.moonlight?.active).toBeUndefined()
      const pact = respondMoonlightContract({ state: offered, side: 'opponent', accept: true })
      expect(pact.moonlight?.active?.remainingFrames).toBe(clause.durationFrames)
    },
  )

  it('defaults to the mutual truce, so the L key keeps its disclosed contract', () => {
    const offered = offerMoonlightContract({ state: duel(), side: 'player' })
    expect(offered.moonlight?.offer?.clause).toBe('truce')
  })

  it('lets bare, uncharged strikes through a bare-hands pact without any sanction', () => {
    const pact = signed('bare-hands')
    const struck = performAttack(pact, 'player', 'light')
    expect(struck.player.attack?.kind).toBe('light')
    expect(struck.player.moonlightZetsu).toBeUndefined()
    expect(struck.moonlight?.active).toBeDefined()
  })

  it('sanctions a technique under bare hands and cancels it before it takes effect', () => {
    const ready = duel()
    const pact = signed('bare-hands', { ...ready, opponent: { ...ready.opponent, aura: 80 } })
    const attempt = performAttack(pact, 'opponent', 'special')
    expect(attempt.opponent.moonlightZetsu).toBe(true)
    expect(attempt.opponent.attack).toBeNull()
    expect(attempt.moonlight?.outcome).toEqual({ kind: 'breached', side: 'opponent' })
    expect(attempt.player.moonlightZetsu).toBeUndefined()
  })

  it('still forbids every strike under the long truce', () => {
    const struck = performAttack(signed('long-truce'), 'player', 'light')
    expect(struck.player.moonlightZetsu).toBe(true)
  })

  it('pays an aura clause to both signatories and a loan clause to the recipient only', () => {
    const aura = rewardMoonlightParty(duel(), signed('bare-hands').moonlight!.active!)
    expect(aura.player.aura).toBe(50)
    expect(aura.opponent.aura).toBe(50)
    expect(aura.opponent.moonlightLoan).toBeUndefined()
    const capped = duel()
    capped.player.aura = 90
    expect(rewardMoonlightParty(capped, signed('long-truce').moonlight!.active!).player.aura).toBe(
      100,
    )
    const loan = rewardMoonlightParty(duel(), signed('truce').moonlight!.active!)
    expect(loan.opponent.moonlightLoan).toBe(1)
    expect(loan.player.moonlightLoan).toBeUndefined()
    expect(loan.player.aura).toBe(30)
  })

  it('fulfils the long truce in the engine and closes it with the disclosed outcome', () => {
    let state = signed('long-truce')
    for (let frame = 0; frame < moonlightClause('long-truce').durationFrames; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    expect(state.moonlight?.outcome?.kind).toBe('fulfilled')
    expect(state.player.aura).toBeGreaterThanOrEqual(65)
    expect(state.opponent.aura).toBeGreaterThanOrEqual(65)
  })

  it('keeps the AI fighting with plain strikes under bare hands, and never breaching', () => {
    let state = signed('bare-hands', duel('versus-ai'))
    expect(moonlightAiWaiting(state)).toBe(false)
    let struck = false
    for (let frame = 0; frame < 240 && state.moonlight?.active; frame++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
      if (state.opponent.attack) struck = true
      expect(state.opponent.attack?.kind ?? 'light').toMatch(/^(light|heavy)$/)
      expect(state.opponent.moonlightZetsu).toBeUndefined()
    }
    expect(struck).toBe(true)
    expect(moonlightAiWaiting(signed('truce', duel('versus-ai')))).toBe(true)
  })

  it('carries the chosen contract over the network and rejects one outside the catalogue', () => {
    const packet = (command: unknown) => ({ sequence: 0, input: 0, commands: [command] })
    const chosen = { kind: 'offer', clause: 'bare-hands' }
    expect(parsePvpPacket(packet(chosen))).toEqual(packet(chosen))
    expect(parsePvpPacket(packet({ kind: 'offer', clause: 'forced-signature' }))).toBeNull()
    expect(parsePvpPacket(packet({ kind: 'offer', clause: 'truce', hidden: 'x' }))).toBeNull()
    const offered = applyPvpCommand(duel(), 'player', { kind: 'offer', clause: 'long-truce' })
    expect(offered.moonlight?.offer?.clause).toBe('long-truce')
  })

  it('lists every contract with its full clauses before anyone offers', () => {
    const body = html(duel())
    for (const text of [
      'Trêve mutuelle',
      'Duel à mains nues',
      'Longue trêve',
      '5 secondes de combat',
      '8 secondes de combat',
      '10 secondes de combat',
      'Chaque signataire récupère 20 d’aura',
      'Chaque signataire récupère 35 d’aura',
    ])
      expect(body).toContain(text)
    expect(body.match(/data-moonlight-clause=/g)).toHaveLength(3)
  })

  it('shows the recipient exactly the offered contract next to the signature', () => {
    const offered = offerMoonlightContract({ state: duel(), side: 'player', clause: 'bare-hands' })
    const body = html(offered)
    expect(body).toContain('data-moonlight-clause="bare-hands"')
    expect(body.match(/data-moonlight-clause=/g)).toHaveLength(1)
    expect(body).toContain('Coups physiques sans aura chargée seulement')
    expect(body).toContain('Signer librement')
  })
})
