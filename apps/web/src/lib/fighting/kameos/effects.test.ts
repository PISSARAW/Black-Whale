import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from '../engine'
import { hatsuFor } from '../hatsu'
import { EMPTY_INPUT } from '../types'
import type { ArcadeFighter, FightState } from '../types'
import { KAMEO_CATALOGUE, KAMEO_IDS } from './catalogue'
import { advanceKameoTraps, deliverKameoEffect } from './effects'
import { withKameos } from './state'
import type { KameoId, KameoSlot } from './types'

interface CanonAbility {
  id: string
  ownerId: string
  firstVisibleChapterId: string
}
const ABILITIES: CanonAbility[] = JSON.parse(
  readFileSync(new URL('../../../../../../data/abilities/abilities.json', import.meta.url), 'utf8'),
)

const slotOf = (state: FightState) => state.kameos?.player as KameoSlot

/** Kurapika (wounded) with an acting kameo at x 46, Hisoka at x 52. */
function acting(id: KameoId, opponent: Partial<ArcadeFighter> = {}): FightState {
  const base = beginFight(withKameos(createFight('kurapika', 'hisoka'), { player: id }))
  const slot = slotOf(base)
  return {
    ...base,
    player: { ...base.player, x: 30, health: base.player.maxHealth - 20 },
    opponent: { ...base.opponent, x: 52, ...opponent },
    kameos: { player: { ...slot, phase: 'acting', fighter: { ...slot.fighter, x: 46 } } },
  }
}

describe('kameo catalogue (lot 4)', () => {
  it('holds the six support kameos, one per role', () => {
    expect(KAMEO_IDS).toEqual(['tubeppa', 'marayam', 'zhanglei', 'morena', 'luzurus', 'salesale'])
    expect(new Set(KAMEO_IDS.map((id) => KAMEO_CATALOGUE[id].role)).size).toBe(6)
  })

  it('points every kameo at its own canon ability and first chapter', () => {
    for (const id of KAMEO_IDS) {
      const definition = KAMEO_CATALOGUE[id]
      const canon = ABILITIES.find((ability) => ability.id === definition.abilityId)
      expect(canon, id).toBeDefined()
      expect(canon!.ownerId.endsWith(id) || canon!.ownerId.startsWith(id)).toBe(true)
      expect(definition.chapterId).toBe(canon!.firstVisibleChapterId)
      expect(hatsuFor(id).id).toBe(id)
    }
  })
})

describe('kameo support effects (lot 4)', () => {
  it('heals and strengthens the leader with Tubeppa, paid from the kameo aura', () => {
    const state = acting('tubeppa')
    const next = deliverKameoEffect(state, 'player')
    expect(next.player.health).toBe(state.player.health + 8)
    expect(next.player.hatsuEffects.synthesisFrames).toBe(240)
    expect(slotOf(next).fighter.aura).toBe(slotOf(state).fighter.aura - 20)
    expect(slotOf(next).fighter.hatsuEffects.synthesisFrames).toBe(0)
  })

  it('isolates the leader with Marayam and adds a guardian coin with Zhang Lei', () => {
    expect(
      deliverKameoEffect(acting('marayam'), 'player').player.hatsuEffects.isolationFrames,
    ).toBe(240)
    expect(deliverKameoEffect(acting('zhanglei'), 'player').player.hatsuEffects.coinCharges).toBe(1)
  })

  it('does nothing off stage or without enough aura', () => {
    const reserve = acting('tubeppa')
    const resting = { ...reserve, kameos: { player: { ...slotOf(reserve), phase: 'reserve' } } }
    expect(deliverKameoEffect(resting as FightState, 'player')).toBe(resting)
    const tired = {
      ...reserve,
      kameos: { player: { ...slotOf(reserve), fighter: { ...slotOf(reserve).fighter, aura: 5 } } },
    }
    expect(deliverKameoEffect(tired, 'player')).toBe(tired)
  })

  it('infects the opposing leader with Morena only within reach', () => {
    const near = deliverKameoEffect(acting('morena'), 'player')
    expect(near.opponent.hatsuEffects.contagionStacks).toBe(1)
    expect(near.opponent.aura).toBeLessThan(acting('morena').opponent.aura)
    const far = deliverKameoEffect(acting('morena', { x: 70 }), 'player')
    expect(far.opponent.hatsuEffects.contagionStacks).toBe(0)
    expect(slotOf(far).fighter.aura).toBe(slotOf(acting('morena')).fighter.aura - 20)
  })

  it('spreads Salé-salé smoke over a wider zone', () => {
    const next = deliverKameoEffect(acting('salesale', { x: 60 }), 'player')
    expect(next.opponent.hatsuEffects.smokeFrames).toBe(180)
  })

  it('spends an isolation instead of landing the effect', () => {
    const shielded = acting('salesale', {
      hatsuEffects: { ...acting('salesale').opponent.hatsuEffects, isolationFrames: 100 },
    })
    const next = deliverKameoEffect(shielded, 'player')
    expect(next.opponent.hatsuEffects.isolationFrames).toBe(0)
    expect(next.opponent.hatsuEffects.smokeFrames).toBe(0)
  })

  it('leaves a Luzurus trap that waits, springs once on contact, then disappears', () => {
    const laid = deliverKameoEffect(acting('luzurus', { x: 80 }), 'player')
    expect(slotOf(laid).trap).toEqual({ x: 46, remainingFrames: 300 })
    const waiting = advanceKameoTraps(laid)
    expect(slotOf(waiting).trap?.remainingFrames).toBe(299)
    expect(waiting.opponent.hatsuEffects.desireFrames).toBe(0)
    const stepped = advanceKameoTraps({ ...waiting, opponent: { ...waiting.opponent, x: 48 } })
    expect(stepped.opponent.hatsuEffects.desireFrames).toBe(90)
    expect(slotOf(stepped).trap).toBeUndefined()
    const airborne = advanceKameoTraps({
      ...waiting,
      opponent: { ...waiting.opponent, x: 48, y: 4 },
    })
    expect(airborne.opponent.hatsuEffects.desireFrames).toBe(0)
  })

  it('lets a trap expire unsprung', () => {
    const laid = deliverKameoEffect(acting('luzurus', { x: 80 }), 'player')
    const old = {
      ...laid,
      kameos: { player: { ...slotOf(laid), trap: { x: 46, remainingFrames: 1 } } },
    }
    expect(slotOf(advanceKameoTraps(old)).trap).toBeUndefined()
  })

  it('advances a delivered effect once per frame through the ordinary engine', () => {
    const healed = deliverKameoEffect(acting('tubeppa'), 'player')
    let state = healed
    for (let frame = 0; frame < 10; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.frame - healed.frame).toBe(10)
    expect(state.player.hatsuEffects.synthesisFrames).toBe(230)
  })
})
