import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performCookie, COOKIE_SUMMON_COST } from './cookie'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinArsenalOptions } from './dolphinArsenal'
import { stolenAuraActor, restoreStolenAura } from './dolphinSupply'
import { abilityCategoryEfficiency, fightCategoryEfficiency } from './nenCategories'
import { moveForSlot } from './movesets'
import { applyAuraContext } from './nen'
import { voluntaryNenAvailable } from './nenAccess'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function ready(aura = 50, source: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight('kurapika', source, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...base,
    player: { ...base.player, x: 44, aura: 100 },
    opponent: { ...base.opponent, x: 49, aura },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function stealing(aura = 50, source: FighterId = 'hisoka'): FightState {
  return performAuraAttack({
    state: ready(aura, source),
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
describe('Steal Chain keeps the actual stolen aura and suppresses the linked victim', () => {
  it('prevents voluntary Nen immediately after real syringe contact, before the reserve is empty', () => {
    const contact = frames(stealing(), 20)
    expect(contact.opponent.drainingChain).toBeDefined()
    expect(contact.opponent.aura).toBeGreaterThan(0)
    expect(contact.opponent.nen.mode).toBe('zetsu')
    expect(voluntaryNenAvailable(contact.opponent, { allowVoluntaryZetsu: true })).toBe(false)
    expect(applyAuraContext(contact.opponent, { ...EMPTY_INPUT, aura: true }).nen.mode).toBe(
      'zetsu',
    )
    expect(
      performAuraAttack({
        state: contact,
        side: 'opponent',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(contact)
    const escaped = frames({ ...contact, opponent: { ...contact.opponent, x: 90 } }, 12)
    expect(escaped.opponent.drainingChain).toBeUndefined()
    expect(escaped.opponent.aura).toBeGreaterThan(0)
    expect(applyAuraContext(escaped.opponent, EMPTY_INPUT).nen.mode).toBe('ten')
  })
  it('keeps an attached syringe draining when an ordinary jab stuns its living Nen user', () => {
    const contact = frames(stealing(100), 60)
    let counter = performAuraAttack({
      state: contact,
      side: 'opponent',
      kind: 'light',
      moveId: 'hisoka:standingLight',
      auraCharged: false,
    })
    for (let index = 0; index < 12 && counter.player.hitStun === 0; index++)
      counter = frames(counter, 1)
    expect(counter.player.health).toBeLessThan(contact.player.health)
    expect(counter.player.hitStun).toBeGreaterThan(0)
    expect(counter.opponent.drainingChain?.owner).toBe('player')
    expect(counter.opponent.aura).toBeLessThan(contact.opponent.aura)
  })
  it('records the donor’s category quality and exactly the aura removed by the completed drain', () => {
    const contact = frames(stealing(), 30)
    const partial = contact.opponent.drainingChain!.supply!
    expect(partial.originalOwner).toBe('hisoka')
    expect(partial.amount).toBeGreaterThan(0)
    expect(partial.efficiencies.transmuter).toBe(1)
    expect(partial.efficiencies.emitter).toBeLessThan(1)
    const stored = frames(contact, 100).player.kurapika!.held!
    expect(stored.auraSupply?.amount).toBeCloseTo(partial.amount + contact.opponent.aura, 10)
    expect(stored.auraSupply?.efficiencies).toEqual(partial.efficiencies)
    expect(stored.victimMember).toBe(0)
    expect(stored.auraSupply?.originalOwner).toBe('hisoka')
  })
})

function loadedDolphin(source: FighterId = 'hisoka'): FightState {
  const stolen = frames(stealing(50, source), 140)
  const rested = { ...stolen, player: { ...stolen.player, attack: null, aura: 87 } }
  const active = toggleEmperorTime(rested, 'player')
  return performAuraAttack({
    state: active,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function useDolphin(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
describe('Dolphin spends a finite donor reserve independently from the carrier', () => {
  it('pays the actual borrowed activation from stolen aura and restores the real body', () => {
    const loaded = loadedDolphin()
    const used = useDolphin(loaded)
    expect(used.player.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used.player.aura).toBe(87)
    expect(used.player.kurapika!.held!.auraSupply!.amount).toBe(
      loaded.player.kurapika!.held!.auraSupply!.amount -
        moveForSlot('hisoka', 'neutralSpecial')!.auraCost,
    )
    expect(used.player.dolphinExecution).toBeUndefined()
    expect(used.player.id).toBe('kurapika')
  })
  it('also pays the real Cookie support command from the donor stock', () => {
    const loaded = loadedDolphin('biscuit')
    const treated = performCookie(loaded, 'player', { action: 'cookie-massage', target: 'player' })
    expect(treated.player.cookie).toBeDefined()
    expect(treated.player.aura).toBe(loaded.player.aura)
    expect(treated.player.kurapika!.held!.auraSupply!.amount).toBe(
      loaded.player.kurapika!.held!.auraSupply!.amount - COOKIE_SUMMON_COST,
    )
    expect(treated.player.dolphinExecution).toBeUndefined()
  })
  it('rejects a cast when stolen aura is insufficient despite a full personal reserve', () => {
    const loaded = loadedDolphin()
    loaded.player.aura = 100
    loaded.player.kurapika!.held!.auraSupply!.amount = 1
    expect(dolphinArsenalOptions(loaded, 'player').every((option) => !option.ready)).toBe(true)
    expect(useDolphin(loaded)).toBe(loaded)
    expect(loaded.player.kurapika!.held!.used).toBe(false)
  })
  it('does not regenerate stored stolen aura while the carrier rests', () => {
    const loaded = loadedDolphin()
    const waiting = frames(loaded, 120)
    expect(waiting.player.kurapika!.held!.auraSupply!.amount).toBe(
      loaded.player.kurapika!.held!.auraSupply!.amount,
    )
    expect(waiting.player.aura).toBeGreaterThan(loaded.player.aura)
  })
  it('preserves donor efficiency without giving the carrier that affinity or extra Emperor Time', () => {
    const loaded = loadedDolphin()
    const actor = stolenAuraActor(loaded.player)
    expect(abilityCategoryEfficiency(actor, 'emitter')).toBeLessThan(1)
    expect(fightCategoryEfficiency(actor, 'emitter')).toBe(1)
    const restored = restoreStolenAura(loaded.player, { ...actor, aura: actor.aura - 3 })
    expect(restored.aura).toBe(loaded.player.aura)
    expect(restored.kurapika!.held!.auraSupply!.amount).toBe(actor.aura - 3)
    expect(restored.dolphinExecution).toBeUndefined()
  })
})
