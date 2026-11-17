import { canAct } from './fightActorState'
import { chrolloHasActivePage } from './chrolloBook'
import { canStartFighterAttack } from './fighterAttacks'
import { voluntaryNenAvailable } from './nenAccess'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { packReplayInput } from './fightReplayInput'
import { EMPTY_INPUT, type FightState } from './types'
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

export function liveBookReady(state: FightState): boolean {
  const fighter = state.player
  return (
    state.phase === 'fighting' &&
    canAct(fighter) &&
    !fighter.attack &&
    voluntaryNenAvailable(fighter)
  )
}

export function liveBookMoveReady(state: FightState, action: LiveBookMove): boolean {
  if (action === 'bookmark' && !liveBookReady(state)) return false
  const move = moveForSlot('chrollo', SLOTS[action])
  return (
    state.phase === 'fighting' &&
    canAct(state.player) &&
    Boolean(
      move &&
      canUseMovesetMove(state, 'player', move) &&
      canStartFighterAttack(state.player, move.kind, move.id),
    )
  )
}

/** Same neutral/down/finisher inputs as the keyboard and gamepad, with ordinary recovery. */
export function liveBookMove(action: LiveBookMove): ReplayCommand {
  return {
    kind: 'move',
    side: 'player',
    action: action === 'secondary' ? 'finisher' : 'special',
    input: packReplayInput({ ...EMPTY_INPUT, down: action === 'bookmark' }),
  }
}

export function liveBookEffects(state: FightState, language: 'fr' | 'en'): string[] {
  const effect = state.player.chrolloHistorical ?? {}
  const target = state.opponent.hatsuEffects
  const copies =
    state.battlefield?.entities.filter(
      (entry) => entry.present && entry.copy?.owner === 'player',
    ) ?? []
  const attacking = chrolloHasActivePage(state.player, 'order-stamp')
    ? copies.filter(
        (entry) => entry.copy?.order === 'attack' && entry.copy.headAttached && entry.health > 0,
      ).length
    : 0
  const rows = [
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
      copies.length,
      `Gallery Fake · copies présentes : ${copies.length}`,
      `Gallery Fake · copies present: ${copies.length}`,
    ],
    [
      attacking,
      `Order Stamp · marionnettes à l’attaque : ${attacking}`,
      `Order Stamp · attacking puppets: ${attacking}`,
    ],
  ]
  return rows.filter((row) => Boolean(row[0])).map((row) => String(row[language === 'fr' ? 1 : 2]))
}

export function liveFishRoomCue(state: FightState, language: 'fr' | 'en'): string {
  const rooms =
    state.battlefield?.entities.filter(
      (entry) => entry.kind === 'room' && entry.present && entry.sealed,
    ) ?? []
  const room = rooms.sort(
    (a, b) => Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x),
  )[0]
  if (!room) return language === 'fr' ? 'Aucune pièce close préparée' : 'No prepared closed room'
  const arrow = room.x >= state.player.x ? '→' : '←'
  const distance = Math.abs(room.x - state.player.x).toFixed(1)
  return `${language === 'fr' ? 'Pièce close' : 'Closed room'} ${arrow} · ${distance} u`
}
