import { describe, expect, it } from 'vitest'
import { selectedGumLink } from './bungeeNetwork'
import { prepareCombatRoute, type CombatRouteSetup } from './combatRouteSetup'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { canAct } from './fightActorState'
import { attackData, INPUT_BUFFER_FRAMES } from './frameData'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightInput,
  type FightState,
  type MoveAction,
} from './types'
import { FIGHTING_ROSTER } from './roster'
import { airRecoveryAvailable } from './airRecovery'
import { createPursuitRecoveryCues } from './pursuitRecoveryPresentation'
import { pursuitRecoveryPose } from './pursuitRecoveryPose'

function duel(
  id: FighterId,
  options: { corner?: boolean; tether?: boolean; aura?: number; prep?: CombatRouteSetup } = {},
) {
  const opponent = id === 'kurapika' ? 'hisoka' : 'kurapika'
  const start = beginFight(createFight(id, opponent, { mode: 'versus-local' }))
  const ready = {
    ...start,
    player: { ...start.player, x: 44, aura: 100 },
    opponent: { ...start.opponent, x: 50 },
  }
  const prepared = prepareCombatRoute(ready, options.tether ? 'bungee' : options.prep)
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

function defend(state: FightState, input: Partial<FightInput>) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, ...input },
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

/**
 * The 4-frame input buffer opens the pursuit anticipation window at startup + active + 2 - buffer,
 * so a tap performed right at the launch frame (startup + active - buffer - 2) is no longer accepted.
 */
function tapInAnticipationWindow(
  state: FightState,
  input: Partial<FightInput> = {},
  action: MoveAction = 'light',
) {
  const data = attackData(state.player.attack!.kind, state.player)
  return tap(afterActive(state, data.startup + data.active + 2 - INPUT_BUFFER_FRAMES), input, action)
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
    const buffered = tapInAnticipationWindow(launch, { right: true })
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

describe.each(FIGHTING_ROSTER.map(({ id }) => id))('poursuite du roster, %s', (id) => {
  it.each([false, true])('sépare la conversion et la reprise du défenseur, coin %s', (corner) => {
    const launch = launcher(duel(id, { corner }))
    const immediate = resolveRace(launch, tapInAnticipationWindow(launch, { right: true }))
    expect(immediate.defended).toBe(false)
    expect(immediate.state.impact).toMatchObject({
      attacker: 'player',
      comboHits: 4,
      blocked: false,
    })
    expect(immediate.state.player.attack?.moveId).toBe(`${id}:airLight`)

    for (const choice of [launch, tap(afterActive(launch, 10), { right: true })]) {
      const recovery = resolveRace(launch, choice)
      expect(recovery.defended).toBe(true)
      expect(recovery.state.impact).toMatchObject({ attacker: 'opponent', comboHits: 1 })
    }
  })
})

const PREPARED_STRIKES = [
  { id: 'phinks', prep: 'cyclotron', slot: 'finisher' },
  { id: 'bonolenov', prep: 'prologue', slot: 'forwardSpecial' },
  { id: 'kalluto', prep: 'paper', slot: 'forwardSpecial' },
  { id: 'biscuit', prep: 'true-form', slot: 'finisher' },
] as const

it.each(PREPARED_STRIKES)(
  '$id exige sa préparation pour la technique en poursuite',
  ({ id, prep, slot }) => {
    const normal = launcher(duel(id))
    expect(tap(normal, { right: true }, 'special')).toEqual(normal)
    for (const corner of [false, true]) {
      const prepared = launcher(duel(id, { corner, prep }))
      const intent = tapInAnticipationWindow(prepared, { right: true }, 'special')
      expect(intent.player.bufferedAttack?.moveId).toBe(`${id}:${slot}`)
      const { state, defended } = resolveRace(prepared, intent)
      expect(defended).toBe(id === 'kalluto')
      if (id === 'kalluto')
        expect([
          { attacker: 'player', comboHits: 2 },
          { attacker: 'opponent', comboHits: 1 },
        ]).toContainEqual({
          attacker: state.impact?.attacker,
          comboHits: state.impact?.comboHits,
        })
      else expect(state.impact).toMatchObject({ attacker: 'player', comboHits: 4 })
      if (id !== 'kalluto') expect(state.player.attack?.directionalChain).toBe('pursuit-technique')
      if (id === 'phinks') {
        expect(state.player.attack?.cyclotronTurns).toBeGreaterThan(0)
        expect(state.player.hatsuEffects.cyclotronTurns).toBe(0)
      }
    }
  },
)

it('Chrollo convertit une frappe copiée sans transformer la page historique en coup', () => {
  const initial = duel('chrollo')
  const historical = launcher(initial)
  expect(tap(historical, { right: true }, 'special')).toEqual(historical)
  const openBook = {
    ...initial,
    player: {
      ...initial.player,
      chrolloBook: { open: true, page: 0, bookmark: null, pages: ['gel:forwardSpecial'] as const },
    },
  }
  const launch = launcher(openBook)
  const { state, defended } = resolveRace(launch, tapInAnticipationWindow(launch, { right: true }, 'special'))
  expect(defended).toBe(false)
  expect(state.impact?.comboHits).toBe(4)
  expect(state.player.attack).toMatchObject({
    moveId: 'gel:forwardSpecial',
    hatsuSource: 'gel',
    copiedPage: 'gel:forwardSpecial',
  })
})

it('les Hatsu de réaction ou de contrat ne deviennent pas des frappes', () => {
  for (const id of ['camilla', 'tserriednich', 'halkenburg', 'longhi', 'rihan'] as const) {
    const launch = launcher(duel(id))
    expect(tap(launch, { right: true }, 'special')).toEqual(launch)
  }
})

it('Hisoka doit avoir un lien sélectionné sur son adversaire pour la poursuite Hatsu', () => {
  const launch = launcher(duel('hisoka'))
  const ready = afterActive(launch, 0)
  expect(tap(ready, { right: true }, 'special')).toEqual(ready)
  const { state, defended } = resolveRace(launch, ready)
  expect(defended).toBe(true)
  expect(state.impact?.attacker).toBe('opponent')
})

it.each([false, true])('le Bungee Gum retardé laisse la reprise, coin %s', (corner) => {
  const launch = launcher(duel('hisoka', { corner, tether: true }))
  const technique = tap(afterActive(launch, 10), { right: true }, 'special')
  const { state, defended } = resolveRace(launch, technique)
  expect(defended).toBe(true)
  expect(state.impact).toMatchObject({ attacker: 'opponent', comboHits: 1 })
})

it.each([false, true])(
  'la défense tenue ne coupe pas une poursuite garantie, coin %s',
  (corner) => {
    const launch = launcher(duel('hisoka', { corner }))
    let state = tap(launch, { right: true })
    for (let i = 0; i < 60 && state.impact?.sequence === launch.impact?.sequence; i++) {
      expect(airRecoveryAvailable(state.opponent)).toBe(false)
      state = defend(state, { down: true, guard: true, right: true })
    }
    expect(state.impact).toMatchObject({ attacker: 'player', comboHits: 4, blocked: false })
  },
)

it('le recul commence quand le défenseur récupère et respecte le bord de l’arène', () => {
  for (const corner of [false, true]) {
    const launch = launcher(duel('kurapika', { corner }))
    const before = until(launch, (state) => state.opponent.hitStun === 1)
    const free = defend(before, { right: true })
    expect(airRecoveryAvailable(free.opponent)).toBe(true)
    expect(free.opponent.x).toBe(before.opponent.x)
    const retreat = defend(free, { right: true })
    expect(retreat.opponent.x - free.opponent.x).toBeCloseTo(corner ? 0 : 0.4)
    expect(retreat.opponent.comboHits).toBe(0)
  }
})

it.each([false, true])(
  'bas et garde accélèrent la descente puis gardent au sol, coin %s',
  (corner) => {
    let state = until(launcher(duel('kurapika', { corner })), (value) =>
      airRecoveryAvailable(value.opponent),
    )
    const neutral = defend(state, {})
    const fast = defend(state, { down: true, guard: true })
    expect(fast.opponent.y).toBeLessThan(neutral.opponent.y)
    expect(fast.opponent.y).toBeGreaterThan(0)
    expect(fast.opponent.blocking).toBe(false)
    state = fast
    for (let f = 0; f < 20 && state.opponent.y > 0; f++)
      state = defend(state, { down: true, guard: true })
    expect(state.opponent).toMatchObject({ y: 0, blocking: true, crouching: true })
    expect(state.opponent.airRecovery).toBeUndefined()
    expect(state.opponent.wakeupInvulnerableFrames).toBe(0)
  },
)

it.each([false, true])('montre la reprise avant la riposte du défenseur, coin %s', (corner) => {
  const launch = launcher(duel('hisoka', { corner, tether: true }))
  const observe = createPursuitRecoveryCues()
  let state = tap(afterActive(launch, 10), { right: true }, 'special')
  let ready: number | undefined
  for (let frame = 0; frame < 64 && state.impact?.sequence === launch.impact?.sequence; frame++) {
    const cue = observe(state).opponent
    if (cue && ready === undefined) {
      expect(cue).toEqual({ kind: 'ready', frame: state.frame })
      expect(pursuitRecoveryPose(state.opponent)?.key).toBe('air-recovery-ready')
      ready = state.frame
      state = performMove({ state, side: 'opponent', action: 'light', input: EMPTY_INPUT })
      expect(observe(state).opponent?.kind).toBe('ready')
    }
    if (ready === undefined) expect(pursuitRecoveryPose(state.opponent)).toBeUndefined()
    state = tick(state, true)
  }
  const contact = observe(state).opponent
  expect(state.frame - ready!).toBe(4)
  expect(contact).toEqual({ kind: 'reply', frame: state.frame })
  expect(observe(launch).opponent).toBeUndefined()
})
