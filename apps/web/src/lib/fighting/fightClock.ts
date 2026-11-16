/** Shared simulation constants must not depend on movesets, Hatsu or frame data. */
export const FIGHT_FPS = 60
export const FIXED_STEP = 1 / FIGHT_FPS
export const ROUND_FRAMES = 60 * FIGHT_FPS
export const INPUT_BUFFER_FRAMES = 6
