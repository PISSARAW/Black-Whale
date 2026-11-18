import { createCombatRouteFight, combatRouteAction, combatRouteInput } from '../combatRouteFight'
import { combatRouteContacts, routeHitsBefore } from '../combatRouteContacts'
import type { CombatRoute } from '../combatRoutes'
import { createFightMatchRuntime } from '../fightMatchRuntime'
import { canStartFighterAttack } from '../fighterAttacks'
import { canAct } from '../fightActorState'
import { packReplayInput } from '../fightReplayInput'
import { moveForSlot } from '../movesets'
import { EMPTY_INPUT, type FightState } from '../types'
import { comboSupportInput, comboSupportLanded, waitingForComboSupport } from './comboLessons'

export interface KameoComboScenario {
  corner?: boolean
  mirrored?: boolean
  /** Unfrozen simulation frames after the first hit. Zero also accepts the hitstop input. */
  callDelay?: number
  /** Unfrozen frames after the final attack is available. */
  finishDelay?: number
  response?: 'guard' | 'jab'
  supportAura?: number
}

export function createKameoComboScenario(
  route: CombatRoute,
  options: KameoComboScenario,
): FightState {
  let state = createCombatRouteFight(route)
  const facing = options.mirrored ? -1 : 1
  const x = options.corner ? (options.mirrored ? 7 : 93) : 50
  state = {
    ...state,
    player: { ...state.player, x: x - facing * 6, facing },
    opponent: { ...state.opponent, x, facing: facing === 1 ? -1 : 1 },
  }
  if (options.supportAura !== undefined && state.kameos?.player) {
    const slot = state.kameos.player
    state = {
      ...state,
      kameos: {
        ...state.kameos,
        player: { ...slot, fighter: { ...slot.fighter, aura: options.supportAura } },
      },
    }
  }
  return state
}

/** Runs real commands and input bits; never changes move data, contact results or Hatsu effects. */
export function runKameoComboScenario(route: CombatRoute, options: KameoComboScenario = {}) {
  if (!route.kameo) throw Error('support-scenario-without-kameo')
  let state = createKameoComboScenario(route, options)
  const match = createFightMatchRuntime(undefined, { record: false })
  match.begin(state)
  const progress = {
    sent: 0,
    hits: 0,
    lastImpact: 0,
    clock: 0,
    openingClock: -1,
    finalReady: -1,
    recoveredAt: -1,
    finishedAt: -1,
    supportAt: -1,
    replySentAt: -1,
    replyContactAt: -1,
    replyHitAt: -1,
    replyDamage: 0,
    blocked: false,
    continuous: true,
    contacts: [] as Array<{ frame: number; combo: number; damage: number }>,
  }
  for (let tick = 0; tick < 300; tick++) {
    state = stepScenario({ state, match, route, options, progress })
    if (scenarioFinished(progress, options)) break
  }
  return {
    id: route.id,
    ...options,
    guaranteed: guaranteed(progress) && supportInCombo(progress),
    comboGuaranteed: guaranteed(progress),
    supportInCombo: supportInCombo(progress),
    hits: progress.hits,
    firstHitAt: progress.contacts[0]?.frame ?? -1,
    supportAt: progress.supportAt,
    finishedAt: progress.finishedAt,
    defenderCanActAt: progress.recoveredAt,
    replySentAt: progress.replySentAt,
    replyContactAt: progress.replyContactAt,
    replyHitAt: progress.replyHitAt,
    replyDamage: progress.replyDamage,
    blocked: progress.blocked,
    contacts: progress.contacts,
    supportAuraAfter: state.kameos!.player!.fighter.aura,
    state,
  }
}

type Progress = {
  sent: number
  hits: number
  lastImpact: number
  clock: number
  openingClock: number
  finalReady: number
  recoveredAt: number
  finishedAt: number
  supportAt: number
  replySentAt: number
  replyContactAt: number
  replyHitAt: number
  replyDamage: number
  blocked: boolean
  continuous: boolean
  contacts: Array<{ frame: number; combo: number; damage: number }>
}

type ScenarioFrame = {
  state: FightState
  match: ReturnType<typeof createFightMatchRuntime>
  route: CombatRoute
  options: KameoComboScenario
  progress: Progress
}

function stepScenario(frame: ScenarioFrame) {
  let { state } = frame
  const { match, route, options, progress } = frame
  observeReadiness(state, progress)
  enqueueAttack({ state, match, route, options, progress })
  enqueueReply({ state, match, options, progress })
  const input =
    progress.openingClock >= 0 && progress.clock - progress.openingClock >= (options.callDelay ?? 0)
      ? comboSupportInput(state, route.kameo!, progress.hits > 0 ? 1 : 0)
      : EMPTY_INPUT
  const guarding = options.response !== 'jab' && progress.hits > 0
  state = match.advance(state, input, {
    dt: 1 / 60,
    opponentInput: { ...EMPTY_INPUT, guard: guarding },
  })
  observeContact(state, progress)
  if (progress.supportAt < 0 && comboSupportLanded(state, route.kameo!.id))
    progress.supportAt = state.frame
  if (progress.finishedAt < 0 && progress.hits === combatRouteContacts(route).length)
    progress.finishedAt = state.frame
  return state
}

function observeReadiness(state: FightState, progress: Progress) {
  if (state.hitstop) return
  progress.clock++
  if (progress.hits && progress.recoveredAt < 0 && canAct(state.opponent))
    progress.recoveredAt = state.frame
}

function enqueueAttack({ state, match, route, options, progress }: ScenarioFrame) {
  if (
    progress.sent >= route.moves.length ||
    progress.hits !== routeHitsBefore(route, progress.sent)
  )
    return
  if (waitingForComboSupport(state, route, progress.sent)) return
  const slot = route.moves[progress.sent]
  const move = moveForSlot(route.fighter, slot)!
  if (!canStartFighterAttack(state.player, move.kind, move.id)) return
  if (progress.sent === route.moves.length - 1) {
    if (progress.finalReady < 0) progress.finalReady = progress.clock
    if (progress.clock - progress.finalReady < (options.finishDelay ?? 0)) return
  }
  match.enqueue(state, {
    kind: 'move',
    side: 'player',
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state.player.facing)),
  })
  progress.sent++
}

function enqueueReply({ state, match, options, progress }: Omit<ScenarioFrame, 'route'>) {
  if (
    options.response !== 'jab' ||
    progress.recoveredAt < 0 ||
    progress.replySentAt >= 0 ||
    state.hitstop
  )
    return
  if (!canAct(state.opponent)) return
  match.enqueue(state, { kind: 'move', side: 'opponent', action: 'light', input: 0 })
  progress.replySentAt = state.frame
}

function observeContact(state: FightState, progress: Progress) {
  const impact = state.impact
  if (!impact || impact.sequence === progress.lastImpact) return
  progress.lastImpact = impact.sequence
  if (impact.attacker === 'opponent') {
    progress.replyContactAt = state.frame
    if (impact.damage > 0) progress.replyHitAt = state.frame
    progress.replyDamage = impact.damage
    return
  }
  if (rejectedSupportContact(impact)) {
    progress.blocked = true
    return
  }
  progress.hits++
  progress.continuous &&= impact.comboHits === progress.hits
  progress.contacts.push({
    frame: state.frame,
    combo: impact.comboHits ?? 0,
    damage: impact.damage,
  })
  if (progress.openingClock < 0) progress.openingClock = progress.clock
}

function guaranteed(progress: Progress) {
  return (
    progress.finishedAt >= 0 &&
    progress.continuous &&
    !progress.blocked &&
    (progress.recoveredAt < 0 || progress.recoveredAt >= progress.finishedAt)
  )
}

function scenarioFinished(progress: Progress, options: KameoComboScenario) {
  if (progress.recoveredAt < 0) return false
  if (options.response === 'jab') return progress.replyContactAt >= 0
  return (
    progress.finishedAt >= 0 || progress.blocked || progress.clock - progress.openingClock > 120
  )
}

function supportInCombo(progress: Progress) {
  return (
    progress.supportAt >= 0 && progress.finishedAt >= 0 && progress.supportAt <= progress.finishedAt
  )
}

function rejectedSupportContact(impact: NonNullable<FightState['impact']>) {
  return impact.blocked || impact.avoided || impact.invulnerable
}
