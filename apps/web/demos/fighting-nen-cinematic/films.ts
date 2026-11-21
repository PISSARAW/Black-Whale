import { Shot } from '../fighting-chrollo-intro/reel'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

/**
 * Victory films as the illustration: every shot is a real KO followed by the engine's own
 * cinematic, played from a chosen moment. Windows come from a survey of every film
 * (seconds from the film's start).
 */
export type Windows = readonly (readonly [number, number])[]

export const currentStage = (s: Shot): FightStageId => s.splits.at(-1)?.stage ?? s.stage

/** Finish the round for real if the concept's blow has not, then cut to each film window. */
export function finishAndFilm(s: Shot, windows: Windows) {
  for (let i = 0; i < 10 && s.state.phase !== 'finished'; i++) {
    s.idle()
    s.approach('player', 5)
    s.press(i % 2 ? 'light' : 'heavy')
    s.hits(1, 'player', 50)
  }
  for (let i = 0; i < 150 && s.state.phase !== 'finished'; i++) s.step()
  if (s.state.phase !== 'finished') throw new Error('no KO before the film')
  for (const [start, seconds] of windows) {
    s.cut(currentStage(s))
    s.film(start)
    s.step(Math.round(seconds * 60))
  }
}

/** Both bearers of Beyond's seal, struck down by their princes in the same instant. */
const CURSE_WINDOWS = [
  [2.2, 1.8],
  [4.6, 3],
] as const

function bearer(prince: FighterId, carrier: FighterId, stage: FightStageId) {
  const s = new Shot(stage, carrier, { hero: prince, gap: 5, opponentHealth: 10 })
  s.step(4)
  for (let i = 0; i < 6 && s.state.phase !== 'finished'; i++) {
    s.press(i % 2 ? 'heavy' : 'light')
    s.hits(1, 'player', 50)
    s.idle()
  }
  for (let i = 0; i < 150 && s.state.phase !== 'finished'; i++) s.step()
  if (s.state.phase !== 'finished') throw new Error(`${prince} did not knock ${carrier} out`)
  return s
}

/** Furykov above, Longhi below: one shared clock, so both seals wake together. */
export const curses = () => {
  const top = bearer('benjamin', 'furykov', 'benjamin-salon')
  const bottom = bearer('tserriednich', 'longhi', 'tserriednich-salon')
  while (top.frame < bottom.frame) top.step()
  while (bottom.frame < top.frame) bottom.step()
  top.beats.push({ at: 4, word: 'CURSE', line: 'Nen that kills from beyond the grave' })
  for (const [start, seconds] of CURSE_WINDOWS) {
    for (const s of [top, bottom]) {
      s.cut(currentStage(s))
      s.film(start)
      s.step(Math.round(seconds * 60))
    }
  }
  top.twin = bottom
  return top
}

