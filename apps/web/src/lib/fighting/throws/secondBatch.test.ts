import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, performThrow } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { throwBodyPosition } from '../throwCinematicMotion'
import { selectThrowPerformance } from './selection'
import { sampleThrowBeat } from './sample'
import { throwPerformanceFor } from './catalogue'
import { EMPTY_INPUT, type FighterId, type FightSide } from '../types'

function grabbed(
  id: FighterId,
  options: { side?: FightSide; powered?: boolean; trueForm?: boolean } = {},
) {
  const side = options.side ?? 'player'
  let state = beginFight(
    createFight(side === 'player' ? id : 'franklin', side === 'opponent' ? id : 'franklin', {
      mode: 'versus-local',
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
  if (options.trueForm) state = performMove({ state, side, action: 'special' })
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: Boolean(options.powered) })
  const actor = state[side]
  return resolveFightImpacts(
    {
      ...state,
      [side]: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
    },
    [],
  )
}

describe('second batch of personal cinematic throws', () => {
  it.each(['feitan', 'saiyu'] as const)(
    '%s really travels around the victim during the super, in either seat',
    (id) => {
      for (const side of ['player', 'opponent'] as const) {
        const state = grabbed(id, { side, powered: true }),
          before = structuredClone(state)
        const contact = confirmedThrow(state)!
        const frame = { ...contact, age: contact.duration * 0.4 }
        const position = throwBodyPosition({ state, side, frame, fallback: state[side] })
        expect(position.y).toBeGreaterThan(4)
        expect((position.x - state[side].x) * frame.facing).toBeGreaterThan(1)
        const landed = throwBodyPosition({
          state,
          side,
          frame: { ...frame, age: frame.duration * 0.8 },
          fallback: state[side],
        })
        expect(landed.x).toBe(state[side].x)
        expect(landed.y).toBe(state[side].y)
        expect(state).toEqual(before)
      }
    },
  )

  it('keeps Biscuit in the selected real body and preserves it through either throw', () => {
    for (const powered of [false, true])
      for (const trueForm of [false, true]) {
        const state = grabbed('biscuit', { powered, trueForm })
        expect(Boolean(state.player.biscuitTrueForm)).toBe(trueForm)
        expect(confirmedThrow(state)?.performance).toBe(
          powered ? 'biscuit-correction' : 'biscuit-lesson',
        )
        const before = structuredClone(state)
        const frame = confirmedThrow(state)!
        throwBodyPosition({
          state,
          side: 'opponent',
          frame: { ...frame, age: frame.duration * 0.5 },
          fallback: state.opponent,
        })
        expect(state).toEqual(before)
      }
  })

  it('keeps Feitan physical with stolen Nen, and masks Saiyu’s conjured staff when unavailable', () => {
    for (const id of ['feitan', 'saiyu'] as const) {
      const state = grabbed(id)
      const sealed = {
        ...state,
        player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      }
      expect(selectThrowPerformance(sealed, 'player').performance).toBe(
        id === 'feitan' ? 'feitan-umbrella' : undefined,
      )
    }
  })

  it('does not spend Cyclotron charges or fire Theta’s pistol as part of the throw', () => {
    for (const id of ['theta', 'phinks'] as const)
      for (const powered of [false, true]) {
        const state = grabbed(id, { powered })
        expect(state.projectiles).toHaveLength(0)
        expect(state.player.attack?.cyclotronTurns).toBeUndefined()
        expect(state.player.hatsuEffects.cyclotronTurns ?? 0).toBe(0)
      }
  })

  it('reverses Phinks’s super trajectory instead of replaying the normal spin', () => {
    const superThrow = throwPerformanceFor('phinks', true)!
    expect(sampleThrowBeat(superThrow, 0.29).path[0]).toBeGreaterThan(0.8)
    expect(sampleThrowBeat(superThrow, 0.46).path[0]).toBeLessThan(0)
    expect(throwPerformanceFor('phinks', false)!.id).toBe('phinks-wringer')
  })
})
