import {
  blowAGust,
  chainRings,
  chirpTheFlock,
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
  playATune,
  raiseTheSun,
  roarLikeADragon,
  selectACard,
  skipThroughTime,
  stretchTheGum,
  strikeAGong,
  swarm,
  tearAPage,
  unspoolWire,
  wakeTheMachine,
  windTheArm,
} from '$lib/audio/hatsuSounds'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { Graph } from '$lib/audio/ambient/mixer'
import { FIGHTER_SOUNDS, type HatsuVoice } from './profiles'
import type { FightSoundEvent } from './events'
import {
  bodyDance,
  growingFibres,
  healingChain,
  needleCast,
  radioOrder,
  readAura,
  sunMoonMarks,
  vacuumIntake,
} from './techniques'

/** Existing site recipes retain their material identity in the combat mix. */
export const HATSU_RECIPES: Readonly<Record<HatsuVoice, () => void>> = {
  chain: chainRings,
  gum: stretchTheGum,
  book: tearAPage,
  military: blowAGust,
  future: skipThroughTime,
  sun: raiseTheSun,
  gong: strikeAGong,
  shot: () => fireABurst(2),
  transform: landAPunch,
  cyclotron: windTheArm,
  barrage: () => fireABurst(2),
  thread: unspoolWire,
  needle: needleCast,
  paper: foldPaper,
  dance: bodyDance,
  vacuum: vacuumIntake,
  machine: wakeTheMachine,
  verdict: selectACard,
  remote: landAPunch,
  shadow: skipThroughTime,
  predator: gnash,
  blood: swarm,
  flute: () => playATune('scatter'),
  poem: foldPaper,
  cat: crushLikeACat,
  arrow: loostAnArrow,
  snake: hissLikeASnake,
  interrogate: landAPunch,
  portal: grindThroughSpace,
  growth: growingFibres,
  read: readAura,
  birds: chirpTheFlock,
  dragon: roarLikeADragon,
  contract: tearAPage,
  owl: hootAnOwl,
  blade: crackAWhip,
  transfer: curseSet,
  door: openAWormhole,
  guards: wakeTheMachine,
  contagion: swarm,
  spirit: curseSet,
  smoke: blowAGust,
  coin: chainRings,
}

const KURAPIKA_MOVES: Record<string, () => void> = {
  'kurapika:neutralSpecial': chainRings,
  'kurapika:forwardSpecial': crackAWhip,
  'kurapika:downSpecial': healingChain,
  'kurapika:backSpecial': chainRings,
  'kurapika:finisher': judgeByHeart,
}

const BENJAMIN_MOVES: Record<string, () => void> = {
  'benjamin:neutralSpecial': blowAGust,
  'benjamin:forwardSpecial': hootAnOwl,
  'benjamin:downSpecial': () => selectACard(1),
  'benjamin:finisher': () => selectACard(3),
}

export function playFightHatsu(g: Graph, event: FightSoundEvent): void {
  const source = event.source ?? event.fighter ?? 'kurapika'
  const recipe = moveRecipe({ ...event, source })
  if (!recipe) return
  recipe()
  const profile = FIGHTER_SOUNDS[source]
  // A quiet two-note tag gives shared materials the character's authored intervals.
  const at = startsAt(g)
  for (const [index, interval] of profile.motif.slice(0, 2).entries())
    swept(g, at + index * profile.pace, {
      type: 'sine',
      from: profile.root * 2 ** (interval / 12),
      peak: 0.018,
      duration: 0.045,
      release: 0.13,
      attack: 0.012,
    })
  if (profile.hatsu === 'poem')
    rush(g, startsAt(g) + 0.12, {
      peak: 0.09,
      cutoff: 700,
      sweepTo: 2400,
      duration: 0.4,
      attack: 0.08,
      release: 0.25,
    })
  if (profile.hatsu === 'blood')
    swept(g, startsAt(g), {
      type: 'sine',
      from: 80,
      to: 36,
      peak: 0.09,
      duration: 0.2,
      release: 0.2,
    })
}

function moveRecipe(event: FightSoundEvent): (() => void) | null {
  const source = event.source ?? 'kurapika'
  if (source === 'feitan') return null
  if (source === 'biscuit' && event.moveId === 'biscuit:neutralSpecial') return null
  if (source === 'phinks') return event.value ? () => windTheArm(event.value) : null
  if (source === 'franklin') return null // The actual projectiles own each gunshot.
  if (source === 'saiyu') return null // A gong seals a sense on contact, not on a miss.
  return characterRecipe(event)
}

function characterRecipe(event: FightSoundEvent): () => void {
  const source = event.source ?? 'kurapika'
  if (source === 'hisoka' && event.slot === 'downSpecial') return foldPaper
  if (event.page === 'black-voice') return radioOrder
  if (event.page === 'sun-and-moon') return sunMoonMarks
  const moves: Record<string, Record<string, () => void>> = {
    kurapika: KURAPIKA_MOVES,
    benjamin: BENJAMIN_MOVES,
  }
  const recipe = moves[source]?.[event.moveId ?? '']
  return recipe ?? HATSU_RECIPES[FIGHTER_SOUNDS[source].hatsu]
}
