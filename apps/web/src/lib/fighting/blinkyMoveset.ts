import { blinkyState, blinkyBloodReady } from './blinky'
import type { FighterMoveset } from './movesetTypes'
import type { FightSide, FightState } from './types'
import type { TechniqueCanonContract } from './techniqueContracts'

const BLINKY: TechniqueCanonContract = {
  source:
    'Yorknew: selective suction and last-object return; chapter 228: Pike’s blood through open wounds.',
  evidence: 'gameplay-abstraction',
  conditions: ['Designate the matter, aim the nozzle; blood must exit through uncovered wounds.'],
  prohibitions: [
    'No living target, Nen construct, aura drain, healing, arbitrary HP threshold or retrieval of older objects.',
  ],
  narrativeCost:
    'Startup, range, aura costs, blood damage and two-hand wound coverage are explicit duel tuning.',
  narrativeEffect:
    'Suck named matter; return only the last object; draw blood through wounds that may be plugged.',
}

export function tuneBlinkyMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'shizuku') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      if (!['special', 'finisher'].includes(move.category)) return move
      if (move.slot === 'forwardSpecial') return { ...move, canon: BLINKY }
      const active = move.slot === 'finisher' ? 90 : move.slot === 'backSpecial' ? 1 : 30
      return {
        ...move,
        canon: BLINKY,
        tuning: {
          ...move.tuning,
          damage: 0,
          lunge: 0,
          knockback: 0,
          hitstun: 0,
          hitstop: 0,
          active,
        },
      }
    }),
  }
}
export function blinkyMoveAllowed(state: FightState, side: FightSide, moveId: string): boolean {
  if (moveId === 'shizuku:backSpecial')
    return Boolean(blinkyState(state[side]).lastObject || blinkyState(state[side]).lastWasBlood)
  if (moveId === 'shizuku:finisher') return blinkyBloodReady(state, side)
  return true
}
