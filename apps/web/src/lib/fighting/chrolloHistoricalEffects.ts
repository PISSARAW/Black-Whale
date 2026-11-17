import { advanceHistoricalTouch } from './chrolloHistoricalTouch'
import { chrolloHasActivePage } from './chrolloBook'
import { updateEntity } from './preparationWorld'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { LUINI_ROOM_HALF_WIDTH, LUINI_ROOM_HEIGHT } from './luiniSpatial'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function releaseHistoricalCloth(state: FightState, side: FightSide): FightState {
  const stored = state[side].chrolloHistorical?.cloth
  if (!stored) return state
  let next = {
    ...state,
    [side]: {
      ...state[side],
      chrolloHistorical: { ...state[side].chrolloHistorical, cloth: undefined },
    },
  }
  if (stored.target === 'player' || stored.target === 'opponent')
    return {
      ...next,
      [stored.target]: {
        ...next[stored.target],
        clothCapture: undefined,
        x: Math.max(7, Math.min(93, state[side].x + state[side].facing * 7)),
      },
    }
  next = updateEntity(next, stored.target, {
    present: true,
    x: state[side].x + state[side].facing * 7,
  })
  return next
}

export function finishHistoricalFish(state: FightState, side: FightSide): FightState {
  const fish = state[side].chrolloHistorical?.fish
  if (!fish) return state
  let next = {
    ...state,
    [side]: {
      ...state[side],
      chrolloHistorical: { ...state[side].chrolloHistorical, fish: undefined },
    },
  }
  const target = next[fish.target]
  next = { ...next, [fish.target]: { ...target, health: Math.max(0, target.health - fish.wounds) } }
  return resolveFightOutcome(
    recordFightDeath(next, { victimSide: fish.target, killerSide: side, cause: 'strike' }),
  )
}

export function advanceHistoricalEffects(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    next = advanceHistoricalTouch(next, side)
    next = advanceFish(next, side)
    if (next[side].chrolloHistorical?.cloth && !chrolloHasActivePage(next[side], 'fun-fun-cloth'))
      next = releaseHistoricalCloth(next, side)
    next = clearInactiveAppearance(next, side)
    const capture = next[side].clothCapture
    if (capture)
      next = {
        ...next,
        [side]: {
          ...next[side],
          x: next[capture.owner].x,
          y: next[capture.owner].y + 6,
          velocityY: 0,
        },
      }
  }
  return next
}

function advanceFish(state: FightState, side: FightSide): FightState {
  const fish = state[side].chrolloHistorical?.fish
  if (!fish) return state
  const room = state.battlefield?.entities.find((entry) => entry.id === fish.roomId)
  if (!closedFishRoom(room) || !chrolloHasActivePage(state[side], 'indoor-fish'))
    return finishHistoricalFish(state, side)
  const target = state[fish.target]
  const frames = fish.frames + 1
  const inside = insideFishRoom(target, room!)
  const wounds = fish.wounds + (inside && frames % 45 === 0 ? 8 : 0)
  return {
    ...state,
    [side]: {
      ...state[side],
      chrolloHistorical: { ...state[side].chrolloHistorical, fish: { ...fish, frames, wounds } },
    },
  }
}

function clearInactiveAppearance(state: FightState, side: FightSide): FightState {
  const appearance = state[side].chrolloHistorical?.appearance
  if (!appearance || chrolloHasActivePage(state[appearance.owner], 'convert-hands')) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      chrolloHistorical: { ...state[side].chrolloHistorical, appearance: undefined },
    },
  }
}

function closedFishRoom(room?: PreparedEntity): boolean {
  return Boolean(room?.present && room.sealed)
}
function insideFishRoom(target: ArcadeFighter, room: PreparedEntity): boolean {
  return (
    Math.abs(target.x - room.x) <= LUINI_ROOM_HALF_WIDTH &&
    target.y >= room.y &&
    target.y <= room.y + LUINI_ROOM_HEIGHT
  )
}
