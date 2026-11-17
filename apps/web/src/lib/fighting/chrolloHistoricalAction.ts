import { performHistoricalPhone } from './chrolloHistoricalPhone'
import { performGallerySense } from './gallerySense'
import { skillHunterBookHandReady } from './historicalHands'
import { beginHistoricalTouch } from './chrolloHistoricalTouch'
import { addChrolloPage, chrolloPageForMove } from './chrolloBook'
import { historicalChrolloPage } from './chrolloHistoricalPages'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import {
  copyHistoricalObject,
  stampHistoricalPuppet,
  orderHistoricalPuppets,
} from './chrolloHistoricalObjects'
import { releaseHistoricalCloth, finishHistoricalFish } from './chrolloHistoricalEffects'
import { LUINI_ROOM_HALF_WIDTH } from './luiniSpatial'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

export function performChrolloHistoricalAction(options: AuraAttackOptions): FightState | null {
  if (options.state[options.side].id !== 'chrollo' || options.kind !== 'special') return null
  const page = chrolloPageForMove(options.state[options.side], options.moveId)
  if (!historicalChrolloPage(page) || page === 'sun-and-moon' || page === 'black-voice') return null
  return performHistoricalCommand(options.state, options.side, { action: 'history-use' })
}

export function performHistoricalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const caster = state[side]
  if (!historicalBodyAvailable(caster)) return state
  if (command.action === 'history-page') return selectHistoricalPage(state, side, command.target)
  if (command.action === 'history-release') return releaseSelected(state, side)
  if (command.action.startsWith('history-gallery-'))
    return performGallerySense(state, side, command)
  const page = chrolloPageForMove(caster)
  if (!page) return state
  return HISTORICAL_ACTIONS[page]?.(state, side, command) ?? state
}
function historicalBodyAvailable(caster: FightState['player']): boolean {
  return (
    caster.id === 'chrollo' && voluntaryNenAvailable(caster) && canAct(caster) && !caster.attack
  )
}

function selectHistoricalPage(state: FightState, side: FightSide, target?: string): FightState {
  const book = state[side].chrolloBook
  if (!book || !target || !historicalChrolloPage(target)) return state
  if (!skillHunterBookHandReady(state, side)) return state
  const next = {
    ...state,
    [side]: { ...state[side], chrolloBook: addChrolloPage(book, target), arenaRecovery: 12 },
  }
  return reconcileChrolloPages(state, next, side)
}

function releaseSelected(state: FightState, side: FightSide): FightState {
  if (state[side].chrolloHistorical?.cloth) return releaseHistoricalCloth(state, side)
  if (state[side].chrolloHistorical?.fish) return finishHistoricalFish(state, side)
  return state
}

function puppetCommand(state: FightState, side: FightSide, command: ArsenalCommand): FightState {
  if (command.action === 'history-order-wait') return orderHistoricalPuppets(state, side, 'wait')
  if (command.action === 'history-order-attack')
    return orderHistoricalPuppets(state, side, 'attack')
  return stampHistoricalPuppet(state, side, command.target)
}

function summonHistoricalFish(state: FightState, side: FightSide): FightState {
  if (state[side].chrolloHistorical?.fish || state[side].aura < 25) return state
  const other = side === 'player' ? 'opponent' : 'player'
  const room = state.battlefield?.entities.find(
    (entry) =>
      entry.kind === 'room' &&
      entry.present &&
      entry.sealed &&
      Math.abs(state[side].x - entry.x) <= LUINI_ROOM_HALF_WIDTH &&
      Math.abs(state[other].x - entry.x) <= LUINI_ROOM_HALF_WIDTH,
  )
  if (!room) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: state[side].aura - 25,
      arenaRecovery: 18,
      chrolloHistorical: {
        ...state[side].chrolloHistorical,
        fish: { roomId: room.id, target: other, wounds: 0, frames: 0 },
      },
    },
  }
}

function teleportHistoricalTarget(
  state: FightState,
  side: FightSide,
  destination?: string,
): FightState {
  const caster = state[side]
  if (caster.aura < 25) return state
  const x = destination?.startsWith('point:')
    ? Number(destination.slice(6))
    : caster.x < 50
      ? 85
      : 15
  if (!Number.isFinite(x) || x < 7 || x > 93) return state
  const other = side === 'player' ? 'opponent' : 'player'
  // Known application: relocate another person. Unknown conditions are not presented as canon.
  return {
    ...state,
    [side]: { ...caster, aura: caster.aura - 25, arenaRecovery: 18 },
    [other]: teleportBody(state, other, x),
  }
}

type HistoricalAction = (state: FightState, side: FightSide, command: ArsenalCommand) => FightState
const HISTORICAL_ACTIONS: Record<string, HistoricalAction> = {
  'love-dial-6700': performHistoricalPhone,
  'gallery-fake': (state, side, command) =>
    command.action === 'history-use' ? copyHistoricalObject(state, side, command.target) : state,
  'order-stamp': puppetCommand,
  'convert-hands': beginHistoricalTouch,
  'indoor-fish': summonHistoricalFish,
  'fun-fun-cloth': beginHistoricalTouch,
  'chrollo-teleportation': (state, side, command) =>
    teleportHistoricalTarget(state, side, command.target),
}

function teleportBody(state: FightState, side: FightSide, x: number) {
  const body = state[side]
  return body.hanzoProjection
    ? { ...body, hanzoProjection: { ...body.hanzoProjection, bodyX: x } }
    : { ...body, x, motion: undefined }
}
