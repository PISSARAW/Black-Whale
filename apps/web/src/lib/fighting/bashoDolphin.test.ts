import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import { toggleEmperorTime } from './kurapikaActions'
import { composeBashoPoem } from './bashoAction'
import { BASHO_ATTESTED_POEMS, BASHO_WRITING_COST } from './bashoPoem'
import { loanedBashoCanWrite } from './bashoDolphin'
import { applyPvpCommand } from './pvp/commands'
import { parsePvpPacket } from './pvp/protocol'
import { EMPTY_INPUT, type FightState } from './types'

function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
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
function loan(): FightState {
  const base = beginFight(
    createFight('kurapika', 'basho', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const stolen = frames(
    syringe({
      ...base,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: { ...base.opponent, x: 49, aura: 100 },
    }),
    220,
  )
  const equipped = syringe(toggleEmperorTime(stolen, 'player'))
  return performArsenalCommand(equipped, 'player', {
    action: 'dolphin-lend',
    target: 'body:opponent:0',
  })
}
function write(state: FightState): FightState {
  return composeBashoPoem(
    { state, side: 'opponent', text: BASHO_ATTESTED_POEMS['ignite-punched-target'].fr, loan: true },
    performAuraAttack,
  )
}
describe('Great Haiku through an actual Stealth Dolphin loan', () => {
  it('writes on the recipient’s real supplies with donor aura and no personal Emperor Time', () => {
    const before = loan()
    expect(loanedBashoCanWrite(before, 'opponent')).toBe(true)
    const writing = write(before)
    expect(writing.opponent.bashoPoem?.loan).toBe(true)
    expect(writing.opponent.writingKit!.sheets).toBe(before.opponent.writingKit!.sheets - 1)
    expect(writing.opponent.aura).toBe(before.opponent.aura)
    expect(writing.opponent.dolphinLoan!.held.auraSupply!.amount).toBe(
      before.opponent.dolphinLoan!.held.auraSupply!.amount - BASHO_WRITING_COST,
    )
    expect(writing.opponent.kurapika).toBeUndefined()
    const completed = frames(writing, 60)
    expect(completed.opponent.bashoPoem?.ready).toBe(true)
    expect(loanedBashoCanWrite(completed, 'opponent')).toBe(false)
    expect(write(completed)).toBe(completed)
  })
  it('refuses writing without the actual brush, ink and paper and keeps the unused loan', () => {
    const supplied = loan()
    const empty = performArsenalCommand(supplied, 'opponent', { action: 'writing-drop' })
    expect(empty.opponent.writingKit).toBeUndefined()
    expect(loanedBashoCanWrite(empty, 'opponent')).toBe(false)
    expect(write(empty)).toBe(empty)
    expect(empty.opponent.dolphinLoan!.held.used).toBe(false)
  })
  it('sets fire only after a real ordinary fist contact from the recipient', () => {
    let state = frames(write(loan()), 60)
    state = { ...state, player: { ...state.player, x: 45 }, opponent: { ...state.opponent, x: 49 } }
    const punched = performAuraAttack({
      state,
      side: 'opponent',
      kind: 'light',
      moveId: 'basho:standingLight',
      auraCharged: false,
    })
    expect(punched.opponent.attack).not.toBeNull()
    expect(frames(punched, 12).player.bashoBurn?.owner).toBe('opponent')
  })
  it('ends the borrowed paper effect without refunding real supplies', () => {
    const running = frames(write(loan()), 60)
    const ended = performArsenalAction(
      { state: running, side: 'opponent', command: { action: 'dolphin-use' } },
      performAuraAttack,
    )
    expect(ended.opponent.bashoPoem).toBeUndefined()
    expect(ended.opponent.dolphinLoan).toBeUndefined()
    expect(ended.opponent.writingKit!.sheets).toBe(2)
    expect(ended.opponent.stolenChainAbility).toBeUndefined()
    expect(ended.player.kurapika!.dolphinLoans).toBeUndefined()
  })
  it('maintains and ends a real ward made by the borrowed winter poem', () => {
    const writing = applyPvpCommand(loan(), 'opponent', {
      kind: 'poem',
      loan: true,
      text: BASHO_ATTESTED_POEMS['ward-weak-spirits'].fr,
    })
    const ready = frames(writing, 60)
    const warded = performArsenalCommand(ready, 'opponent', {
      action: 'basho-ward',
      target: 'opponent',
      loan: true,
    })
    expect(warded.opponent.bashoWard?.loan).toBe(true)
    expect(frames(warded, 10).opponent.bashoWard!.remainingFrames).toBeGreaterThan(0)
    const ended = performArsenalAction(
      { state: warded, side: 'opponent', command: { action: 'dolphin-use' } },
      performAuraAttack,
    )
    expect(ended.opponent.bashoWard!.remainingFrames).toBe(0)
    expect(ended.opponent.dolphinLoan).toBeUndefined()
  })
  it('uses the real speaker and the actual lie condition, without a Kurapika execution alias', () => {
    const writing = applyPvpCommand(loan(), 'opponent', {
      kind: 'poem',
      loan: true,
      text: BASHO_ATTESTED_POEMS['ignite-liar'].fr,
    })
    const question = performArsenalCommand(frames(writing, 60), 'opponent', {
      action: 'basho-ask',
      target: 'identity',
      loan: true,
    })
    expect(question.player.heardWords?.speaker).toBe('basho')
    expect(question.player.bashoPrompt?.asker).toBe('opponent')
    const lied = performArsenalCommand(question, 'player', {
      action: 'basho-answer',
      target: 'lie',
    })
    expect(lied.player.health).toBe(0)
    expect(lied.winner).toBe('opponent')
    const asleep = {
      ...question,
      opponent: {
        ...question.opponent,
        dolphinLoan: { ...question.opponent.dolphinLoan!, blackoutFrames: 100 },
      },
    }
    expect(
      performArsenalCommand(asleep, 'opponent', { action: 'basho-ask', target: 'nen', loan: true }),
    ).toBe(asleep)
  })
  it('routes the explicit loan through the typed P2 poem command and rejects malformed selectors', () => {
    const command = {
      kind: 'poem' as const,
      text: BASHO_ATTESTED_POEMS['ward-weak-spirits'].fr,
      loan: true,
    }
    expect(parsePvpPacket({ sequence: 0, input: 0, commands: [command] })).not.toBeNull()
    expect(
      parsePvpPacket({ sequence: 0, input: 0, commands: [{ ...command, loan: 'yes' }] }),
    ).toBeNull()
    const writing = applyPvpCommand(loan(), 'opponent', command)
    expect(writing.opponent.bashoPoem?.effect).toBe('ward-weak-spirits')
    expect(writing.opponent.bashoPoem?.loan).toBe(true)
  })
})
