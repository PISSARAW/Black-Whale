import { FIGHT_FPS } from '../fightClock'
import timing from './phinksFilmTiming.json'

export const PHINKS_VICTORY_DURATION = 8
export const PHINKS_VICTORY_FRAMES = PHINKS_VICTORY_DURATION * FIGHT_FPS

export const {
  firstTurn: PHINKS_FIRST_TURN,
  interceptShot: PHINKS_INTERCEPT_SHOT,
  parry: PHINKS_PARRY,
  windupEnd: PHINKS_WINDUP_END,
  plant: PHINKS_PLANT,
  strikeShot: PHINKS_STRIKE_SHOT,
  contact: PHINKS_CONTACT,
  fracture: PHINKS_FRACTURE,
  floorCrack: PHINKS_FLOOR_CRACK,
  fragmentBurst: PHINKS_FRAGMENT_BURST,
  flightShot: PHINKS_FLIGHT_SHOT,
  disintegrated: PHINKS_DISINTEGRATED,
  wideShot: PHINKS_WIDE_SHOT,
  debrisHit: PHINKS_DEBRIS_HIT,
  debrisSettle: PHINKS_DEBRIS_SETTLE,
  reactionShot: PHINKS_REACTION_SHOT,
  verdict: PHINKS_VERDICT,
} = timing
