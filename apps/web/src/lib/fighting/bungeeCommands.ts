import { canAct } from './fightActorState'
import { newGumSource, gumSourceCommandAllowed } from './bungeeSource'
import { futureAcceptsMove } from './parallelFutureAbility'
import { ownsBungeeGum, gumLoanUsed, spendGumUse } from './bungeeAccess'
import { gumSurfaceTarget, gumTargetPoint, gumLimbPoint, selectedGumLimb } from './bungeeGeometry'
import {
  gumNetwork,
  selectedGumLink,
  ownedGumLinks,
  withGumNetwork,
  selectGumLink,
  removeGumLinks,
  moveGumLink,
} from './bungeeNetwork'
import {
  GUM_LIMBS,
  MAX_GUM_LINKS,
  GUM_ATTACH_COST,
  GUM_CAST_FRAMES,
  GUM_RECALL_COST,
  type GumTarget,
  type GumLimb,
  type GumLink,
} from './bungeeTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export const NETWORK_GUM_ACTIONS = [
  'gum-limb',
  'gum-anchor',
  'gum-object',
  'gum-select',
  'gum-detach',
  'gum-recall',
  'gum-propel',
  'gum-prepare-throw',
  'gum-rethrow',
] as const

export function performGumNetworkCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!gumCommandReady(state, side)) return state
  if (command.action === 'gum-select') return selectGumLink(state, side, Number(command.target))
  if (command.action === 'gum-limb') return chooseLimb(state, side, command.target)
  if (command.action === 'gum-detach') return detachSelectedGum(state, side)
  const movement = movementCommand(state, side, command)
  if (movement) return movement
  if (gumLoanUsed(state[side])) return state
  if (command.action === 'gum-prepare-throw') return prepareGumThrow(state, side)
  const target = commandTarget(state, side, command)
  return target ? prepareGumAttachment(state, side, target) : state
}
function detachSelectedGum(state: FightState, side: FightSide): FightState {
  const link = selectedGumLink(state, side)
  return link && gumSourceCommandAllowed(state[side], link)
    ? removeGumLinks(state, (entry) => entry.id === link.id)
    : state
}
function movementCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState | null {
  if (command.action === 'gum-rethrow') return rethrowGumObject(state, side)
  if (command.action === 'gum-recall') return startGumMotion(state, side, 'recall')
  return command.action === 'gum-propel' ? startGumMotion(state, side, 'rebound') : null
}
function rethrowGumObject(state: FightState, side: FightSide): FightState {
  const link = selectedGumLink(state, side),
    fighter = state[side]
  if (link?.target.kind !== 'projectile' || fighter.aura < 5) return state
  if (!gumSourceCommandAllowed(fighter, link)) return state
  const id = link.target.id,
    shot = state.projectiles.find((entry) => entry.id === id)
  if (shot?.gumFlight?.mode !== 'held') return state
  const point = gumLimbPoint(state, side, link.limb)
  const paid = spendGumUse(state, side, 5)
  return {
    ...paid,
    [side]: { ...paid[side], arenaRecovery: 18 },
    projectiles: paid.projectiles.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            ...point,
            age: 0,
            velocityX: fighter.facing * 68,
            velocityY: 0,
            gumFlight: { ...entry.gumFlight, mode: 'outbound', struck: false },
          }
        : entry,
    ),
  }
}
export function gumCommandReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    ownsBungeeGum(fighter) &&
    canAct(fighter) &&
    !fighter.attack &&
    !fighter.hanzoProjection &&
    futureAcceptsMove(state, side)
  )
}
function chooseLimb(state: FightState, side: FightSide, limb?: string): FightState {
  if (!GUM_LIMBS.includes(limb as GumLimb)) return state
  const network = gumNetwork(state)
  return withGumNetwork(state, { ...network, limbs: { ...network.limbs, [side]: limb as GumLimb } })
}
function commandTarget(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): GumTarget | null {
  if (command.action === 'gum-anchor') return gumSurfaceTarget(state, side, command.target ?? '')
  if (command.action !== 'gum-object') return null
  const entity = state.battlefield?.entities.find((entry) => entry.id === command.target)
  return entity && ['crate', 'needles', 'flute'].includes(entity.kind)
    ? { kind: 'entity', id: entity.id }
    : null
}
function prepareGumAttachment(state: FightState, side: FightSide, target: GumTarget): FightState {
  const network = gumNetwork(state),
    fighter = state[side]
  if (ownedGumLinks(state, side).length >= MAX_GUM_LINKS || fighter.aura < GUM_ATTACH_COST)
    return state
  const limb = selectedGumLimb(state, side)
  const point = gumTargetPoint(state, target),
    start = gumLimbPoint(state, side, limb)
  if (!point || Math.hypot(point.x - start.x, point.y - start.y) > attachmentReach(target))
    return state
  const paid = spendGumUse(state, side, GUM_ATTACH_COST)
  return withGumNetwork(
    {
      ...paid,
      [side]: {
        ...paid[side],
        arenaRecovery: GUM_CAST_FRAMES,
        blocking: false,
        bufferedAttack: null,
      },
    },
    {
      ...network,
      pending: {
        ...network.pending,
        [side]: {
          target,
          limb,
          hidden: fighter.nen.in,
          frames: GUM_CAST_FRAMES,
          ...newGumSource(fighter),
        },
      },
    },
  )
}
export function attachmentReach(target: GumTarget): number {
  return target.kind === 'surface' && target.surface === 'ceiling' ? 120 : 32
}
function prepareGumThrow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.gumThrowReady) return { ...state, [side]: { ...fighter, gumThrowReady: undefined } }
  if (
    (fighter.nenOwner ?? fighter.id) !== 'hisoka' ||
    fighter.aura < 6 ||
    ownedGumLinks(state, side).length >= MAX_GUM_LINKS
  )
    return state
  const paid = spendGumUse(state, side, 6)
  return {
    ...paid,
    [side]: {
      ...paid[side],
      arenaRecovery: 12,
      gumThrowReady: {
        limb: selectedGumLimb(state, side),
        hidden: fighter.nen.in,
        ...newGumSource(fighter),
      },
    },
  }
}
export function startGumMotion(
  state: FightState,
  side: FightSide,
  motion: 'recall' | 'rebound',
): FightState {
  const link = selectedGumLink(state, side)
  if (!link || !gumMotionReady(state, side, link)) return state
  if (motion === 'recall' && link.target.kind === 'surface') return state
  if (motion === 'rebound' && link.target.kind === 'projectile') return state
  let next = moveGumLink(spendGumUse(state, side, GUM_RECALL_COST), side, motion)
  if (motion === 'recall' && link.target.kind === 'projectile') {
    const id = link.target.id
    next = {
      ...next,
      projectiles: next.projectiles.map((shot) =>
        shot.id === id
          ? {
              ...shot,
              age: 0,
              gumFlight: {
                ...shot.gumFlight,
                mode: 'returning',
                struck: false,
                clearBeforeHit: Boolean(shot.gumFlight?.struck),
              },
            }
          : shot,
      ),
    }
  }
  return { ...next, [side]: { ...next[side], arenaRecovery: 8, blocking: false } }
}
function gumMotionReady(state: FightState, side: FightSide, link: GumLink): boolean {
  return (
    Boolean(gumTargetPoint(state, link.target)) &&
    state[side].aura >= GUM_RECALL_COST &&
    gumSourceCommandAllowed(state[side], link)
  )
}
