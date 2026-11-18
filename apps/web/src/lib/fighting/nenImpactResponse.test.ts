import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FightState } from './types'
import { nenImpactBodyPlan, nenConstraintPlan, recordNenImpact } from './nenImpactResponse'
import { createFightReactionPresentation } from './fightReactionPresentation'

const tick = (state: FightState) =>
  tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s records an actual contact without changing its force or body separation',
  (id) => {
    let state = beginFight(createFight(id, 'beyond', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 49 } }
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'light',
      moveId: `${id}:standingLight`,
      auraCharged: false,
    })
    for (let n = 0; n < 45 && !state.impact; n++) state = tick(state)
    expect(state.impact?.nenResponse?.kind).toBe('strike')
    const copy = structuredClone(state)
    expect(recordNenImpact(state, state)).toBe(state)
    expect(
      nenImpactBodyPlan(state.opponent, { response: state.impact?.nenResponse, progress: 0.2 }, {}),
    ).toBeNull()
    expect(state).toEqual(copy)
  },
)

it.each([
  ['franklin', 'projectile'],
  ['illumi', 'pierce'],
] as const)(
  '%s captures its real projectile mechanism after the projectile disappears',
  (id, kind) => {
    let state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, x: 35 }, opponent: { ...state.opponent, x: 58 } }
    state = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
    for (let n = 0; n < 120 && !state.impact; n++) state = tick(state)
    expect(state.impact?.nenResponse?.kind).toBe(kind)
    const read = createFightReactionPresentation()
    const first = read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
    const next = { ...state, player: { ...state.player, attack: null } }
    expect(
      read(next, 'opponent', { fighter: next.opponent, seconds: next.frame / 60 }).nenResponse,
    ).toEqual(first.nenResponse)
    const pose = nenImpactBodyPlan(
      state.opponent,
      { response: first.nenResponse, progress: 0.2 },
      {},
    )!
    expect(pose.key).toBe(`nen-response:${kind}`)
  },
)

it('distinguishes actual bindings and pulls, and never moves the authoritative body', () => {
  const state = beginFight(createFight('hisoka', 'machi', { mode: 'versus-local' }))
  const pulled = {
    ...state,
    bungeeGum: {
      owner: 'player' as const,
      target: 'opponent' as const,
      hidden: true,
      retracting: true,
    },
  }
  const before = structuredClone(pulled)
  expect(nenConstraintPlan(pulled, 'opponent')?.key).toBe('nen-pull-resistance')
  const bound = {
    ...state,
    opponent: {
      ...state.opponent,
      machiThread: { owner: 'player' as const, kind: 'bind' as const, x: 50, y: 0 },
    },
  }
  expect(nenConstraintPlan(bound, 'opponent')?.key).toBe('nen-bound-resistance')
  expect(nenConstraintPlan(state, 'opponent')).toBeNull()
  expect(pulled).toEqual(before)
})
