import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { arsenalOptions } from './retrospectiveArsenal'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { dolphinIsBusy } from './kurapikaDolphin'
import { equippedDolphin } from './dolphinBorrowing'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { EMPTY_INPUT, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function setup(): FightState {
  const state = beginFight(
    createFight('chrollo', 'kurapika', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        needleStock: { player: false },
        preparation: { mode: 'scenario', resources: ['documents'], cohorts: [] },
      },
    }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      x: 26,
      aura: 100,
      chrolloBook: { pages: ['illumi:backSpecial'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: 'opponent', member: 0 },
        held: {
          source: 'illumi',
          moveId: 'illumi:backSpecial',
          victim: 'opponent',
          theftId: 'illumi-face-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('illumi', 'theta').player), amount: 60 },
        },
      },
    },
    opponent: {
      ...state.opponent,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: 'player', member: 0 }],
      },
    },
  }
}
function command(state: FightState, command: ArsenalCommand): FightState {
  return performArsenalAction({ state, side: 'player', command }, performAuraAttack)
}
function frames(state: FightState, count = 35): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('the selected disguise uses its actual acquisition and actual body', () => {
  it('executes an unpinned copy without conjuring needles and ends it on closing its page', () => {
    let state = command(setup(), { action: 'illumi-face-mode', target: 'unpinned-hisoka' })
    state = frames(command(state, { action: 'copied-move', target: 'illumi:backSpecial' }))
    expect(state.player.illumi).toMatchObject({
      disguised: true,
      disguiseMode: 'unpinned-hisoka',
      disguiseOrigin: { source: 'book' },
    })
    expect(state.player.equipment?.includes('needles')).not.toBe(true)
    const closed = reconcileChrolloPages(
      state,
      {
        ...state,
        player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
      },
      'player',
    )
    expect(closed.player.illumi?.disguised).toBe(false)
    expect(closed.player.dolphinLoan?.held.used).toBe(false)
  })
  it('keeps a finite borrowed disguise and Emperor Time active through preparation and until explicit dismissal', () => {
    const base = setup()
    let state: FightState = {
      ...base,
      player: { ...base.player, id: 'theta', aura: 0, auraExhausted: true, chrolloBook: undefined },
    }
    state = command(state, { action: 'illumi-face-mode', target: 'unpinned-hisoka', loan: true })
    expect(state.player.illumiDisguisePlan).toBe('unpinned-hisoka')
    state = command(state, { action: 'dolphin-move', target: 'illumi:backSpecial' })
    expect(state.player.illumi?.preparation).toBe(30)
    expect(state.player.aura).toBe(0)
    expect(equippedDolphin(state.player)?.auraSupply?.amount).toBe(40)
    expect(dolphinIsBusy(state, 'player', equippedDolphin(state.player)!)).toBe(true)
    state = frames(state)
    expect(state.player.illumi).toMatchObject({
      disguised: true,
      disguiseOrigin: { source: 'dolphin', theftId: 'illumi-face-loan' },
    })
    expect(state.player.id).toBe('theta')
    expect(state.opponent.kurapika?.emperorTime).toBe(true)
    const ended = command(state, { action: 'dolphin-use' })
    expect(ended.player.illumi?.disguised).toBe(false)
    expect(ended.player.id).toBe('theta')
    const attempted = command(ended, { action: 'dolphin-move', target: 'illumi:backSpecial' })
    expect(attempted.player.illumi?.preparation).toBe(0)
    expect(attempted.player.illumi?.disguised).toBe(false)
  })
  it('does not spend a loan to remove the book’s independent physical disguise', () => {
    let state = command(setup(), { action: 'illumi-face-mode', target: 'unpinned-hisoka' })
    state = frames(command(state, { action: 'copied-move', target: 'illumi:backSpecial' }))
    const original = state.player.illumi
    const attempted = command(state, { action: 'dolphin-use' })
    expect(attempted.player.illumi).toEqual(original)
    expect(attempted.player.dolphinLoan?.held.used).toBe(false)
    expect(attempted.player.dolphinLoan?.held.auraSupply?.amount).toBe(60)
  })
  it('requires a real available hand even when the selected technique needs no needles', () => {
    let state = command(setup(), { action: 'document-take', target: 'player:scenario-document' })
    expect(
      state.battlefield!.entities.find((entry) => entry.id === 'player:scenario-document')!
        .document!.holder?.hand,
    ).toBe('left')
    state = command(state, { action: 'illumi-face-mode', target: 'unpinned-hisoka' })
    expect(
      arsenalOptions(state, 'player').find(
        (option) =>
          option.command.action === 'copied-move' && option.command.target === 'illumi:backSpecial',
      )?.ready,
    ).toBe(false)
    expect(command(state, { action: 'copied-move', target: 'illumi:backSpecial' })).toBe(state)
  })
})
