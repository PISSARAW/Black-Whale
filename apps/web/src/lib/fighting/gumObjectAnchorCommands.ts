import { canAct } from './fightActorState'
import { ownsBungeeGum, spendGumUse } from './hisokaArsenal'
import { equippedDolphin } from './dolphinBorrowing'
import { gumAnchorNenAvailable, gumAnchorCommandScope } from './gumObjectAnchorAccess'
import { canAttachGumObject, gumObjectAnchors, newGumObjectAnchor } from './gumObjectAnchors'
import type { GumObjectAnchor } from './gumObjectAnchors'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performGumObjectAnchorCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!anchorBodyReady(actor)) return state
  if (command.action === 'gum-anchor-attach') return attachObject(state, side, command.target)
  const anchor = gumObjectAnchors(actor).find((item) => item.objectId === command.target)
  if (!anchor || !gumAnchorCommandScope(actor, anchor)) return state
  if (command.action === 'gum-anchor-release')
    return writeAnchors(
      state,
      side,
      gumObjectAnchors(actor).filter((item) => item !== anchor),
    )
  if (!gumAnchorNenAvailable(actor, anchor)) return state
  const pull = commandPull(command.action)
  if (pull === null || pull === anchor.pull) return state
  return writeAnchors(
    state,
    side,
    gumObjectAnchors(actor).map((item) => (item === anchor ? { ...item, pull } : item)),
  )
}
function anchorBodyReady(actor: FightState['player']): boolean {
  return canAct(actor) && !actor.attack && !actor.hanzoProjection && !actor.arenaRecovery
}
function commandPull(action: string): GumObjectAnchor['pull'] | null {
  if (action === 'gum-anchor-self') return 'self'
  if (action === 'gum-anchor-object') return 'object'
  return action === 'gum-anchor-stop' ? 'none' : null
}
function attachObject(state: FightState, side: FightSide, target?: string): FightState {
  const actor = state[side]
  if (!target || actor.aura < 12 || !canAttachGumObject(state, side, target)) return state
  if (!ownsBungeeGum(actor) || borrowedUseSpent(actor)) return state
  const paid = spendGumUse(state, side, 12)
  return {
    ...paid,
    [side]: {
      ...paid[side],
      arenaRecovery: 18,
      blocking: false,
      gumObjectAnchors: [...gumObjectAnchors(actor), newGumObjectAnchor(actor, target)],
    },
  }
}
function borrowedUseSpent(actor: FightState['player']): boolean {
  return Boolean(actor.dolphinExecution && equippedDolphin(actor)?.used)
}
function writeAnchors(
  state: FightState,
  side: FightSide,
  anchors: readonly GumObjectAnchor[],
): FightState {
  return {
    ...state,
    [side]: { ...state[side], gumObjectAnchors: anchors.length ? anchors : undefined },
  }
}
