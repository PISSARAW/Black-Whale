import { chrolloHasActivePage } from './chrolloBook'
import { hatsuSourceFor } from './hatsu'
import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightSide, FightState } from './types'
import { doorFramesFor } from './voconteDoorSites'
import type { DoorFrame, DoorPositions, DoorTransit } from './voconteDoorTypes'

export { DOOR_FRAMES, doorFramesFor } from './voconteDoorSites'

export const DOOR_SETUP_FRAMES = 18
export const DOOR_SETUP_AURA = 20
export const DOOR_MOVE = 'voconte:neutralSpecial'
const SIDES: readonly FightSide[] = ['player', 'opponent']

export function doorNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter, { requireReserve: true }) &&
    !chainAbilitySealed(fighter, DOOR_MOVE) &&
    ownsDoor(fighter)
  )
}

function ownsDoor(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'voconte')
  if (fighter.kurapika?.held?.used && fighter.kurapika.held.source === 'voconte') return true
  return hatsuSourceFor(fighter) === 'voconte'
}

export function voconteUtilityCast(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && fighter.attack.hatsuSource === 'voconte'
}

export function doorBodyPositions(state: FightState): DoorPositions {
  const body = (fighter: ArcadeFighter) =>
    fighter.hanzoProjection
      ? { x: fighter.hanzoProjection.bodyX, y: 0 }
      : { x: fighter.x, y: fighter.y }
  return { player: body(state.player), opponent: body(state.opponent) }
}

/** Inspect the actual swept body path. A button press, standing still or reverse crossing does nothing. */
export function crossedDoor(
  from: { x: number; y: number },
  to: { x: number; y: number },
  frame: DoorFrame,
): boolean {
  const before = (from.x - frame.x) * frame.direction
  const after = (to.x - frame.x) * frame.direction
  if (before > 0 || after < 0 || after <= before) return false
  const ratio = Math.max(0, Math.min(1, (frame.x - from.x) / (to.x - from.x)))
  const feet = from.y + (to.y - from.y) * ratio
  return feet >= 0 && feet + 10 <= 14
}

/** Called once before collisions by the Hatsu registry. */
export function advanceVoconteDoors(state: FightState): FightState {
  if (!state.voconteDoors) return state
  let next = state
  for (const side of SIDES) next = advanceNetwork(next, side)
  return transportDoorBodies(next)
}

function advanceNetwork(state: FightState, side: FightSide): FightState {
  const doors = state.voconteDoors!
  const network = doors.networks[side]
  if (!network) return state
  if (!doorNenAvailable(state[side]))
    return {
      ...state,
      voconteDoors: { ...doors, networks: { ...doors.networks, [side]: undefined } },
    }
  if (!network.pending) return state
  const attack = state[side].attack
  if (!voconteUtilityCast(state[side]))
    return {
      ...state,
      voconteDoors: {
        ...doors,
        networks: { ...doors.networks, [side]: { active: network.active } },
      },
    }
  if (attack!.frame < DOOR_SETUP_FRAMES) return state
  return {
    ...state,
    voconteDoors: {
      ...doors,
      networks: { ...doors.networks, [side]: { active: network.pending.open } },
    },
  }
}

export function transportDoorBodies(state: FightState): FightState {
  if (!state.voconteDoors?.origins) return state
  let next = state
  for (const side of SIDES) next = transportBody(next, side)
  return { ...next, voconteDoors: { ...next.voconteDoors!, origins: doorBodyPositions(next) } }
}

function transportBody(state: FightState, side: FightSide): FightState {
  const doors = state.voconteDoors!
  const fighter = state[side]
  if (doors.transported.includes(side) || fighter.hanzoProjection || fighter.health <= 0)
    return state
  const crossing = crossedDoorNetwork(state, { from: doors.origins![side], to: fighter })
  if (!crossing) return state
  const { owner, frame, exit } = crossing
  const transit: DoorTransit = { from: frame.id, to: exit.id, owner, frame: state.frame }
  return {
    ...state,
    [side]: {
      ...fighter,
      x: exit.x + 2,
      y: 0,
      velocityY: 0,
      motion: undefined,
      facing: exit.arrivalFacing,
    },
    voconteDoors: {
      ...doors,
      transported: [...doors.transported, side],
      lastTransit: { ...doors.lastTransit, [side]: transit },
    },
  }
}

export interface DoorCrossing {
  owner: FightSide
  frame: DoorFrame
  exit: DoorFrame
}

/** The first open network whose own chosen frames the swept path really crosses. */
export function crossedDoorNetwork(
  state: FightState,
  path: { from: { x: number; y: number }; to: { x: number; y: number } },
): DoorCrossing | null {
  for (const owner of SIDES) {
    if (!state.voconteDoors?.networks[owner]?.active || !doorNenAvailable(state[owner])) continue
    const frames = doorFramesFor(state, owner)
    const frame = frames.find((entry) => crossedDoor(path.from, path.to, entry))
    if (frame) return { owner, frame, exit: frames.find((e) => e.id === frame.destination)! }
  }
  return null
}

export function doorFramesVisible(state: FightState): boolean {
  return (
    Boolean(state.voconteDoors) ||
    SIDES.some((side) => state[side].id === 'voconte' || ownsDoor(state[side]))
  )
}
