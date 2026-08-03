import {
  MAX_REVERB,
  MIN_REVERB,
  hullRumble,
  impulseResponse,
  slapDelay,
} from '$lib/tour/atmosphere'

import {
  CROSSFADE,
  currentGraph,
  currentRoomKey,
  HULL_GAIN,
  HULL_SETTLE,
  setCurrentDeckElevation,
  setCurrentRoomKey,
} from './graph'

/**
 * A hash of the room's name, so its impulse response is the same every visit.
 *
 * The tail is seeded noise; seeding it on the identifier means the burial
 * chamber always answers with the burial chamber's noise rather than with
 * whatever the previous room left in the generator.
 */
function seedOf(id: string): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Puts the visitor in a room: builds its impulse response and crossfades to it.
 *
 * The two convolvers take it in turns. Assigning a buffer to the one that is
 * still sounding cuts its tail off mid-ring, which is heard as a click at every
 * doorway; assigning it to the idle one and crossfading means the corridor rings
 * out while the hall opens up, which is what walking through a door sounds like.
 */
export function enterRoom(id: string, reverb: number, wallDistance: number) {
  const g = currentGraph()
  if (!g) return
  if (id === currentRoomKey()) return
  setCurrentRoomKey(id)

  const next = g.current === 0 ? 1 : 0
  const rt60 = Math.min(MAX_REVERB, Math.max(MIN_REVERB, reverb))
  const now = g.context.currentTime

  const response = impulseResponse(rt60, g.context.sampleRate, {
    seed: seedOf(id),
    reflections: [slapDelay(wallDistance), slapDelay(wallDistance * 2.4)],
  })
  const buffer = g.context.createBuffer(1, response.length, g.context.sampleRate)
  buffer.copyToChannel(response, 0)
  g.rooms[next].convolver.buffer = buffer

  // A long tail is a bigger part of what is heard: in the hold the reflections
  // arrive before the step has finished, in a cabin they are a detail on it.
  const wet = 0.3 + Math.min(0.45, (rt60 - MIN_REVERB) * 0.18)
  g.rooms[next].gain.gain.cancelScheduledValues(now)
  g.rooms[next].gain.gain.setTargetAtTime(wet, now, CROSSFADE / 3)
  g.rooms[g.current].gain.gain.cancelScheduledValues(now)
  g.rooms[g.current].gain.gain.setTargetAtTime(0, now, CROSSFADE / 3)
  g.current = next

  g.slap.delayTime.cancelScheduledValues(now)
  g.slap.delayTime.setTargetAtTime(slapDelay(wallDistance), now, CROSSFADE / 3)
}

/**
 * Puts the visitor on a deck: how much of the machinery reaches this elevation.
 *
 * Called with the elevation of the level being walked, which for an interior is
 * the elevation of the deck it is inside — a prince's bathroom is seventy-two
 * metres up whatever the room plan is drawn at.
 *
 * Eased over `HULL_SETTLE`, which is slow on purpose and much slower than the
 * crossfade between two rooms. A lift or a stairwell is the one place on the ship
 * where a visitor changes deck, and the rumble coming up to meet them over a
 * couple of seconds is the whole cue: you hear that you are descending. Cut
 * instantly it would read as a bug in the audio, which is what every abrupt gain
 * change reads as.
 */
export function enterDeck(elevation: number) {
  // Remembered whether or not there is a graph to tell: the visitor can silence
  // the walk on Tier 5, cross half the ship, and turn it back on from a button in
  // the markup that has no idea which deck they are standing on. `startSteps`
  // reads this back, so the deck the rumble describes is the deck they are on.
  setCurrentDeckElevation(elevation)
  const g = currentGraph()
  if (!g) return
  const { level, cutoff } = hullRumble(elevation)
  const now = g.context.currentTime

  g.hull.gain.cancelScheduledValues(now)
  g.hull.gain.setTargetAtTime(level * HULL_GAIN, now, HULL_SETTLE / 3)
  g.hullDamp.frequency.cancelScheduledValues(now)
  g.hullDamp.frequency.setTargetAtTime(cutoff, now, HULL_SETTLE / 3)
}

/**
 * Where the walls are this instant, without changing rooms.
 *
 * The reverberation belongs to the room and does not move, but the first
 * reflection does: crossing a hall, the near wall goes from two metres away to
 * fifty, and the ear hears that as the room opening up around it.
 */
export function nearWall(wallDistance: number) {
  const g = currentGraph()
  if (!g) return
  const now = g.context.currentTime
  g.slap.delayTime.setTargetAtTime(slapDelay(wallDistance), now, 0.25)
}
