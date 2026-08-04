import {
  blowAGust,
  chirpTheFlock,
  crackAWhip,
  crushLikeACat,
  fireABurst,
  foldPaper,
  grindThroughSpace,
  hissLikeASnake,
  hootAnOwl,
  landAPunch,
  loostAnArrow,
  openAWormhole,
  playATune,
  raiseTheSun,
  roarLikeADragon,
  selectACard,
  skipThroughTime,
  stretchTheGum,
  strikeAGong,
  unspoolWire,
  wakeTheMachine,
  windTheArm,
} from '$lib/audio/hatsuSounds'
import type { TourReport } from './hatsu'

const STATIC_SOUND: Partial<Record<TourReport['kind'], () => void>> = {
  bound: hissLikeASnake,
  lashed: crackAWhip,
  'owl-attached': hootAnOwl,
  'owl-recalled': hootAnOwl,
  'owl-expired': hootAnOwl,
  carded: () => selectACard(1),
  'acquisition-failed': () => selectACard(1),
  'worm-set': openAWormhole,
  'worm-open': openAWormhole,
  'worm-crossed': openAWormhole,
  teleported: skipThroughTime,
  watching: foldPaper,
  // Texture Surprise, which the walk played on a body and nowhere else. The
  // layer laid over a crate and the writing repainted on a plate are the same
  // gesture as the mask going onto a face — `reachSound.ts` already picked the
  // sound of a flat thing being put down for exactly this ability — and a walk
  // that made a noise for the face and none for the room was saying the lie
  // only counted when it was worn. The plate coming off says it too: taking the
  // layer back is a thing the visitor did, and the same layer is moving.
  forged: foldPaper,
  'sign-forged': foldPaper,
  'sign-restored': foldPaper,
  // And the refusal, on the pillar and the rail, for the reason the gust and
  // the fist below keep theirs: the hand came up and the aura went out. What is
  // declined is the surface, and a key that simply did nothing would have hidden
  // the one limit the technique states about itself.
  'mask-refused': foldPaper,
  stripped: blowAGust,
  // The refusal keeps the gust: the palm came up and the air moved, and what
  // the walk declines is the second one, not the first.
  'blast-solid-refused': blowAGust,
  puppeted: unspoolWire,
  'puppet-released': unspoolWire,
  'autopilot-started': unspoolWire,
  stamped: () => strikeAGong(1),
  ordered: wakeTheMachine,
  marked: openAWormhole,
  detonated: () => strikeAGong(3),
  'came-up-under': landAPunch,
  'came-up-empty': landAPunch,
  // The refusal sounds too: the fist went into the deck and found nothing to
  // run through, which is a thing the visitor did and not a key that did nothing.
  'punch-refused': landAPunch,
  // Ripper Cyclotron, which the walk carried in complete silence: the arm
  // turned, the blow landed, and the refusal was made without a sound between
  // them. The blow and the empty swing are the same fist — an arm that had
  // nothing in it still went round, which is exactly what the refusal is about.
  launched: landAPunch,
  'not-wound': landAPunch,
  'souls-swapped': loostAnArrow,
  'arrow-drawn': loostAnArrow,
  stitched: unspoolWire,
  'nothing-to-stitch': unspoolWire,
  'solid-paired': stretchTheGum,
  'gum-set': stretchTheGum,
  'gum-reeled': stretchTheGum,
  'gum-taut': stretchTheGum,
  'gum-pulled': stretchTheGum,
  'gum-trap-set': stretchTheGum,
  'gum-rebound': stretchTheGum,
  'gum-propulsion': stretchTheGum,
  'gum-healed': stretchTheGum,
  animated: wakeTheMachine,
  'crushed-one': crushLikeACat,
  'flock-loosed': chirpTheFlock,
  // Cluck's, which the walk carried in silence: the birds converging, the birds
  // sent off again, and the bird that goes and comes back with an answer.
  'flock-gathered': chirpTheFlock,
  'flock-dispersed': chirpTheFlock,
  dispatched: chirpTheFlock,
  isolated: roarLikeADragon,
}

/** Plays only the sounds attested by the result of a cast. */
export function playTourReportSound(report: TourReport): void {
  const staticSound = STATIC_SOUND[report.kind]
  if (staticSound) return staticSound()
  switch (report.kind) {
    case 'card-blue':
      return selectACard(1)
    case 'card-yellow':
      return selectACard(2)
    case 'card-red':
      return selectACard(3)
    case 'stamp-locked':
      return selectACard(report.locked ? 2 : 1)
    case 'sun-risen':
      return raiseTheSun(report.metres)
    case 'volley':
      return fireABurst(report.hits)
    // Three techniques arrive at the same word and none of them was played.
    // What is heard is the blow that was thrown, not the breaking: the third
    // burst of ten barrels, or the fist with fifteen rotations behind it. The
    // confetti keeps its silence — paper finishing a cut is the one of the
    // three the archive gives no sound for.
    case 'shattered':
      return report.by === 'barrage'
        ? fireABurst(3)
        : report.by === 'windup'
          ? landAPunch()
          : void 0
    case 'wound-up':
      return windTheArm(report.turns)
    case 'sealed':
      return strikeAGong(report.stage)
    case 'phasing':
      return grindThroughSpace(report.on)
    case 'tune-played':
      return playATune(report.tune)
    default:
      return
  }
}
