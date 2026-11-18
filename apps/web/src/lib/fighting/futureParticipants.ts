import type { FightSide, FightState, ArcadeFighter, FighterId } from './types'

/** Identity of a material combat body, stable across local P1/P2 view swaps. */
export function futureBodyKey(state: FightState, side: FightSide): string {
  const actor = state[side]
  if (actor.halkSoul) return actor.halkSoul.key
  if (state.rosterProjection?.owner === side) return `guest:${state.rosterProjection.guestId}`
  return `main:${actor.id}:${actor.halkenburgTransferFrame ?? 0}:${state.teamMatch?.seats[side].active ?? 0}`
}
export function captureFutureParticipants(
  state: FightState,
  owner: FightSide,
  area: { x: number; y: number; radius: number },
): { participants: FighterId[]; participantBodies: string[] } {
  const other = owner === 'player' ? 'opponent' : 'player'
  const candidates = [
    { body: state[other], key: futureBodyKey(state, other) },
    ...(state.rosterGuests ?? [])
      .filter((guest) => guest.owner === other && guest.phase !== 'eliminated')
      .map((guest) => ({
        body: guest.fighter,
        key: guest.fighter.halkSoul?.key ?? `guest:${guest.id}`,
      })),
  ].filter(({ body }) => liveInside(body, area))
  return {
    participants: candidates.map(({ body }) => body.id),
    participantBodies: candidates.map(({ key }) => key),
  }
}
function liveInside(body: ArcadeFighter, area: { x: number; y: number; radius: number }): boolean {
  return body.health > 0 && Math.hypot(body.x - area.x, body.y - area.y) <= area.radius
}
