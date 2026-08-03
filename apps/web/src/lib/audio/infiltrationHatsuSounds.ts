import {
  blowAGust,
  chirpTheFlock,
  foldPaper,
  hissLikeASnake,
  hootAnOwl,
  landAPunch,
  selectACard,
  stretchTheGum,
  strikeAGong,
  unspoolWire,
  wakeTheMachine,
} from './hatsuSounds'
import type { InfiltrationHatsuId } from '../infiltration/hatsu'

const SOUND: Record<InfiltrationHatsuId, () => void> = {
  'little-eye': chirpTheFlock,
  'texture-surprise': foldPaper,
  'illumi-needle-people': unspoolWire,
  'secret-window': hootAnOwl,
  'biohazard-hinrigh': wakeTheMachine,
  'surveillance-paper-dolls': foldPaper,
  'bloody-mary': hissLikeASnake,
  'body-and-soul': landAPunch,
  'dowsing-chain': () => selectACard(1),
  blinky: blowAGust,
  'bungee-gum': stretchTheGum,
  'skill-hunter': () => strikeAGong(1),
  'stealth-dolphin': unspoolWire,
}

export function playInfiltrationHatsuSound(id: InfiltrationHatsuId): void {
  SOUND[id]()
}
