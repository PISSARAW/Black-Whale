import { describe, expect, it } from 'vitest'
import { soulDuel, shootSoul } from './halkenburgSoulTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { performArsenalAction } from './arsenalExecution'
import { performAuraAttack, nextRound } from './engine'
import { reconcileHalkenburgSouls } from './halkenburgSouls'
import { readyCohort } from './preparationWorld'
import { privatePvpState } from './pvp/view'
import { arsenalOptions } from './retrospectiveArsenal'
import { halkenburgMindContext, halkenburgMindBody } from './halkenburgMindAccess'
import type { FightState, FightSide } from './types'

function rest(state: FightState, side: FightSide, action: 'sleep' | 'wake'): FightState {
  const id = (state.player.halkenburgSoul ?? state.opponent.halkenburgSoul)!.id
  return performArsenalAction(
    { state, side, command: { action: 'halkenburg-soul-rest', target: `${id}|${action}` } },
    performAuraAttack,
  )
}
function motion(state: FightState, side: FightSide, direction: 'left' | 'right'): FightState {
  const id = (state.player.halkenburgSoul ?? state.opponent.halkenburgSoul)!.id
  return performArsenalAction(
    { state, side, command: { action: 'halkenburg-host-motion', target: `${id}|${direction}` } },
    performAuraAttack,
  )
}
function donorBody(state: FightState, side: FightSide) {
  const soul = (state.player.halkenburgSoul ?? state.opponent.halkenburgSoul)!
  return halkenburgMindBody(state, halkenburgMindContext(state, side, soul.id)!)!
}

describe('Halkenburg’s initiating consciousness has priority while the original bodies live', () => {
  for (const side of ['player', 'opponent'] as const) {
    for (const seed of [0, 1]) {
      it(`alternates the two consciousnesses without damage or a timer: ${side}, seed ${seed}`, () => {
        const target = side === 'player' ? 'opponent' : 'player'
        const state = mapFrames(shootSoul(soulDuel(side, seed), side), 35)
        const id = state[target].halkenburgSoul!.id
        expect(rest(state, target, 'wake')).toBe(state)
        const sleeping = rest(state, side, 'sleep')
        expect(sleeping[target].halkenburgSleeping).toBe(id)
        expect(sleeping[target].halkenburgSoul).toMatchObject({
          initiatorAwake: false,
          victimAwake: false,
        })
        const awake = rest(sleeping, target, 'wake')
        expect(awake[target].halkenburgSoul?.victimAwake).toBe(true)
        expect(donorBody(awake, target).halkenburgPassenger?.owner).toBe(target)
        expect(donorBody(awake, target).halkenburgSleeping).toBeUndefined()
        if (seed === 0) {
          const donor = awake[target].halkenburgSoul!.donor
          expect(donor?.kind).toBe('supporter')
          const ready = readyCohort(awake, side).map(({ id }) => id)
          expect(ready).toEqual(readyCohort(state, side).map(({ id }) => id))
          expect(ready).not.toContain(donor?.kind === 'supporter' ? donor.id : undefined)
        }
        const direction = side === 'player' ? 'left' : 'right'
        const walking = motion(awake, target, direction)
        const start = donorBody(walking, target).x
        const moved = mapFrames(walking, 5)
        expect(
          (donorBody(moved, target).x - start) * (direction === 'right' ? 1 : -1),
        ).toBeGreaterThan(0)
        expect(moved[target].x).toBe(awake[target].x)
        expect(moved[target].health).toBe(state[target].health)
        const priority = rest(moved, side, 'wake')
        expect(priority[target].halkenburgSoul).toMatchObject({
          initiatorAwake: true,
          victimAwake: false,
        })
        expect(priority[target].halkenburgSleeping).toBeUndefined()
        expect(donorBody(priority, target).halkenburgSleeping).toBe(id)
        expect(donorBody(priority, target).halkenburgPassenger).toBeUndefined()
        expect(rest(priority, target, 'wake')).toBe(priority)
        const settled = mapFrames(priority, 180)
        expect(settled[target].halkenburgSoul?.victimAwake).toBe(false)
      })
    }
  }
  it('does not cancel Cookie’s imposed sleep with a voluntary wake request', () => {
    const state = mapFrames(shootSoul(soulDuel()), 35)
    const imposed = reconcileHalkenburgSouls({
      ...state,
      opponent: {
        ...state.opponent,
        arsenalSleep: { owner: 'opponent', cause: 'cookie' },
      },
    })
    expect(imposed.opponent.halkenburgSoul?.initiatorAwake).toBe(false)
    expect(rest(imposed, 'player', 'wake')).toBe(imposed)
    const victim = rest(imposed, 'opponent', 'wake')
    expect(victim.opponent.halkenburgSoul?.victimAwake).toBe(true)
    expect(victim.opponent.arsenalSleep).toEqual(imposed.opponent.arsenalSleep)
    const ended = { ...victim, opponent: { ...victim.opponent, arsenalSleep: undefined } }
    expect(rest(ended, 'player', 'wake').opponent.halkenburgSoul?.victimAwake).toBe(false)
  })
  it('wakes a consciousness without erasing the occupied body’s physical knockdown or wounds', () => {
    const base = rest(mapFrames(shootSoul(soulDuel()), 35), 'player', 'sleep')
    const down = {
      ...base,
      opponent: { ...base.opponent, health: 100, knockdownFrames: 30, pose: 'down' as const },
    }
    const awake = rest(down, 'player', 'wake')
    expect(awake.opponent.halkenburgSoul?.initiatorAwake).toBe(true)
    expect(awake.opponent.health).toBe(100)
    expect(awake.opponent.knockdownFrames).toBe(30)
    expect(awake.opponent.pose).toBe('down')
    const waiting = mapFrames(awake, 3)
    const trying = mapFrames(motion(awake, 'player', 'right'), 3)
    expect(trying.opponent.x).toBe(waiting.opponent.x)
    expect(trying.opponent.knockdownFrames).toBe(waiting.opponent.knockdownFrames)
  })
  it('keeps a distinct longer sleep on the original supporter instead of erasing it', () => {
    const state = rest(mapFrames(shootSoul(soulDuel()), 35), 'player', 'sleep')
    const donor = state.opponent.halkenburgSoul!.donor!
    expect(donor.kind).toBe('supporter')
    const imposed = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.halkenburgSleeping ? { ...entry, sleepingFrames: 30 } : entry,
        ),
      },
    }
    expect(rest(imposed, 'opponent', 'wake')).toBe(imposed)
    const elapsed = mapFrames(imposed, 10)
    expect(donorBody(elapsed, 'opponent')).toMatchObject({ sleepingFrames: 20 })
    expect(rest(elapsed, 'opponent', 'wake')).toBe(elapsed)
    expect(
      rest(mapFrames(elapsed, 20), 'opponent', 'wake').opponent.halkenburgSoul?.victimAwake,
    ).toBe(true)
  })
  it('offers a private wake request without revealing the original body before the victim wakes', () => {
    const state = rest(
      mapFrames(shootSoul(soulDuel('opponent', 1), 'opponent'), 35),
      'opponent',
      'sleep',
    )
    const local = privatePvpState(state, 'player')
    expect(local.player.halkenburgSoul?.donor).toBeUndefined()
    expect(local.player.halkenburgSoul?.victimWakeReady).toBe(true)
    expect(
      arsenalOptions(local, 'player').find(
        (option) => option.labelEn === 'Displaced consciousness · Wake up',
      )?.ready,
    ).toBe(true)
    const predicted = rest(local, 'player', 'wake')
    expect(predicted.player.halkenburgSoul?.victimAwake).toBe(true)
    expect(predicted.player.halkenburgSoul?.donor).toBeUndefined()
    const actual = privatePvpState(rest(state, 'player', 'wake'), 'player')
    expect(actual.player.halkenburgSoul?.donor).toBeDefined()
    expect(actual.opponent.halkenburgPassenger?.owner).toBe('player')
  })
  it('preserves the waking victim, moved original body and priority across a round', () => {
    const state = rest(
      rest(mapFrames(shootSoul(soulDuel('player', 1)), 35), 'player', 'sleep'),
      'opponent',
      'wake',
    )
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.halkenburgSoul).toEqual(state.opponent.halkenburgSoul)
    expect(next.player.halkenburgPassenger).toEqual(state.player.halkenburgPassenger)
    expect(next.opponent.halkenburgSleeping).toBe(state.opponent.halkenburgSoul?.id)
  })
})
