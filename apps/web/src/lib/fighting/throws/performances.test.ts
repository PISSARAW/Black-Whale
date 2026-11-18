import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performThrow } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { throwBodyPlan, throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { THROW_PERFORMANCES, throwPerformanceFor } from './catalogue'
import { sampleThrowBeat, sampleThrowCamera } from './sample'
import { selectThrowPerformance } from './selection'
import { EMPTY_INPUT, type FighterId, type FightSide } from '../types'

const ids = [
  'kurapika',
  'hisoka',
  'chrollo',
  'benjamin',
  'tserriednich',
  'feitan',
  'saiyu',
  'theta',
  'biscuit',
  'phinks',
  'franklin',
  'machi',
  'illumi',
  'kalluto',
  'bonolenov',
  'shizuku',
  'hinrigh',
  'mizaistom',
  'leorio',
  'hanzo',
  'rihan',
  'zakuro',
  'melody',
  'basho',
  'camilla',
  'halkenburg',
  'gel',
  'lynch',
  'luini',
  'bill',
  'furykov',
  'cluck',
  'beyond',
  'longhi',
  'musse',
] as const
function contact(options: { id: FighterId; side: FightSide; powered: boolean }) {
  const { id, side, powered } = options
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
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: powered })
  const actor = state[side]
  return resolveFightImpacts(
    {
      ...state,
      [side]: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
    },
    [],
  )
}

describe('thirty-five individual pairs of authored throw performances', () => {
  it('owns seventy distinct pairs of actor poses, victim poses, trajectories and lenses', () => {
    expect(THROW_PERFORMANCES).toHaveLength(70)
    const poses = THROW_PERFORMANCES.map((p) => JSON.stringify(sampleThrowBeat(p, 0.4)))
    const cameras = THROW_PERFORMANCES.map((p) => JSON.stringify(sampleThrowCamera(p, 0.4)))
    expect(new Set(poses).size).toBe(70)
    expect(new Set(cameras).size).toBe(70)
  })

  it.each(ids)(
    '%s selects the normal or Aura variant from the real attack for both seats',
    (id) => {
      for (const side of ['player', 'opponent'] as const)
        for (const powered of [false, true]) {
          const state = contact({ id, side, powered }),
            before = structuredClone(state)
          const frame = confirmedThrow(state)!
          expect(frame.performance).toBe(throwPerformanceFor(id, powered)!.id)
          expect(frame.powered).toBe(powered)
          const victim = frame.victim
          for (const t of [0, 0.15, 0.3, 0.5, 0.65, 0.8, 0.99, 1]) {
            const shot = { ...frame, age: frame.duration * t }
            const position = throwBodyPosition({
              state,
              side: victim,
              frame: shot,
              fallback: state[victim],
            })
            expect(
              Object.values(position).every(
                (value) => typeof value !== 'number' || Number.isFinite(value),
              ),
            ).toBe(true)
            const fighter = thrownVisualFighter(state[victim], position)
            const plan = throwBodyPlan({
              fighter,
              side: victim,
              throwFrame: shot,
              seconds: 1,
              progress: 0,
            })!
            expect(Object.values(plan.pose).flat().every(Number.isFinite)).toBe(true)
            if (t >= 0.8) {
              expect(position.x).toBe(state[victim].x)
              expect(position.y).toBe(state[victim].y)
              expect(plan.pose.body![0]).toBeLessThan(-1.2)
            }
          }
          expect(state).toEqual(before)
        }
    },
  )

  it('does not create a puppet or a parallel future to justify a super throw', () => {
    const chrollo = contact({ id: 'chrollo', side: 'player', powered: true })
    const tser = contact({ id: 'tserriednich', side: 'player', powered: true })
    expect(selectThrowPerformance(chrollo, 'player').puppetId).toBeUndefined()
    expect(selectThrowPerformance(tser, 'player').future).toBeUndefined()
    expect(chrollo.battlefield?.entities.some((entry) => entry.kind === 'puppet')).not.toBe(true)
    expect(tser.parallelFuture).toBeUndefined()
  })

  it('suppresses native chain and gum effects when the personal Hatsu has been stolen', () => {
    for (const id of ['kurapika', 'hisoka'] as const) {
      const state = contact({ id, side: 'player', powered: true })
      const locked = {
        ...state,
        player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      }
      expect(selectThrowPerformance(locked, 'player').performance).toBeUndefined()
    }
  })
})
