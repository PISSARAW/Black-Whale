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
  stripped: blowAGust,
  puppeted: unspoolWire,
  'puppet-released': unspoolWire,
  'autopilot-started': unspoolWire,
  stamped: () => strikeAGong(1),
  ordered: wakeTheMachine,
  marked: openAWormhole,
  detonated: () => strikeAGong(3),
  'came-up-under': landAPunch,
  'came-up-empty': landAPunch,
  'souls-swapped': loostAnArrow,
  'arrow-drawn': loostAnArrow,
  stitched: unspoolWire,
  'nothing-to-stitch': unspoolWire,
  'gum-set': stretchTheGum,
  'gum-pulled': stretchTheGum,
  'gum-trap-set': stretchTheGum,
  'gum-rebound': stretchTheGum,
  'gum-propulsion': stretchTheGum,
  'gum-healed': stretchTheGum,
  animated: wakeTheMachine,
  'crushed-one': crushLikeACat,
  'flock-loosed': chirpTheFlock,
  isolated: roarLikeADragon,
}

/** Plays only the sounds attested by the result of a cast. */
export function playTourReportSound(report: TourReport): void {
  const staticSound = STATIC_SOUND[report.kind]
  if (staticSound) return staticSound()
  switch (report.kind) {
    case 'card-blue': return selectACard(1)
    case 'card-yellow': return selectACard(2)
    case 'card-red': return selectACard(3)
    case 'stamp-locked': return selectACard(report.locked ? 2 : 1)
    case 'sun-risen': return raiseTheSun(report.metres)
    case 'volley': return fireABurst(report.hits)
    case 'sealed': return strikeAGong(report.stage)
    case 'phasing': return grindThroughSpace(report.on)
    case 'tune-played': return playATune(report.tune)
    default: return
  }
}
