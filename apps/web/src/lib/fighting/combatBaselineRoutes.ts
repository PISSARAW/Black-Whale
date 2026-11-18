import { createFightState } from './fightState'
import { prepareCombatRoute } from './combatRouteSetup'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import { packReplayInput } from './fightReplayInput'
import { trainingCanAct } from './trainingMeasurement'
import { EMPTY_INPUT, type FightState } from './types'
import type { CombatRoute } from './combatRoutes'
import type { ReplayCommand } from './fightReplayTypes'
import { BASELINE_SEED, BASELINE_TERRAINS, type BaselineTerrain } from './combatBaseline'
import { createBaselineTape } from './combatBaselineTape'
import { withKameos } from './kameos/state'
import {
  comboSupportInput,
  comboSupportLanded,
  waitingForComboSupport,
} from './kameos/comboLessons'
import { routeHitsBefore, routeStepHits, combatRouteContacts } from './combatRouteContacts'

export interface BaselineRouteOptions {
  route: CombatRoute
  terrain: BaselineTerrain
  mirrored: boolean
  corner: boolean
  gap: 4 | 6
}

export function createBaselineRoute(options: BaselineRouteOptions): FightState {
  const { route } = options
  let state = createFightState(route.fighter, route.fighter === 'chrollo' ? 'hisoka' : 'chrollo', {
    mode: 'training',
    formatId: 'knockout',
    environment: BASELINE_TERRAINS[options.terrain],
  })
  if (route.kameo) state = withKameos(state, { player: route.kameo.id })
  state = {
    ...state,
    rng: BASELINE_SEED,
    phase: 'fighting',
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 50 },
  }
  for (const side of ['player', 'opponent'] as const)
    state = setTrainingResources(state, side, {
      aura: 100,
      infiniteAura: false,
      infiniteHealth: false,
    })
  state = setTrainingDummy(prepareCombatRoute(state, route.setup), { behavior: 'manual' })
  if (route.kameo?.id === 'tubeppa')
    state = { ...state, player: { ...state.player, health: state.player.maxHealth - 40 } }
  const facing = options.mirrored ? -1 : 1
  const target = options.corner ? (options.mirrored ? 7 : 93) : 50
  return {
    ...state,
    player: { ...state.player, x: target - facing * options.gap, facing },
    opponent: { ...state.opponent, x: target, facing: facing === 1 ? (-1 as const) : (1 as const) },
  }
}

/** Records observed results; a failed conversion is a finding, never a forced hit. */
export function runBaselineRoute(options: BaselineRouteOptions) {
  const initial = createBaselineRoute(options)
  const tape = createBaselineTape(initial)
  let sent = 0
  let completionFrame: number | null = null
  for (let tick = 0; tick < 240 && completionFrame === null; tick++) {
    const commands = nextCommand({ tape, route: options.route, sent, tick })
    if (commands.length) sent++
    const player = baselineRouteInput(options.route, tape.state, {
      contacts: tape.contacts.length,
      tick,
    })
    const opponent = { ...EMPTY_INPUT, guard: tape.contacts.length > 0 }
    tape.step([1 / 60, packReplayInput(player), packReplayInput(opponent), commands])
    if (baselineRouteFinished(options.route, tape.state, tape.contacts.length))
      completionFrame = tape.state.frame
  }
  const atContact = tape.state
  for (let recovery = 0; recovery < 180 && !settled(tape.state); recovery++)
    tape.step([1 / 60, 0, packReplayInput({ ...EMPTY_INPUT, guard: true }), []])
  const result = tape.finish()
  const connected = result.measurement.contacts.map((hit) => hit.move)
  const expected = baselineRouteContacts(options.route)
  const continuous = result.measurement.contacts.every(
    (hit, index) =>
      !hit.blocked && !hit.avoided && !hit.invulnerable && hit.comboHits === index + 1,
  )
  return {
    ...result,
    route: {
      id: options.route.id,
      fighter: options.route.fighter,
      moves: options.route.moves,
      requirement: options.route.requirement,
      setup: options.route.setup ?? null,
      preparation: {
        frames: initial.frame,
        auraAfter: initial.player.aura,
        healthAfter: initial.opponent.health,
      },
      completed: routeCompleted({ completionFrame, continuous, connected, expected }),
      completionFrame,
      comboDamage: atContact.opponent.comboDamage,
      contactSeparation: Math.abs(atContact.player.x - atContact.opponent.x),
      knockdownAtContact: atContact.opponent.knockdownFrames,
      recoverySettled: settled(tape.state),
    },
  }
}

function baselineRouteInput(
  route: CombatRoute,
  state: FightState,
  timing: { contacts: number; tick: number },
) {
  const { contacts, tick } = timing
  return route.kameo
    ? comboSupportInput(state, route.kameo, contacts > 0 ? 1 : 0)
    : { ...EMPTY_INPUT, jump: route.kind === 'air' && tick === 0 }
}

function baselineRouteFinished(route: CombatRoute, state: FightState, contacts: number) {
  return (
    contacts === combatRouteContacts(route).length &&
    (!route.kameo || comboSupportLanded(state, route.kameo.id))
  )
}

function baselineRouteContacts(route: CombatRoute) {
  // The tape records projectile contacts without a melee move ID.
  return route.moves.flatMap((slot, step) =>
    Array.from({ length: routeStepHits(route, step) }, () =>
      routeStepHits(route, step) > 1 ? null : `${route.fighter}:${slot}`,
    ),
  )
}

function routeCompleted(result: {
  completionFrame: number | null
  continuous: boolean
  connected: (string | null)[]
  expected: (string | null)[]
}) {
  return (
    result.completionFrame !== null &&
    result.continuous &&
    JSON.stringify(result.connected) === JSON.stringify(result.expected)
  )
}

function settled(state: ReturnType<typeof createBaselineRoute>) {
  return (
    state.hitstop === 0 &&
    [state.player, state.opponent].every(
      (fighter) =>
        trainingCanAct(fighter) && fighter.y === 0 && fighter.wakeupInvulnerableFrames === 0,
    )
  )
}

function nextCommand(options: {
  tape: ReturnType<typeof createBaselineTape>
  route: CombatRoute
  sent: number
  tick: number
}): ReplayCommand[] {
  const { tape, route, sent, tick } = options
  if (routeHitsBefore(route, sent) !== tape.contacts.length || sent >= route.moves.length) return []
  if (waitingForComboSupport(tape.state, route, sent)) return []
  if (sent === 0 && route.kind === 'air' && tick < 27) return []
  const slot = route.moves[sent]
  const move = moveForSlot(route.fighter, slot)!
  if (!canStartFighterAttack(tape.state.player, move.kind, move.id)) return []
  return [
    {
      kind: 'move',
      side: 'player',
      action: combatRouteAction(slot),
      input: packReplayInput(combatRouteInput(slot, tape.state.player.facing)),
    },
  ]
}
