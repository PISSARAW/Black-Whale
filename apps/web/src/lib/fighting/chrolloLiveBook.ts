import { canAct } from './fightActorState'
import { chrolloHasActivePage } from './chrolloBook'
import { canStartFighterAttack } from './fighterAttacks'
import { voluntaryNenAvailable } from './nenAccess'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { packReplayInput } from './fightReplayInput'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ReplayCommand } from './fightReplayTypes'

export type LiveBookMove = 'use' | 'bookmark' | 'secondary'
export interface LiveBookActions {
  queueAction: (action: (state: FightState) => FightState) => void
  queueCommand: (command: ReplayCommand) => void
}
const SLOTS = {
  use: 'neutralSpecial',
  bookmark: 'downSpecial',
  secondary: 'finisher',
} as const

export function liveBookReady(state: FightState, side: FightSide = 'player'): boolean {
  const fighter = state[side]
  return (
    state.phase === 'fighting' &&
    canAct(fighter) &&
    !fighter.attack &&
    voluntaryNenAvailable(fighter)
  )
}

export function liveBookMoveReady(
  state: FightState,
  action: LiveBookMove,
  side: FightSide = 'player',
): boolean {
  if (action === 'bookmark' && !liveBookReady(state, side)) return false
  const move = moveForSlot('chrollo', SLOTS[action])
  return (
    state.phase === 'fighting' &&
    canAct(state[side]) &&
    Boolean(
      move &&
      canUseMovesetMove(state, side, move) &&
      canStartFighterAttack(state[side], move.kind, move.id),
    )
  )
}

/** Same neutral/down/finisher inputs as the keyboard and gamepad, with ordinary recovery. */
export function liveBookMove(action: LiveBookMove, side: FightSide = 'player'): ReplayCommand {
  return {
    kind: 'move',
    side,
    action: action === 'secondary' ? 'finisher' : 'special',
    input: packReplayInput({ ...EMPTY_INPUT, down: action === 'bookmark' }),
  }
}

export function liveBookEffects(
  state: FightState,
  language: 'fr' | 'en',
  side: FightSide = 'player',
): string[] {
  const effect = state[side].chrolloHistorical ?? {}
  const target = state[side === 'player' ? 'opponent' : 'player'].hatsuEffects
  const { count, attacking } = liveBookCopies(state, side)
  const phone = liveBookPhone(state, side)
  const rows = [
    phone,
    [target.sunMark, 'Soleil posé', 'Sun mark applied'],
    [target.moonMark, 'Lune posée', 'Moon mark applied'],
    [
      target.manipulatedFrames > 0,
      'Black Voice · ordre de recul actif',
      'Black Voice · retreat order active',
    ],
    [
      effect.appearance,
      'Convert Hands · apparence empruntée',
      'Convert Hands · borrowed appearance',
    ],
    [effect.cloth, 'Fun Fun Cloth · cible enveloppée', 'Fun Fun Cloth · target wrapped'],
    [
      effect.fish,
      `Indoor Fish · blessures différées : ${effect.fish?.wounds ?? 0}`,
      `Indoor Fish · deferred wounds: ${effect.fish?.wounds ?? 0}`,
    ],
    [
      count,
      `Gallery Fake · copies présentes : ${count}`,
      `Gallery Fake · copies present: ${count}`,
    ],
    [
      attacking,
      `Order Stamp · marionnettes à l’attaque : ${attacking}`,
      `Order Stamp · attacking puppets: ${attacking}`,
    ],
  ]
  return rows.filter((row) => Boolean(row[0])).map((row) => String(row[language === 'fr' ? 1 : 2]))
}

function liveBookPhone(state: FightState, side: FightSide) {
  const phone = state[side].chrolloHistorical?.phone
  const calls = phone?.calls ?? 0
  const kind = phone?.guidance?.kind ?? ''
  return [
    phone?.guidance,
    `Love Dial · appels : ${calls} · ${kind}`,
    `Love Dial · calls: ${calls} · ${kind}`,
  ]
}
function liveBookCopies(state: FightState, side: FightSide) {
  const copies =
    state.battlefield?.entities.filter((entry) => entry.present && entry.copy?.owner === side) ?? []
  const attacking = chrolloHasActivePage(state[side], 'order-stamp')
    ? copies.filter(
        (entry) => entry.copy?.order === 'attack' && entry.copy.headAttached && entry.health > 0,
      ).length
    : 0
  return { count: copies.length, attacking }
}

export function liveFishRoomCue(
  state: FightState,
  language: 'fr' | 'en',
  side: FightSide = 'player',
): string {
  const rooms =
    state.battlefield?.entities.filter(
      (entry) => entry.kind === 'room' && entry.present && entry.sealed,
    ) ?? []
  const room = rooms.sort(
    (a, b) => Math.abs(a.x - state[side].x) - Math.abs(b.x - state[side].x),
  )[0]
  if (!room) return language === 'fr' ? 'Aucune pièce close préparée' : 'No prepared closed room'
  const arrow = room.x >= state[side].x ? '→' : '←'
  const distance = Math.abs(room.x - state[side].x).toFixed(1)
  return `${language === 'fr' ? 'Pièce close' : 'Closed room'} ${arrow} · ${distance} u`
}
