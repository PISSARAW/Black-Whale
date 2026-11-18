import { ownsBungeeGum, gumLoanUsed, spendGumUse } from './bungeeAccess'
import { newGumSource, gumSourceCommandAllowed } from './bungeeSource'
import { gumSupportLive } from './hisokaSupportOrigin'
import { canAct } from './fightActorState'
import { physicalBodyKey } from './fightBodyIdentity'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Numerical formation cost is duel tuning. Only an actually damaged body part is replaced. */
const COST_PER_PART = 8

export function performGumProsthesisCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!canAct(actor) || actor.attack || actor.hanzoProjection) return state
  return command.action === 'gum-prosthesis-release'
    ? releaseProstheses(state, side)
    : formProstheses(state, side)
}

function releaseProstheses(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!actor.gumProstheses || !gumSourceCommandAllowed(actor, actor.gumProstheses)) return state
  return { ...state, [side]: { ...actor, gumProstheses: undefined } }
}

function formProstheses(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!ownsBungeeGum(actor) || gumLoanUsed(actor) || actor.gumProstheses) return state
  const parts = actor.bodyDamage?.parts
  if (!parts?.length || actor.aura < parts.length * COST_PER_PART) return state
  const paid = spendGumUse(state, side, parts.length * COST_PER_PART)
  const generation = (actor.gumProsthesisGeneration ?? 0) + 1
  return {
    ...paid,
    [side]: {
      ...paid[side],
      gumProsthesisGeneration: generation,
      gumProstheses: {
        ...newGumSource(actor),
        id: `gum-prostheses:${physicalBodyKey(state, side)}:${generation}`,
        hidden: actor.nen.in,
        parts: [...parts],
      },
      arenaRecovery: 24,
    },
  }
}

export function advanceGumProstheses(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side]
    const rubber = actor.gumProstheses
    if (!rubber) continue
    if (gumSupportLive(next, side, rubber)) continue
    next = { ...next, [side]: { ...actor, gumProstheses: undefined } }
  }
  return next
}
