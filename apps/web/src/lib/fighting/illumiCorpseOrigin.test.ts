import { describe, expect, it } from 'vitest'
import {
  controlledCorpse,
  corpseSetup,
  corpseEntry,
  bookCorpseSetup,
} from './illumiCorpseTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { expireHistoricalMatter } from './historicalMatterClock'
import { applyAuraContext } from './nen'
import { arsenalOptions } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { nextRound } from './engine'
import { EMPTY_INPUT, type FightSide } from './types'

describe('corpse control owns actual embedded metal and its original Nen source', () => {
  it('enforces an existing Judgment clause before paying or inserting metal', () => {
    const base = corpseSetup()
    const bound = {
      ...base,
      player: {
        ...base.player,
        judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
      },
    }
    const attempted = needleCommand(bound, { action: 'illumi-corpse', target: 'player:corpse' })
    expect(attempted.player.health).toBe(0)
    expect(attempted.player.aura).toBe(base.player.aura)
    expect(attempted.player.corpsePreparation).toBeUndefined()
    expect(corpseEntry(attempted).corpseNeedles).toBeUndefined()
  })
  it.each<FightSide>(['player', 'opponent'])(
    'captures the real assembly and body for %s without healing or free matter on interruption',
    (side) => {
      const base = corpseSetup(side)
      const command = { action: 'illumi-corpse' as const, target: `${side}:corpse` }
      const started = needleCommand(base, command, side)
      expect(corpseEntry(started, command.target).corpseNeedles).toBeUndefined()
      const interrupted = mapFrames({ ...started, [side]: { ...started[side], hitStun: 5 } }, 1)
      expect(interrupted[side].corpsePreparation).toBeUndefined()
      expect(corpseEntry(interrupted, command.target).corpseNeedles).toBeUndefined()
      const state = controlledCorpse(side)
      const corpse = corpseEntry(state, command.target)
      expect(corpse.corpseNeedles?.id).toContain(`corpse-pins:${side}:0:`)
      expect(corpse.corpseControl).toMatchObject({
        owner: { owner: side, member: 0 },
        pinsId: corpse.corpseNeedles!.id,
        origin: { source: 'personal' },
      })
      expect(started[side].aura).toBe(base[side].aura - 30)
      expect(state[side].health).toBe(base[side].health)
    },
  )
  it('does not need an unused kit to maintain already implanted real needles and permits physical extraction under On', () => {
    const state = controlledCorpse()
    const pins = corpseEntry(state).corpseNeedles!
    const disarmed = {
      ...state,
      player: { ...state.player, equipment: [], weaponsConfiscated: true },
    }
    const kept = mapFrames(disarmed, 1)
    expect(corpseEntry(kept).controller?.source).toBe('illumi')
    const on = {
      ...kept,
      player: applyAuraContext(
        { ...kept.player, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    const stopped = expireHistoricalMatter({ ...on, hitstop: 10 })
    expect(stopped.player.nen.on).toBe(true)
    expect(corpseEntry(stopped).controller).toBeUndefined()
    expect(corpseEntry(stopped).corpseNeedles).toEqual(pins)
    const aura = stopped.player.aura
    const removed = needleCommand(stopped, {
      action: 'illumi-corpse-release',
      target: 'player:corpse',
    })
    expect(corpseEntry(removed).corpseNeedles).toBeUndefined()
    expect(
      removed.battlefield!.entities.find((entry) => entry.corpsePinBundle)?.corpsePinBundle,
    ).toEqual(pins)
    expect(removed.player.aura).toBe(aura)
    expect(removed.player.health).toBe(stopped.player.health)
    expect(
      needleCommand(removed, { action: 'illumi-corpse-release', target: 'player:corpse' }),
    ).toBe(removed)
  })
  it('uses the acquired book page and free left hand, and ends only its control when the page closes', () => {
    const base = bookCorpseSetup()
    const command = { action: 'illumi-corpse' as const, target: 'player:corpse' }
    expect(
      arsenalOptions(base, 'player').find(
        (option) =>
          option.command.action === command.action && option.command.target === command.target,
      )?.ready,
    ).toBe(true)
    const started = needleCommand(base, command)
    expect(started.player.corpsePreparation?.hand).toBe('left')
    const cancelled = expireHistoricalMatter({
      ...started,
      hitstop: 10,
      player: { ...started.player, chrolloBook: { ...started.player.chrolloBook!, open: false } },
    })
    expect(cancelled.player.corpsePreparation).toBeUndefined()
    expect(corpseEntry(cancelled).corpseNeedles).toBeUndefined()
    const controlled = mapFrames(started, 60)
    const stopped = expireHistoricalMatter({
      ...controlled,
      hitstop: 10,
      player: {
        ...controlled.player,
        chrolloBook: { ...controlled.player.chrolloBook!, open: false },
      },
    })
    expect(corpseEntry(stopped).controller).toBeUndefined()
    expect(corpseEntry(stopped).corpseNeedles).toEqual(corpseEntry(controlled).corpseNeedles)
    expect(corpseEntry(stopped).present).toBe(true)
    expect(
      privatePvpState(controlled, 'opponent').battlefield!.entities.find(
        (entry) => entry.id === command.target,
      )?.corpseControl?.origin,
    ).toBeUndefined()
    expect(
      privatePvpState(controlled, 'player').battlefield!.entities.find(
        (entry) => entry.id === command.target,
      )?.corpseControl?.origin?.source,
    ).toBe('book')
  })
  it('carries the same dead body, removed assembly and released hostage across a round', () => {
    let state = controlledCorpse()
    state = needleCommand(state, { action: 'illumi-corpse-release', target: 'player:corpse' })
    state = needleCommand(state, { action: 'judgment-return-hostage', target: 'player:hostage' })
    const pins = state.battlefield!.entities.find((entry) => entry.corpsePinBundle)!
    const damaged = {
      ...state,
      frame: 1000,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === 'player:corpse' ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    const next = nextRound({ ...damaged, phase: 'finished', winner: 'player' })
    expect(corpseEntry(next).health).toBe(0)
    expect(corpseEntry(next).corpseNeedles).toBeUndefined()
    expect(next.battlefield!.entities.filter((entry) => entry.id === pins.id)).toHaveLength(1)
    expect(
      next.battlefield!.entities.find((entry) => entry.id === 'player:hostage')?.captiveOf,
    ).toBeUndefined()
  })
})
