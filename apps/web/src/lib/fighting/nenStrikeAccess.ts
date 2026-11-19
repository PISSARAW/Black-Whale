import { predatorNenLocked } from './predatorSeal'
import type { ArcadeFighter, FightNenZone } from './types'

export function canReinforceStrike(fighter: ArcadeFighter, zone: FightNenZone): boolean {
  return (
    !predatorNenLocked(fighter) &&
    fighter.nen.mode !== 'zetsu' &&
    (!fighter.nen.ko || fighter.nen.ko === zone)
  )
}
