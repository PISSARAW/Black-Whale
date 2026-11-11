/** Common residential programme requested for the other queens, extrapolated from Unma. */
export const QUEEN_APARTMENT_ROOMS = Array.from(
  { length: 7 },
  (_, index) => `tier-1-queens-living-quarters-room-0${index + 2}`,
)
export const QUEEN_DUAZUL_ROOM = QUEEN_APARTMENT_ROOMS[0]

export function isQueenApartment(spaceId: string): boolean {
  return QUEEN_APARTMENT_ROOMS.includes(spaceId)
}
