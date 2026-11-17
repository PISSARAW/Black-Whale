import { seesCombatBody } from './fightCounterplay'
import { liveGalleryContacts } from './gallerySense'
import { insideEn } from './nenPerception'
import { voluntaryNenAvailable } from './nenAccess'
import { sleepingBody } from './hanzoProjection'
import { canSpeak } from './saiyuSenses'
import { HANZO_CALL_RANGE } from './hanzoBodyCall'
import type { ArcadeFighter, FightState } from './types'

export function currentlyLocatedTarget(
  state: FightState,
): { x: number; y: number; at: number } | null {
  const body = sleepingBody(state.player)
  const observer = state.opponent
  if (seesCombatBody(observer) || (voluntaryNenAvailable(observer) && insideEn(observer, body)))
    return { x: body.x, y: body.y, at: state.frame }
  const copyContact = liveGalleryContacts(state, 'opponent').find(
    (item) =>
      item.side === 'player' &&
      item.member === (state.teamMatch?.seats.player.active ?? 0) &&
      !item.projection,
  )
  if (copyContact) return { x: copyContact.x, y: copyContact.y, at: state.frame }
  return null
}
export function knownOpponentTarget(state: FightState) {
  const live = currentlyLocatedTarget(state)
  if (live) return live
  const previous = state.opponent.observedHabits?.target
  return previous && state.frame - previous.at <= 120 ? previous : null
}
export function perceivedOpponentGap(state: FightState): number {
  const known = knownOpponentTarget(state)
  return known ? Math.abs(known.x - state.opponent.x) : Infinity
}
export function approximateTarget(state: FightState, fighter: ArcadeFighter): ArcadeFighter | null {
  const known = knownOpponentTarget({ ...state, opponent: fighter })
  if (!known) return null
  if (seesCombatBody(fighter)) return sleepingBody(state.player)
  return {
    ...fighter,
    x: known.x,
    y: known.y,
    pose: 'idle',
    attack: null,
    hanzoProjection: undefined,
  }
}
export function opponentCanAttemptCall(state: FightState): boolean {
  if (!seesCombatBody(state.opponent) || !canSpeak(state.opponent)) return false
  const body = state.player.hanzoProjection
  return Boolean(
    body && Math.hypot(state.opponent.x - body.bodyX, state.opponent.y) <= HANZO_CALL_RANGE,
  )
}
