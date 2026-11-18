import type { ArcadeFighter, FightSide, FightState } from './types'

export type SaiyuSense = 'sight' | 'hearing' | 'speech'
export const SENSE_BITS: Record<SaiyuSense, number> = { sight: 1, hearing: 2, speech: 4 }
export const SAIYU_MONKEYS = [
  { name: 'Mizaru', sense: 'sight', moveId: 'saiyu:neutralSpecial' },
  { name: 'Kikazaru', sense: 'hearing', moveId: 'saiyu:forwardSpecial' },
  { name: 'Iwazaru', sense: 'speech', moveId: 'saiyu:downSpecial' },
] as const

/** Skill Hunter's one copied command executes the first monkey, never all three. */
export function saiyuMonkey(moveId = 'saiyu:neutralSpecial') {
  const copied = moveId === 'chrollo:neutralSpecial' || moveId === 'chrollo:finisher'
  const selected = copied ? 'saiyu:neutralSpecial' : moveId
  return SAIYU_MONKEYS.find((monkey) => monkey.moveId === selected) ?? null
}

export function senseDeprived(fighter: ArcadeFighter, sense: SaiyuSense): boolean {
  return (fighter.hatsuEffects.senseSeals & SENSE_BITS[sense]) !== 0
}

export function sealedSenseCount(fighter: ArcadeFighter): number {
  return SAIYU_MONKEYS.filter((monkey) => senseDeprived(fighter, monkey.sense)).length
}

export function canSpeak(fighter: ArcadeFighter): boolean {
  return fighter.health > 0 && !fighter.halkSoulSleep && !senseDeprived(fighter, 'speech')
}

/** The shared screen follows P1 by default; local versus can select P2's perception. */
export function saiyuAudioEnabled(state: FightState, viewer: FightSide = 'player'): boolean {
  const shown = state.mode === 'versus-local' ? viewer : 'player'
  return !senseDeprived(state[shown], 'hearing')
}
