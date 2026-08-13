/**
 * Turning a place on the ship into a place in the visitor's head.
 *
 * The Web Audio listener is left where the browser puts it — at the origin,
 * facing −z, with +y up — and every source is placed *relative to the ear*
 * instead. That was already the convention in `./space`, which is why a cast is
 * panned correctly without anything ever calling `AudioListener.setOrientation`;
 * what was missing is that the rotation stopped at the yaw. The walk has always
 * had a pitch — a visitor can look at the ceiling of the hold or over the rail
 * of a promenade — and the ear was told none of it, so a sound overhead and a
 * sound underfoot were the same sound.
 *
 * They are one function because they are one convention, and a convention that
 * lives in two files drifts. `./space` places the casts with it and
 * `./steps/environment` places the machinery and the water with it.
 */

/** A point relative to the visitor, in the ship's own axes: +y is up. */
export interface Offset {
  /** Fore and aft, in the blueprint's x — the bow is at −x. */
  x: number
  /** Up, in metres. */
  y: number
  /** Athwartships, in the blueprint's z. */
  z: number
}

/** Which way the visitor is facing: the walk's yaw, and its pitch. */
export interface Facing {
  heading: number
  /** Radians, positive looking up — the sign `TourScene` gives `camera.rotateX`. */
  pitch: number
}

/**
 * A ship offset in head-local coordinates: x to the right, +y up, −z ahead.
 *
 * Two rotations, in the order the camera applies them. The yaw first, because
 * the walk's forward is (−sin, −cos) and its right is (cos, −sin) — that pair is
 * written down rather than guessed, in `$lib/tour/hatsu`, which walks the same
 * vector to decide what a cast can reach. Then the pitch about the head's own
 * x axis, which is what moves a source overhead to behind-and-overhead when the
 * visitor tips their chin up.
 *
 * The listener is the origin of this frame, so nothing here needs to know where
 * on the deck they are standing: the caller has already subtracted that.
 */
export function earLocal(offset: Offset, facing: Facing): Offset {
  const sinYaw = Math.sin(facing.heading)
  const cosYaw = Math.cos(facing.heading)
  const x = offset.x * cosYaw - offset.z * sinYaw
  const forward = offset.x * sinYaw + offset.z * cosYaw

  const sinPitch = Math.sin(facing.pitch)
  const cosPitch = Math.cos(facing.pitch)
  return {
    x,
    y: offset.y * cosPitch + forward * sinPitch,
    z: -offset.y * sinPitch + forward * cosPitch,
  }
}

/**
 * The same offset, pulled onto a sphere of `radius` metres about the ear.
 *
 * Direction is the whole of what a panner is asked for here, and the distance
 * is a lie the mix is better off telling: the water is ninety-six metres under
 * the King's floor and the engines a hundred and thirty-four, and a panner left
 * to attenuate that honestly would put both below the noise floor — after the
 * curves in `$lib/tour/sea` and `$lib/tour/atmosphere` had already decided how
 * loud each should be. Dosing twice is dosing wrong. So the level is theirs and
 * the direction is the panner's, and the two never touch.
 *
 * An offset of nothing at all — the visitor standing exactly on the waterline —
 * comes back as nothing, and the caller leaves the panner where it was rather
 * than pointing it at an arbitrary direction chosen by a division by zero.
 */
export function onSphere(offset: Offset, radius: number): Offset | null {
  const away = Math.hypot(offset.x, offset.y, offset.z)
  if (!(away > 1e-6)) return null
  const scale = radius / away
  return { x: offset.x * scale, y: offset.y * scale, z: offset.z * scale }
}
