import type { HatsuInteractionKind } from '@black-whale/nen-engine'

import {
  blowAGust,
  chainRings,
  chirpTheFlock,
  coil,
  crackAWhip,
  crushLikeACat,
  curseSet,
  fireABurst,
  foldPaper,
  gnash,
  grindThroughSpace,
  hissLikeASnake,
  hootAnOwl,
  judgeByHeart,
  landAPunch,
  loostAnArrow,
  openAWormhole,
  playHatsuActivationSignature,
  raiseTheSun,
  selectACard,
  skipThroughTime,
  strikeAGong,
  stretchTheGum,
  tearAPage,
  unspoolWire,
  wakeTheMachine,
  windTheArm,
} from './hatsuSounds'

type HatsuSoundAccent = () => void

/**
 * Canon-facing accents shared by the global site and the ship map.
 *
 * The hashed activation voice still makes every ability identifiable. These
 * accents add the physical source the manga gives us: paper folds, chains
 * ring, portals grind, beasts vocalise and emitted blows displace air.
 */
export const SITE_HATSU_SOUND_BY_KIND: Partial<Record<HatsuInteractionKind, HatsuSoundAccent>> = {
  elastic: stretchTheGum,
  'chain-rule': chainRings,
  'chain-bind': chainRings,
  dowsing: chainRings,
  'heart-vow': judgeByHeart,
  surveillance: hootAnOwl,
  capture: selectACard,
  future: skipThroughTime,
  arrow: loostAnArrow,
  portal: openAWormhole,
  resurrection: crushLikeACat,
  blast: blowAGust,
  theft: tearAPage,
  bookmark: tearAPage,
  barrage: fireABurst,
  'paper-spy': foldPaper,
  shred: foldPaper,
  stitch: unspoolWire,
  impact: strikeAGong,
  'remote-strike': landAPunch,
  windup: windTheArm,
  predator: gnash,
  vacuum: wakeTheMachine,
  snakes: hissLikeASnake,
  serpent: coil,
  flock: chirpTheFlock,
  spatial: grindThroughSpace,
  'postmortem-curse': curseSet,
  'pain-armour': crackAWhip,
  'sun-flare': raiseTheSun,
}

/** Give every cast its own voice, then layer its canonical physical accent. */
export function playSiteHatsuInteraction(abilityId: string, kind: HatsuInteractionKind) {
  playHatsuActivationSignature(abilityId)
  SITE_HATSU_SOUND_BY_KIND[kind]?.()
}
