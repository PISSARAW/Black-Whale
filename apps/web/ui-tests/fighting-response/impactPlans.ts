import {
  createCombatRouteFight,
  combatRouteAction,
  combatRouteInput,
} from '$lib/fighting/combatRouteFight'
import type { CombatRoute } from '$lib/fighting/combatRoutes'
import { canStartFighterAttack } from '$lib/fighting/fighterAttacks'
import { moveForSlot } from '$lib/fighting/movesets'
import { tickFight } from '$lib/fighting/engine'
import { applyPvpCommand } from '$lib/fighting/pvp/commands'
import { packReplayInput, unpackReplayInput } from '$lib/fighting/fightReplayInput'
import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'
import { guardInput, mirrorNetworkFight, type ImpactIntent } from './impactNetworkLab'
import { createCombatSchool } from '$lib/fighting/combatSchool'
import type { CombatFighter } from '$lib/fighting/combatRoutes'
import type { PvpCommand } from '$lib/fighting/pvp/types'

function routeCommand(options: {
  route: CombatRoute
  state: FightState
  index: number
  frame: number
}): PvpCommand | null {
  const { route, state, index, frame } = options
  if (route.kind === 'air' && frame < 27) return null
  const slot = route.moves[index]
  const move = moveForSlot(route.fighter, slot)!
  if (!canStartFighterAttack(state.player, move.kind, move.id)) return null
  if (index > 0 && (state.opponent.comboHits !== index || state.opponent.hitStun === 0)) return null
  return {
    kind: 'move',
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state.player.facing)),
  }
}
function punishReady(state: FightState, blocked: boolean) {
  return blocked && state.hitstop === 0 && state.player.blockStun <= 6
}

/** A timed human-executable input trace. Only intentions go to the server;
 * the transport is never given the expected contact, a client tick or a verdict. */
export function comboImpactPlan(route: CombatRoute, side: FightSide) {
  const initial = {
    ...createCombatRouteFight(route),
    mode: 'versus-local' as const,
    training: undefined,
  }
  let state: FightState = initial
  let index = 0,
    firstHit = Infinity,
    lastImpact = 0
  const intents: ImpactIntent[] = []
  const jump = packReplayInput({ ...EMPTY_INPUT, jump: true })
  const inputs = (frame: number, owner: FightSide) =>
    owner === side
      ? route.kind === 'air' && frame < 4
        ? jump
        : 0
      : frame > firstHit + 3
        ? guardInput
        : 0
  for (let frame = 0; frame < 180 && index < route.moves.length; frame++) {
    const command = routeCommand({ route, state, index, frame })
    if (command) {
      state = applyPvpCommand(state, 'player', command)
      intents.push({ frame, side, command })
      index++
    }
    state = tickFight(state, unpackReplayInput(inputs(frame, side)), {
      dt: 1 / 60,
      ai: false,
      opponentInput: unpackReplayInput(inputs(frame, side === 'player' ? 'opponent' : 'player')),
    })
    if (state.impact && state.impact.sequence !== lastImpact) {
      lastImpact = state.impact.sequence
      firstHit = Math.min(firstHit, frame)
    }
  }
  return { initial: mirrorNetworkFight(initial, side), intents, inputs }
}

export function defenseImpactPlan(fighter: CombatFighter, side: FightSide) {
  const school = createCombatSchool()
  const start = school.start(`${fighter}:defense`)
  const initial = { ...start, mode: 'versus-local' as const, training: undefined }
  let state: FightState = initial
  let punished = false,
    blocked = false,
    releaseAt = Infinity
  const other = side === 'player' ? 'opponent' : 'player'
  const intents: ImpactIntent[] = [
    { frame: 30, side: other, command: { kind: 'move', action: 'heavy', input: 0 } },
  ]
  const inputs = (frame: number, owner: FightSide) =>
    owner === side && frame < releaseAt ? guardInput : 0
  for (let frame = 0; frame < 160 && !punished; frame++) {
    if (frame === 30) state = applyPvpCommand(state, 'opponent', intents[0].command)
    if (punishReady(state, blocked)) {
      releaseAt = frame
      const command = { kind: 'move' as const, action: 'light' as const, input: 0 }
      intents.push({ frame, side, command })
      state = applyPvpCommand(state, 'player', command)
      punished = true
    }
    state = tickFight(state, unpackReplayInput(inputs(frame, side)), {
      dt: 1 / 60,
      ai: false,
      opponentInput: EMPTY_INPUT,
    })
    if (state.impact?.attacker === 'opponent' && state.impact.blocked) blocked = true
  }
  return { initial: mirrorNetworkFight(initial, side), intents, inputs }
}
