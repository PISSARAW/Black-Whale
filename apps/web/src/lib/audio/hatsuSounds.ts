/**
 * What a technique sounds like in the walk.
 *
 * The tour already had a picture for nineteen of its Hatsu and no sound for any
 * of them: an owl that perched in silence, a vacuum cleaner that swallowed a
 * table without a motor, a machine gun that fired nothing you could hear. This
 * is the missing half, and it is synthesised for the same reason the voyage
 * theme is — no megabytes, no licence, and every voice ends up behind the same
 * `muffle` node, so Three Monkeys takes the visitor's hearing of the techniques
 * exactly as it takes their hearing of the ship.
 *
 * Nothing here knows what a room is. `routes/tour/+page.svelte` reads the report
 * a cast returned and calls one of these; the loops are driven off the world,
 * because a running engine is a state and not an event.
 *
 * Eighteen hundred lines of it, all built out of the same two helpers. ADR-002
 * files them by what they are — the bench, the signature, the rooms, the music,
 * the things that run, the things that hit, the machines, the beasts — in
 * `hatsu/`. This file stays the one address the walk calls.
 */

export type { Held } from './hatsu/synth'
export type { HatsuAudioSignature } from './hatsu/signature'

export { hatsuAudioSignature, playHatsuActivationSignature } from './hatsu/signature'
export { hootAnOwl, selectACard, openAWormhole, skipThroughTime, foldPaper } from './hatsu/rooms'
export { startRequiem, stopRequiem, playATune } from './hatsu/music'
export {
  startVacuum,
  stopVacuum,
  startEngine,
  stopEngine,
  startFly,
  stopFly,
  stopEveryHatsuLoop,
} from './hatsu/loops'
export {
  blowAGust,
  landAPunch,
  raiseTheSun,
  loostAnArrow,
  unspoolWire,
  fireABurst,
  strikeAGong,
  stretchTheGum,
  crackAWhip,
} from './hatsu/impacts'
export { windTheArm } from './hatsu/charges'
export { grindThroughSpace, wakeTheMachine } from './hatsu/machines'
export { hissLikeASnake, roarLikeADragon, chirpTheFlock, crushLikeACat } from './hatsu/creatures'
export { chainRings, judgeByHeart, tearAPage } from './hatsu/chains'
