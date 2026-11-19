import { describe, expect, it } from 'vitest'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { advanceMachiReattachment } from './machiReattachment'
import { stitchingSetup, stitchingFrames, severedPart } from './machiReattachmentTestSetup'
import { physicalHandFunctional } from './bodyDamage'
import { physicalHandOccupancy } from './deviceHands'
import { priorityArsenalAi } from './priorityArsenalAi'
import { privatePvpState } from './pvp/view'
import { nextRound } from './engine'
import type { FightSide, FightState } from './types'

function start(state: FightState, side: FightSide = 'player') {
  return performArsenalCommand(state, side, {
    action: 'machi-reattach',
    target: severedPart(state).id,
  })
}
describe('Machi reconnects original forearms without regenerating flesh or HP', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'reattaches both finite original limbs for %s',
    (side) => {
      const state = stitchingSetup(side)
      const target = side === 'player' ? 'opponent' : 'player'
      expect(physicalHandOccupancy(state, target).size).toBe(2)
      expect(
        arsenalOptions(state, side).filter(
          (entry) => entry.command.action === 'machi-reattach' && entry.ready,
        ),
      ).toHaveLength(2)
      const working = start(state, side)
      expect(working[side].aura).toBe(80)
      expect(stitchingFrames(working, side, 89)[target].bodyDamage?.parts).toHaveLength(2)
      const connected = stitchingFrames(working, side, 92)
      expect(connected[target].health).toBe(state[target].health)
      expect(connected[target].bodyDamage?.parts).toEqual(['right-forearm'])
      expect(physicalHandFunctional(connected[target], 'left')).toBe(true)
      expect(physicalHandFunctional(connected[target], 'right')).toBe(false)
      expect(severedPart(connected).present).toBe(false)
      expect(start(connected, side)).toBe(connected)
      const next = performArsenalCommand(connected, side, {
        action: 'machi-reattach',
        target: severedPart(connected, 'right-forearm').id,
      })
      const complete = stitchingFrames(next, side, 92)
      expect(complete[target].bodyDamage?.parts).toEqual([])
      expect(complete[target].health).toBe(state[target].health)
      expect(physicalHandOccupancy(complete, target).size).toBe(0)
      expect(complete.score).toEqual(state.score)
    },
  )
  it('requires actual consent, relaxed aura, hands, original matter and continuous contact', () => {
    const state = stitchingSetup()
    const cases: FightState[] = [
      { ...state, player: { ...state.player, equipment: [] } },
      { ...state, player: { ...state.player, weaponsConfiscated: true } },
      { ...state, opponent: { ...state.opponent, supportConsent: false } },
      { ...state, opponent: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'ten' } } },
      { ...state, player: { ...state.player, coveringEars: true } },
      { ...state, player: { ...state.player, x: 22 } },
      {
        ...state,
        battlefield: {
          ...state.battlefield!,
          entities: state.battlefield!.entities.map((entry) => ({ ...entry, material: 'nen' })),
        },
      },
      {
        ...state,
        battlefield: {
          ...state.battlefield!,
          entities: state.battlefield!.entities.map((entry) => ({ ...entry, health: 0 })),
        },
      },
      { ...state, opponent: { ...state.opponent, health: 0 } },
    ]
    for (const blocked of cases) expect(start(blocked)).toBe(blocked)
    const started = start(state)
    const interrupted = { ...started, opponent: { ...started.opponent, x: started.opponent.x + 2 } }
    const stopped = advanceMachiReattachment(interrupted)
    expect(stopped.player.machiReattachment).toBeUndefined()
    expect(severedPart(stopped).present).toBe(true)
    expect(stopped.opponent.bodyDamage).toEqual(state.opponent.bodyDamage)
  })
  it('accepts locally empty arm aura through Ko elsewhere and interrupts on renewed hand aura or lost tools', () => {
    const base = stitchingSetup()
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        nen: { ...base.opponent.nen, mode: 'ren' as const, ko: 'head' as const },
      },
    }
    const started = start(state)
    expect(started.player.machiReattachment).toBeDefined()
    const cases = [
      {
        ...started,
        opponent: { ...started.opponent, nen: { ...started.opponent.nen, ko: 'hands' as const } },
      },
      { ...started, player: { ...started.player, weaponsConfiscated: true } },
      { ...started, player: { ...started.player, hitStun: 1 } },
      {
        ...started,
        player: { ...started.player, nen: { ...started.player.nen, mode: 'zetsu' as const } },
      },
    ]
    for (const interrupted of cases) {
      const cancelled = advanceMachiReattachment(interrupted)
      expect(cancelled.player.machiReattachment).toBeUndefined()
      expect(cancelled.opponent.bodyDamage?.parts).toHaveLength(2)
      expect(severedPart(cancelled).present).toBe(true)
    }
  })
  it('uses the same physical limb and command in the P2 private view', () => {
    const state = stitchingSetup('opponent')
    const command = { action: 'machi-reattach' as const, target: severedPart(state).id }
    const actual = performArsenalCommand(state, 'opponent', command)
    const predicted = performArsenalCommand(privatePvpState(state, 'opponent'), 'player', command)
    expect(predicted.player.machiReattachment).toEqual(
      privatePvpState(actual, 'opponent').player.machiReattachment,
    )
    expect(predicted.player.machiReattachment).toBeDefined()
  })
  it('lets the AI use a prepared treatment without inventing patient consent', () => {
    const state = stitchingSetup('opponent')
    expect(priorityArsenalAi(state)?.opponent.machiReattachment).toBeDefined()
    const refused = { ...state, player: { ...state.player, supportConsent: false } }
    expect(priorityArsenalAi(refused)?.opponent.machiReattachment).toBeUndefined()
  })
  it('carries the reconnected body and consumed material through a round', () => {
    const state = stitchingFrames(start(stitchingSetup()), 'player', 92)
    const next = nextRound({ ...state, phase: 'finished', matchWinner: null })
    expect(next.opponent.bodyDamage).toEqual(state.opponent.bodyDamage)
    expect(severedPart(next).present).toBe(false)
    expect(severedPart(next, 'right-forearm').present).toBe(true)
  })
})
