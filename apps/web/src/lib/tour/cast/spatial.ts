/**
 * Luini's sealed-room network.
 *
 * `visited` and `burned` are memory, not aura holds: they survive releasing the
 * technique. The anchor and destination are the live network. `transiting`
 * distinguishes a portal crossing from opening the anchor's physical door.
 */
export interface SpatialTeleportationState {
  anchorId: string | null
  destinationId: string | null
  visited: string[]
  burned: string[]
  transiting: { from: string; to: string } | null
}
