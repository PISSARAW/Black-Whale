/**
 * The sound of the walk: footsteps, the room answering them, and the hull under
 * all of it.
 *
 * Nothing here is a recording. The steps are synthesised the way the voyage
 * theme is — see `$lib/audio/ambient` — and the room is a convolution
 * reverberation whose impulse response is computed from the volume
 * `data/ship/blueprint.json` already gives, by Sabine's equation, in
 * `$lib/tour/atmosphere`. The whole feature adds no asset to the page, no
 * triangle to the deck and no field to the blueprint.
 *
 * It is also the only part of the reconstruction that tells the visitor the size
 * of a room without their having to walk its length: the ear sizes a space from
 * the first reflection off the walls, and it does it in one footstep. A cabin and
 * the hold differ here by a factor of about six in reverberation time, which is
 * not a subtlety — it is the difference between a slap and a rumble.
 *
 * The hull is here rather than in `$lib/audio/ambient` for the same reason the
 * footsteps are. The voyage theme is a soundtrack over the archive, off until
 * someone asks for it; the machinery is a thing aboard the ship, and it belongs to
 * whatever else the walk makes audible — one `AudioContext`, one toggle, and the
 * same lowpass when a technique seals hearing. See `hullRumble` for what it is
 * keyed to, which is the deck's own elevation.
 *
 * ADR-002 files the four jobs separately — the graph and the state that outlives
 * it, the room and the deck, the voices, the button — in `steps/`. The walk
 * still calls this file, and calls it a great deal: it is the hot path.
 */

export { enterDeck, enterRoom, nearWall } from './steps/rooms'
export { footstep, rewindSound } from './steps/voices'
export { setStepsAuraQuiet, setStepsMuffled } from './steps/graph'
export { startSteps, stepsPlaying, stepsWereSilenced, stopSteps, toggleSteps } from './steps/toggle'
