import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightState, FightSide } from './types'
import type { FightBox } from './frameData'

export type LuiniExitMode = 'full' | 'door' | 'ceiling'
export interface LuiniPassage {
  mode: 'door' | 'ceiling'
  destinationId: string
  originX: number
  originY: number
  exitX: number
  exitY: number
  floorY: number
}
export const LUINI_WAIST = 5.2
export const LUINI_CEILING = 16

export function ownsLuini(fighter: ArcadeFighter): boolean
export function ownsLuini(state: FightState, side: FightSide): boolean
export function ownsLuini(value: ArcadeFighter | FightState, side?: FightSide): boolean {
  const fighter = side ? (value as FightState)[side] : (value as ArcadeFighter)
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'luini')
  const held = fighter.kurapika?.held
  return fighter.id === 'luini' || Boolean(held?.loaded && held.source === 'luini')
}
export function luiniNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    ownsLuini(fighter) &&
    voluntaryNenAvailable(fighter) &&
    !chainAbilitySealed(fighter, 'luini:neutralSpecial')
  )
}
/** Both exposed pieces belong to ONE body and ONE health pool; neither is a clone. */
export function luiniHurtboxes(fighter: ArcadeFighter): FightBox[] {
  const passage = fighter.luiniPassage!
  return [
    {
      left: fighter.x - 2.1,
      right: fighter.x + 2.1,
      bottom: fighter.y + LUINI_WAIST,
      top: fighter.y + 12,
    },
    {
      left: passage.originX - 1.7,
      right: passage.originX + 1.7,
      bottom: passage.originY,
      top: passage.originY + LUINI_WAIST,
    },
  ]
}
export function settleLuiniPassage(
  state: FightState,
  side: FightSide,
  anchored: boolean,
): FightState {
  const fighter = state[side],
    passage = fighter.luiniPassage
  if (!passage) return state
  const keep = anchored && luiniNenAvailable(fighter) && !passageInterrupted(fighter)
  return {
    ...state,
    [side]: keep
      ? {
          ...fighter,
          x: passage.exitX,
          y: passage.exitY,
          velocityY: 0,
          motion: undefined,
          crouching: false,
        }
      : { ...fighter, luiniPassage: undefined, luiniComplete: undefined },
  }
}
function passageInterrupted(fighter: ArcadeFighter): boolean {
  return (
    fighter.health <= 0 ||
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    Boolean(
      fighter.hanzoProjection ||
      fighter.biohazardRestraint ||
      fighter.chainJail ||
      fighter.maryCapture ||
      fighter.clothCapture,
    )
  )
}
