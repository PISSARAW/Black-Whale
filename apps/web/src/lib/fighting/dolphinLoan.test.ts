import { dolphinLoanAi } from './dolphinAi'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight, nextRound } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { performArsenalCommand, validArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { toggleEmperorTime, advanceEmperorClock } from './kurapikaActions'
import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from './types'
import { EMPEROR_BLACKOUT_THRESHOLD, EMPEROR_BLACKOUT_FRAMES } from './kurapika'

function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function syringe(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function loaded(source: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight('kurapika', source, { mode: 'versus-local', formatId: 'knockout' }),
  )
  const drained = frames(
    syringe({
      ...base,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: { ...base.opponent, x: 49, aura: 100 },
    }),
    220,
  )
  return syringe(toggleEmperorTime(drained, 'player'))
}
function lend(state: FightState): FightState {
  return performArsenalCommand(state, 'player', {
    action: 'dolphin-lend',
    target: 'body:opponent:0',
  })
}
function use(state: FightState, side: FightSide = 'opponent'): FightState {
  return performArsenalAction(
    { state, side, command: { action: 'dolphin-use' } },
    performAuraAttack,
  )
}
describe('a real Stealth Dolphin recipient', () => {
  it('injects an actual body, frees Steal Chain and keeps the lender under Emperor Time', () => {
    const before = loaded()
    const loaned = lend(before)
    expect(loaned.opponent.dolphinLoan?.lender).toEqual({ owner: 'player', member: 0 })
    expect(loaned.player.kurapika!.held).toBeNull()
    expect(loaned.player.kurapika!.dolphinLoans).toEqual([{ owner: 'opponent', member: 0 }])
    expect(loaned.opponent.kurapika).toBeUndefined()
    expect(toggleEmperorTime(loaned, 'player')).toBe(loaned)
    const elapsed = advanceEmperorClock(loaned)
    expect(elapsed.player.kurapika!.lifespanFrames).toBe(loaned.player.kurapika!.lifespanFrames + 1)
  })
  it('requires contact and rejects fictitious reserved bodies', () => {
    const state = loaded()
    expect(
      performArsenalCommand(state, 'player', { action: 'dolphin-lend', target: 'body:opponent:2' }),
    ).toBe(state)
    const far = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(lend(far)).toBe(far)
  })
  it('executes from the recipient position using donor aura despite personal exhaustion', () => {
    const loaned = lend(loaded())
    const ownAura = loaned.opponent.aura
    const stock = loaned.opponent.dolphinLoan!.held.auraSupply!.amount
    const used = use(loaned)
    expect(used.opponent.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used.opponent.aura).toBe(ownAura)
    expect(used.opponent.dolphinLoan!.held.used).toBe(true)
    expect(used.opponent.dolphinLoan!.held.auraSupply!.amount).toBeLessThan(stock)
    expect(used.opponent.id).toBe('hisoka')
    expect(used.opponent.kurapika).toBeUndefined()
    expect(used.opponent.dolphinExecution).toBeUndefined()
    expect(used.opponent.dolphinLoanChannel).toBeUndefined()
    expect(frames(used, 60).bungeeGum?.owner).toBe('opponent')
  })
  it('lets the recipient explicitly end the single use and returns the donor’s own ability', () => {
    const running = frames(use(lend(loaded())), 60)
    running.opponent.dolphinLoan!.held.auraSupply!.amount = 0
    const ended = use(running)
    expect(ended.opponent.dolphinLoan).toBeUndefined()
    expect(ended.opponent.stolenChainAbility).toBeUndefined()
    expect(ended.player.kurapika!.dolphinLoans).toBeUndefined()
    expect(ended.bungeeGum).toBeNull()
    const conscious = frames(ended, 100)
    expect(toggleEmperorTime(conscious, 'player').player.kurapika!.emperorTime).toBe(false)
  })
  it('keeps an already active borrowed effect during the linked blackout', () => {
    const running = frames(use(lend(loaded())), 60)
    running.player.kurapika!.continuousFrames = EMPEROR_BLACKOUT_THRESHOLD - 1
    const asleep = frames(advanceEmperorClock(running), 20)
    expect(asleep.opponent.dolphinLoan!.blackoutFrames).toBeGreaterThan(0)
    expect(asleep.bungeeGum?.owner).toBe('opponent')
    expect(use(asleep)).toBe(asleep)
    expect(asleep.player.kurapika!.emperorTime).toBe(true)
  })
  it('links the actual blackout without allowing a new command from the recipient', () => {
    const loaned = lend(loaded())
    loaned.player.kurapika!.continuousFrames = EMPEROR_BLACKOUT_THRESHOLD - 1
    const fainted = advanceEmperorClock(loaned)
    expect(fainted.opponent.dolphinLoan!.blackoutFrames).toBe(EMPEROR_BLACKOUT_FRAMES)
    expect(use(fainted)).toBe(fainted)
    const after = advanceEmperorClock(fainted)
    expect(after.player.kurapika!.lifespanFrames).toBe(fainted.player.kurapika!.lifespanFrames + 1)
    expect(after.opponent.dolphinLoan!.held).toEqual(fainted.opponent.dolphinLoan!.held)
  })
  it('exposes and executes Cookie through a loan without granting a permanent personal Hatsu', () => {
    const loaned = lend(loaded('biscuit'))
    expect(performArsenalCommand(loaned, 'opponent', { action: 'cookie-massage' })).toBe(loaned)
    const choice = arsenalOptions(loaned, 'opponent').find(
      (option) =>
        option.command.loan &&
        option.command.action === 'cookie-massage' &&
        option.command.target === 'opponent',
    )
    expect(choice?.ready).toBe(true)
    const treated = performArsenalCommand(loaned, 'opponent', choice!.command)
    expect(treated.opponent.cookie?.loan).toBe(true)
    expect(treated.opponent.dolphinLoan!.held.used).toBe(true)
    expect(treated.opponent.aura).toBe(loaned.opponent.aura)
    expect(treated.opponent.kurapika).toBeUndefined()
    expect(frames(treated, 5).opponent.cookie).toBeDefined()
  })
  it('retains an unused equipped loan, its finite stock and its Emperor Time lock between rounds', () => {
    const loaned = lend(loaded())
    const round = nextRound({
      ...loaned,
      phase: 'finished',
      winner: 'player',
      roundsWon: { player: 1, opponent: 0 },
      matchWinner: null,
    })
    expect(round.opponent.dolphinLoan).toEqual(loaned.opponent.dolphinLoan)
    expect(round.player.kurapika!.dolphinLoans).toEqual(loaned.player.kurapika!.dolphinLoans)
    expect(round.player.kurapika!.emperorTime).toBe(true)
    expect(round.opponent.stolenChainAbility).toEqual(loaned.opponent.stolenChainAbility)
  })
  it('lets the recipient AI use its actual loan through the same admission path', () => {
    const loaned = lend(loaded())
    const used = dolphinLoanAi(loaned, performAuraAttack)
    expect(used?.opponent.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used?.opponent.kurapika).toBeUndefined()
    expect(used?.opponent.dolphinLoan?.held.used).toBe(true)
  })
  it('validates the explicit borrowed utility selector', () => {
    expect(validArsenalCommand({ action: 'gum-catch', loan: true })).toBe(true)
    expect(validArsenalCommand({ action: 'gum-catch', loan: 'yes' })).toBe(false)
  })
})
