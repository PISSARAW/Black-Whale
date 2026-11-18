import { describe, expect, it } from 'vitest'
import { selectedGumLink } from './bungeeNetwork'
import { prepareCombatRoute } from './combatRouteSetup'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { canAct } from './fightActorState'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightInput, type FightState, type MoveAction } from './types'

type Pilot = 'kurapika' | 'hisoka'

function duel(id: Pilot, options: { corner?: boolean; tether?: boolean; aura?: number } = {}) {
  const opponent = id === 'kurapika' ? 'hisoka' : 'kurapika'
  const start = beginFight(createFight(id, opponent, { mode: 'versus-local' }))
  const ready = {
    ...start,
    player: { ...start.player, x: 44, aura: 100 },
    opponent: { ...start.opponent, x: 50 },
  }
  const prepared = options.tether ? prepareCombatRoute(ready, 'bungee') : ready
  return {
    ...prepared,
    player: { ...prepared.player, x: options.corner ? 87 : 44, aura: options.aura ?? 100 },
    opponent: { ...prepared.opponent, x: options.corner ? 93 : 50 },
  }
}

function tick(state: FightState, guard: boolean) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard },
  })
}

function until(state: FightState, ready: (result: FightState) => boolean, guard = true) {
  for (let frame = 0; frame < 80 && !ready(state); frame++) state = tick(state, guard)
  expect(ready(state)).toBe(true)
  return state
}

function tap(state: FightState, input: Partial<FightInput> = {}, action: MoveAction = 'light') {
  return performMove({ state, side: 'player', action, input: { ...EMPTY_INPUT, ...input } })
}

function launcher(state: FightState) {
  const first = until(tap(state), (next) => next.impact?.comboHits === 1, false)
  const second = until(tap(first), (next) => next.impact?.comboHits === 2)
  const launch = until(tap(second, { jump: true }), (next) => next.impact?.comboHits === 3)
  expect(launch.player.attack).toMatchObject({ directionalChain: 'air', confirmedHit: true })
  return launch
}

function afterActive(launch: FightState, offset: number) {
  const { startup, active } = attackData(launch.player.attack!.kind, launch.player)
  return until(launch, (state) => (state.player.attack?.frame ?? -1) >= startup + active + offset)
}

function resolveRace(launch: FightState, state: FightState) {
  let defended = false
  for (let frame = 0; frame < 64 && state.impact?.sequence === launch.impact?.sequence; frame++) {
    if (!defended && !state.hitstop && canAct(state.opponent)) {
      state = performMove({ state, side: 'opponent', action: 'light', input: EMPTY_INPUT })
      defended = Boolean(state.opponent.attack)
    }
    state = tick(state, true)
  }
  return { state, defended }
}

describe.each(['kurapika', 'hisoka'] as const)('poursuite de %s', (id) => {
  it.each([false, true])('convertit le léger immédiat, coin %s', (corner) => {
    const launch = launcher(duel(id, { corner }))
    const buffered = tap(launch, { right: true })
    expect(buffered.player.bufferedAttack?.directionalChain).toBe('pursuit')
    const { state, defended } = resolveRace(launch, buffered)
    expect(defended).toBe(false)
    expect(state.impact).toMatchObject({ attacker: 'player', comboHits: 4, blocked: false })
    expect(state.player.attack?.moveId).toBe(`${id}:airLight`)
    expect(state.player.y).toBeGreaterThan(0)
  })

  it.each([false, true])('laisse le défenseur interrompre un léger tardif, coin %s', (corner) => {
    const launch = launcher(duel(id, { corner }))
    const { state, defended } = resolveRace(launch, tap(afterActive(launch, 5), { right: true }))
    expect(defended).toBe(true)
    expect(state.impact).toMatchObject({ attacker: 'opponent', comboHits: 1 })
  })

  it('utilise la technique native éligible et paie son coût au démarrage', () => {
    const launch = launcher(duel(id, { tether: id === 'hisoka' }))
    const ready = afterActive(launch, 2)
    const technique = tap(ready, { right: true }, 'special')
    const cost = id === 'hisoka' ? 55 : 24
    expect(technique.player.aura).toBeCloseTo(ready.player.aura - cost)
    expect(technique.player.attack?.moveId).toBe(
      id === 'hisoka' ? 'hisoka:finisher' : 'kurapika:forwardSpecial',
    )
    const { state, defended } = resolveRace(launch, technique)
    expect(defended).toBe(false)
    expect(state.impact).toMatchObject({ attacker: 'player', comboHits: 4, blocked: false })
    if (id === 'hisoka') expect(selectedGumLink(state, 'player')).toBeUndefined()
  })

  it('refuse la technique sans aura et garde la poursuite légère disponible', () => {
    const launch = launcher(duel(id, { tether: id === 'hisoka', aura: 0 }))
    const ready = afterActive(launch, 0)
    expect(tap(ready, { right: true }, 'special')).toEqual(ready)
    const { state } = resolveRace(launch, tap(ready, { right: true }))
    expect(state.impact).toMatchObject({ attacker: 'player', comboHits: 4 })
  })
})

it('Hisoka doit avoir un lien sélectionné sur son adversaire pour la poursuite Hatsu', () => {
  const launch = launcher(duel('hisoka'))
  const ready = afterActive(launch, 0)
  expect(tap(ready, { right: true }, 'special')).toEqual(ready)
  const { state, defended } = resolveRace(launch, ready)
  expect(defended).toBe(true)
  expect(state.impact?.attacker).toBe('opponent')
})

it.each([false, true])('le coin change la fenêtre du Bungee Gum retardé, coin %s', (corner) => {
  const launch = launcher(duel('hisoka', { corner, tether: true }))
  const technique = tap(afterActive(launch, 10), { right: true }, 'special')
  const { state, defended } = resolveRace(launch, technique)
  expect(defended).toBe(!corner)
  expect(state.impact).toMatchObject({
    attacker: corner ? 'player' : 'opponent',
    comboHits: corner ? 4 : 1,
  })
})
