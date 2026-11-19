import { describe, expect, it } from 'vitest'
import { corpseLoanSetup, bookCorpseSetup, corpseEntry, corpseSetup } from './illumiCorpseTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { equippedDolphin } from './dolphinBorrowing'
import { dolphinIsBusy } from './kurapikaDolphin'
import { expireHistoricalMatter } from './historicalMatterClock'
import { privatePvpState } from './pvp/view'
import { createKurapika } from './kurapika'
import { arsenalOptions } from './retrospectiveArsenal'
import type { FightState } from './types'

const command = { action: 'illumi-corpse' as const, target: 'player:corpse', loan: true }
describe('corpse control through one finite Dolphin use', () => {
  it('uses only donor aura, stays busy during actual implantation and control, and dismisses without deleting the pins', () => {
    const base = corpseLoanSetup(30)
    expect(
      arsenalOptions(base, 'player').find(
        (option) =>
          option.command.action === command.action &&
          option.command.target === command.target &&
          option.command.loan,
      )?.ready,
    ).toBe(true)
    const started = needleCommand(base, command)
    expect(started.player.corpsePreparation?.origin).toMatchObject({
      source: 'dolphin',
      theftId: 'corpse-loan',
    })
    expect(equippedDolphin(started.player)).toMatchObject({
      used: true,
      sustainedKeys: ['corpse-control'],
      auraSupply: { amount: 0 },
    })
    expect(dolphinIsBusy(started, 'player', equippedDolphin(started.player)!)).toBe(true)
    const active = mapFrames(started, 60)
    const pins = corpseEntry(active).corpseNeedles!
    expect(corpseEntry(active).corpseControl?.origin).toEqual(
      started.player.corpsePreparation?.origin,
    )
    expect(started.player.aura).toBe(0)
    expect(equippedDolphin(active.player)?.auraSupply).toMatchObject({ amount: 0, committed: 30 })
    expect(corpseEntry(active).controller?.side).toBe('player')
    const ordered = needleCommand(active, {
      action: 'illumi-corpse-order',
      target: 'player:corpse|retreat',
      loan: true,
    })
    expect(corpseEntry(ordered).corpseOrder).toBe('retreat')
    expect(
      needleCommand(ordered, { action: 'illumi-corpse', target: 'opponent:corpse', loan: true }),
    ).toBe(ordered)
    expect(
      privatePvpState(active, 'opponent').battlefield!.entities.find(
        (entry) => entry.id === command.target,
      )?.corpseControl?.origin,
    ).toBeUndefined()
    const dismissed = needleCommand(active, { action: 'dolphin-use' })
    expect(corpseEntry(dismissed).controller).toBeUndefined()
    expect(corpseEntry(dismissed).corpseNeedles).toEqual(pins)
    expect(dolphinIsBusy(dismissed, 'player', equippedDolphin(active.player)!)).toBe(false)
  })
  it('does not replace missing donor funds with a full personal reserve', () => {
    const base = corpseLoanSetup(29)
    const rich = { ...base, player: { ...base.player, aura: 100, auraExhausted: false } }
    expect(needleCommand(rich, command)).toBe(rich)
    expect(equippedDolphin(rich.player)?.used).toBe(false)
  })
  it('consumes an interrupted use once and never manufactures its unimplanted metal', () => {
    const started = needleCommand(corpseLoanSetup(), command)
    const cancelled = expireHistoricalMatter({
      ...started,
      hitstop: 10,
      player: { ...started.player, hitStun: 5 },
    })
    expect(cancelled.player.corpsePreparation).toBeUndefined()
    expect(corpseEntry(cancelled).corpseNeedles).toBeUndefined()
    expect(equippedDolphin(cancelled.player)?.used).toBe(true)
    expect(dolphinIsBusy(cancelled, 'player', equippedDolphin(cancelled.player)!)).toBe(false)
  })
  it('cuts borrowed control when its lender stops Emperor Time, even during hitstop', () => {
    const active = mapFrames(needleCommand(corpseLoanSetup(), command), 60)
    const stopped = expireHistoricalMatter({
      ...active,
      hitstop: 10,
      opponent: {
        ...active.opponent,
        kurapika: { ...active.opponent.kurapika!, emperorTime: false },
      },
    })
    expect(corpseEntry(stopped).controller).toBeUndefined()
    expect(corpseEntry(stopped).corpseNeedles).toEqual(corpseEntry(active).corpseNeedles)
  })
  it('keeps a book activation and a borrowed activation independent on the same body', () => {
    const book = bookCorpseSetup(),
      loan = corpseLoanSetup()
    let state: FightState = {
      ...loan,
      player: { ...book.player, dolphinLoan: loan.player.dolphinLoan },
    }
    state = mapFrames(needleCommand(state, { ...command, loan: undefined }), 60)
    expect(corpseEntry(state).corpseControl?.origin?.source).toBe('book')
    expect(equippedDolphin(state.player)?.used).toBe(false)
    state = { ...state, player: { ...state.player, x: 72 }, opponent: { ...state.opponent, x: 92 } }
    state = mapFrames(needleCommand(state, { ...command, target: 'opponent:corpse' }), 60)
    expect(corpseEntry(state, 'opponent:corpse').corpseControl?.origin?.source).toBe('dolphin')
    expect(equippedDolphin(state.player)?.sustainedKeys).not.toContain('prepared')
    const stopped = expireHistoricalMatter({
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    })
    expect(corpseEntry(stopped).controller).toBeUndefined()
    expect(corpseEntry(stopped, 'opponent:corpse').controller?.side).toBe('player')
    expect(dolphinIsBusy(stopped, 'player', equippedDolphin(stopped.player)!)).toBe(true)
  })
  it('lets Kurapika select the same application with his own zero reserve and the finite stolen supply', () => {
    const base = corpseSetup('player', 'kurapika')
    const held = corpseLoanSetup(30).player.dolphinLoan!.held
    const state: FightState = {
      ...base,
      player: {
        ...base.player,
        aura: 0,
        auraExhausted: true,
        kurapika: { ...createKurapika(), emperorTime: true, held },
      },
    }
    const own = { action: 'illumi-corpse' as const, target: 'player:corpse' }
    expect(
      arsenalOptions(state, 'player').find(
        (option) => option.command.action === own.action && option.command.target === own.target,
      )?.ready,
    ).toBe(true)
    const started = needleCommand(state, own)
    expect(started.player.aura).toBe(0)
    expect(started.player.kurapika?.held?.auraSupply?.amount).toBe(0)
    const active = mapFrames(started, 60)
    expect(corpseEntry(active).corpseControl?.origin).toMatchObject({
      source: 'dolphin',
      theftId: held.theftId,
    })
    expect(corpseEntry(active).controller?.side).toBe('player')
  })
})
