/**
 * What a cast at a person sounds like.
 *
 * The walk has had a voice for every cast at a room and at a solid since
 * `reportSound.ts` — and none at all for the casts that land on a body, which
 * is the half of the technique the manga draws first. Bungee Gum stuck on Machi
 * in ch. 39 is the same gesture as Bungee Gum stuck on a cabinet, and a walk
 * that made a noise for the cabinet and none for the person was saying the
 * furniture mattered more.
 *
 * Keyed on the *kind* rather than on the mark, unlike `cast/bodies.ts`, and for
 * the opposite reason: a mark is what a hold looks like and several techniques
 * share one, but a sound is whose aura it is. The chain and the thread both
 * leave a body bound and they do not sound alike.
 *
 * No voice is invented here. Every one of them is already in
 * `lib/audio/hatsuSounds.ts`, put there by the casts on the ship, and a kind
 * with nothing that fits stays silent rather than borrowing.
 */
import {
  chirpTheFlock,
  crackAWhip,
  hissLikeASnake,
  landAPunch,
  loostAnArrow,
  playATune,
  stretchTheGum,
  unspoolWire,
} from '$lib/audio/hatsuSounds'
import type { BodyKind } from './bodyKinds'
import type { Reach } from './cast'

const BODY_SOUND: Partial<Record<BodyKind, () => void>> = {
  // Hisoka's, and the reason this module exists: the filament goes out, takes
  // hold of somebody walking past, and nothing they do detaches it.
  elastic: stretchTheGum,
  // The bird that lands, lets go of what it carried and leaves again. The same
  // voice the flock has when it is called into a room: it is the same birds.
  flock: chirpTheFlock,
  'chain-bind': hissLikeASnake,
  'chain-rule': hissLikeASnake,
  stitch: unspoolWire,
  puppet: unspoolWire,
  command: unspoolWire,
  needle: unspoolWire,
  'training-shot': loostAnArrow,
  'truth-punch': landAPunch,
  'damage-transfer': landAPunch,
  curse: crackAWhip,
  'postmortem-curse': crackAWhip,
  melody: () => playATune('bloom'),
  healing: () => playATune('bloom'),
}

/**
 * Plays what the body heard, if the technique makes a sound at all.
 *
 * A refusal is silent on purpose: nothing left the visitor, so nothing sounded.
 * A reading — Dowsing Chain putting its question — is silent for the same
 * reason the panel answers it in words: the swing of the pendulum is the
 * answer, and a noise over it would announce a finding before showing it.
 */
export function playTourReachSound(reach: Reach): void {
  if (reach.outcome === 'refused' || reach.outcome === 'told') return
  BODY_SOUND[reach.kind]?.()
}
