import { living, type CrowdState, type Spectator } from '../crowd/types'
import { isBomb } from './pipeline'

export interface PuppetCensus {
  humans: number
  controlled: number
  copies: number
  /** Copies made in Hisoka's sight / out of it (the reserve he does not know about). */
  visible: number
  reserve: number
  stamped: number
  sunMarked: number
  bombs: number
  falseChrollos: number
  dead: number
  evacuated: number
  vanished: number
}

const EMPTY: PuppetCensus = {
  humans: 0,
  controlled: 0,
  copies: 0,
  visible: 0,
  reserve: 0,
  stamped: 0,
  sunMarked: 0,
  bombs: 0,
  falseChrollos: 0,
  dead: 0,
  evacuated: 0,
  vanished: 0,
}

function countGone(census: PuppetCensus, spectator: Spectator): boolean {
  if (spectator.posture === 'dead') census.dead += 1
  else if (spectator.posture === 'evacuated') census.evacuated += 1
  else if (spectator.posture === 'vanished') census.vanished += 1
  return !living(spectator)
}

function countCopy(census: PuppetCensus, spectator: Spectator): void {
  census.copies += 1
  if (spectator.madeInSight) census.visible += 1
  else census.reserve += 1
  if (spectator.marks.stamped) census.stamped += 1
  if (isBomb(spectator)) census.bombs += 1
}

/** The real composition of the hall: Chrollo's knowledge, never the Hisoka player's. */
export function puppetCensus(crowd: CrowdState): PuppetCensus {
  const census = { ...EMPTY }
  for (const spectator of crowd.spectators) {
    if (countGone(census, spectator)) continue
    if (spectator.marks.sun) census.sunMarked += 1
    if (spectator.face === 'chrollo') census.falseChrollos += 1
    if (spectator.nature === 'copy') countCopy(census, spectator)
    else if (spectator.nature === 'controlled') census.controlled += 1
    else census.humans += 1
  }
  return census
}

/** Chrollo's puppets on the field: every living copy plus the people his antennas drive. */
export function puppetCount(census: PuppetCensus): number {
  return census.copies + census.controlled
}

export type ApparentNature = 'unknown' | 'copy'

/** What the Hisoka player may tell about a body: only what Hisoka saw for himself. */
export function apparentNature(spectator: Spectator): ApparentNature {
  return spectator.nature === 'copy' && spectator.revealedToHisoka ? 'copy' : 'unknown'
}
