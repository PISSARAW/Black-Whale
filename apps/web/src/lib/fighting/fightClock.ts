/** Shared simulation constants must not depend on movesets, Hatsu or frame data. */
export const FIGHT_FPS = 60
export const FIXED_STEP = 1 / FIGHT_FPS
export const ROUND_FRAMES = 60 * FIGHT_FPS
/**
 * Input buffer for cancels and links (COMBO_GRAMMAR.md): Street Fighter uses about four
 * frames, which is enough once cancels read the active window / hitstop directly.
 */
export const INPUT_BUFFER_FRAMES = 4
