import type { FightEnvironment } from '../fightEnvironment'
import { DEFAULT_FIGHT_FORMAT, type FightFormatId } from '../formats'
import type { FightSide, FighterId } from '../types'
import { DEATH_MATCH_FORMAT } from './loadout'
import { DEFAULT_DEATH_MATCH_OPTIONS, type DeathMatchOptions } from './scenario'

/** The two seats: Chrollo on `chrolloSide`, Hisoka on the other one. */
export function historicalSeats(chrolloSide: FightSide): {
  player: FighterId
  opponent: FighterId
} {
  return chrolloSide === 'opponent'
    ? { player: 'hisoka', opponent: 'chrollo' }
    : { player: 'chrollo', opponent: 'hisoka' }
}

export function historicalOptions(environment: FightEnvironment): DeathMatchOptions {
  return { ...DEFAULT_DEATH_MATCH_OPTIONS, ...environment.deathMatch }
}

/** The Heavens Arena, without the duel's cover crates, carrying the scenario options. */
export function historicalEnvironment(
  environment: FightEnvironment,
  options: Partial<DeathMatchOptions> = {},
): FightEnvironment {
  return {
    ...environment,
    stageId: 'heavens-arena',
    arenaInteractions: false,
    deathMatch: { ...historicalOptions(environment), ...options },
  }
}

/** Leaving the scenario for an ordinary duel gives the duel its own format back. */
export function duelFormat(format: FightFormatId): FightFormatId {
  return format === DEATH_MATCH_FORMAT ? DEFAULT_FIGHT_FORMAT : format
}
