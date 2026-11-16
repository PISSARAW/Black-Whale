import { attackData, attackTotal } from './frameData'
import { readCounterplay } from './fightCounterplay'
import { CYCLOTRON_ROTATION_FRAMES } from './phinksCyclotron'
import type { FightSide, FightState } from './types'

export interface FightCommitment {
  label: readonly [string, string]
  frames?: number
  count?: number
}
/** Own commitments have exact timing; perceived enemy cues never acquire private timers. */
export function fightCommitments(state: FightState, side: FightSide): FightCommitment[] {
  const fighter = state[side]
  const rows: FightCommitment[] = []
  if (fighter.attack)
    rows.push({
      label: ['Fin du geste', 'Action ends'],
      frames: Math.max(
        0,
        attackTotal(attackData(fighter.attack.kind, fighter)) - fighter.attack.frame,
      ),
    })
  const stun = Math.max(
    fighter.hitStun,
    fighter.blockStun,
    fighter.knockdownFrames,
    fighter.throwTechRecoveryFrames ?? 0,
  )
  if (stun > 0) rows.push({ label: ['Stun / relevée', 'Stun / wake-up'], frames: stun })
  if (fighter.coveringEars || fighter.pluggingWounds || fighter.melodyPerformance)
    rows.push({ label: ['Mains occupées', 'Hands occupied'] })
  rows.push(...preparationCommitments(state, side))
  if (readCounterplay(state, side)?.kind === 'tether')
    rows.push({ label: ['Liaison perçue', 'Perceived tether'] })
  return rows
}

function preparationCommitments(state: FightState, side: FightSide): FightCommitment[] {
  const fighter = state[side]
  const rows: FightCommitment[] = []
  if (fighter.hatsuChargeFrames > 0)
    rows.push({ label: ['Hatsu maintenu', 'Hatsu held'], frames: fighter.hatsuChargeFrames })
  if (fighter.cyclotronWindup)
    rows.push({
      label: ['Prochain tour', 'Next rotation'],
      frames: Math.max(0, CYCLOTRON_ROTATION_FRAMES - fighter.cyclotronWindup.frame),
    })
  if (fighter.hatsuEffects.cyclotronTurns > 0)
    rows.push({
      label: ['Tours conservés', 'Stored rotations'],
      count: fighter.hatsuEffects.cyclotronTurns,
    })
  const dance = fighter.battleCantabile?.preparation
  if (dance) rows.push({ label: ['Danse', 'Dance'], frames: dance.remaining })
  if (fighter.bashoPoem?.writingFrames)
    rows.push({ label: ['Écriture', 'Writing'], frames: fighter.bashoPoem.writingFrames })
  return rows
}
