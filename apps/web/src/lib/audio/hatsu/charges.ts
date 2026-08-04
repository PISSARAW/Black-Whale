import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

// ── The aura gathered, rather than spent ─────────────────────────────────
//
// `impacts.ts` next door is the things that happen: a fist arrives, a gong is
// struck, the burst is over. What is here is the other half of the same
// gesture — aura being wound up and held, where the sound has to say how much
// is in there rather than that something just landed.

/**
 * Ripper Cyclotron, one turn of the arm.
 *
 * The wind-up is the whole of this ability's stated cost — visible wind-up
 * time, and nothing else — so it is the one thing the walk owed a sound: a turn
 * of air, and the next one tighter and brighter than the last. What rises with
 * the count is the pitch of the swirl and the load under it, and nothing else:
 * ch. 92 gives fifteen rotations and what fifteen did to a body, not a curve,
 * so the sound climbs towards the figure it has and asserts no shape between
 * one turn and the next.
 */
export function windTheArm(turns = 1) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  // Towards ch. 92's fifteen, and no further: the arm can be turned past the
  // figure, and the sound stops climbing where the archive stops counting.
  const wound = Math.min(1, Math.max(1, turns) / 15)

  // The air the arm drags round with it.
  rush(g, at, {
    duration: 0.34,
    peak: 0.08 + wound * 0.06,
    type: 'bandpass',
    cutoff: 380 + wound * 900,
    sweepTo: 1500 + wound * 2400,
    q: 1.4,
    attack: 0.06,
    release: 0.22,
    send: 0.35,
  })
  // The load underneath it, which is what the next punch will be carrying.
  swept(g, at + 0.04, {
    duration: 0.26,
    type: 'triangle',
    from: 58 + wound * 26,
    to: 96 + wound * 78,
    peak: 0.07 + wound * 0.05,
    attack: 0.03,
    release: 0.24,
  })
}
