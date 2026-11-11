/**
 * The visitor's eye: its height, how it turns, and how far it sees.
 *
 * Moved out of `TourScene.svelte` unchanged. These are the walk's optics, read
 * by the scene every frame, and they are constants with an argument each.
 */
/**
 * How high the visitor's eye is off the floor.
 *
 * `HORIZON` in `$lib/tour/mesh` is the same number and has to stay it: the sea
 * is cut into the two panes at the height the eye looking through them meets
 * the horizon, and the pane is baked once while this is read every frame.
 */
export const EYE_HEIGHT = 1.7
/** Radians of yaw per pixel of pointer movement, before the visitor's own multiplier. */
export const LOOK_SENSITIVITY = 0.0022
export const MAX_PITCH = Math.PI / 2 - 0.05

/**
 * How far the camera sees, in metres.
 *
 * Once the air started being read off the room — see `fogDensityOf` — one
 * number stopped being able to do this. A cabin fogs at arm's length and a
 * hall is drawn nearly clear, and at the thinnest air the ship holds a surface
 * 130 m off still shows two fifths of itself: the far plane was cutting the far
 * wall of the largest rooms out of the picture, and the fog was not hiding the
 * cut. It is the biggest room on board that sets this, not the fog — the King's
 * living room is 193 m across, and you can stand at one end of it.
 *
 * The cost of the extra range is depth precision and nothing else: what is
 * drawn is decided by `visibleSpaces`, room by room, not by this plane.
 */
export const VIEW_DISTANCE = 220

/**
 * How close, in metres.
 *
 * Raised with the far plane rather than left alone. A depth buffer is spread by
 * the *ratio* of the two, so pushing the far plane out at an unchanged near
 * plane is what makes two surfaces a few centimetres apart start fighting —
 * which on this deck is every wall line, every plate seam and every window pane,
 * all of them deliberately offset by three centimetres or less.
 *
 * Fifteen centimetres is closer than anything can be got to: the visitor is
 * stopped `VISITOR_RADIUS` from every wall, which is 40 cm.
 */
export const NEAR_PLANE = 0.15

/** A finger that moved less than this, in pixels, was a tap and not a drag. */
export const TAP_SLOP = 12
