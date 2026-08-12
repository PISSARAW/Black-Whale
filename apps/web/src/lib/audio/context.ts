/**
 * The one AudioContext the ship has.
 *
 * There used to be two. `ambient/mixer.ts` opened one for the theme and for
 * every Hatsu voice, `steps/graph.ts` opened another for the footsteps and the
 * room answering them, and nothing could cross between them: a gong struck in
 * the hold and the same gong struck in a cabin were the same sound, because the
 * convolution that makes a room a room lived in the other context and a node
 * cannot be connected across two. The walk was reconstructing the acoustics of
 * five thousand rooms and applying them to the boots alone.
 *
 * So the context is here, above both, and neither owns it. That is the whole of
 * what this file does — the mixing is `output.ts`, the placing is `space.ts`.
 *
 * It is never closed. Silencing the walk used to close its context a second
 * later, which was correct when the context was the walk's; now the theme, the
 * techniques and the room all share it, and closing it under them would take
 * the ship's whole voice away because somebody pressed the footsteps button. A
 * suspended context costs nothing measurable; a closed one cannot be reopened.
 */

let shared: AudioContext | null = null

/** Set once the browser has told us it has no Web Audio, so we stop asking. */
let unavailable = false

type Windowed = { webkitAudioContext?: typeof AudioContext }

/**
 * The shared context, or null where there is none.
 *
 * Null on the server, and null in a browser without Web Audio: every caller
 * treats that as "the ship is silent", which is the one failure mode the audio
 * layer is allowed to have. Nothing here throws.
 */
export function sharedAudioContext(): AudioContext | null {
  if (shared) return shared
  if (unavailable || typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as Windowed).webkitAudioContext
  if (!Ctor) {
    unavailable = true
    return null
  }
  try {
    shared = new Ctor()
  } catch {
    unavailable = true
    return null
  }
  return shared
}

/**
 * Wakes the context, which a browser hands back suspended until a gesture.
 *
 * Called from the gestures that start sound — engaging the walk, the theme
 * button, a cast — so it always has the permission it needs.
 */
export function resumeSharedContext(): void {
  if (shared && shared.state === 'suspended') void shared.resume()
}
