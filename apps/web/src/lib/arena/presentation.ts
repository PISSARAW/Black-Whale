import type { Impact } from '../combat/types'
import type { ArenaFormat } from './formats'

export type ArenaCombatMotion = 'idle' | 'guard' | 'hit' | 'down' | 'attack'

export function arenaFormatGoal(format: ArenaFormat, french: boolean): string {
  if (format.timeLimit !== null)
    return french
      ? `Prenez l’avantage avant la fin des ${format.timeLimit} secondes. Une attaque ne touche qu’à courte portée.`
      : `Take the lead before ${format.timeLimit} seconds expire. Attacks only connect at close range.`
  const plural = format.scoreToWin > 1 ? 's' : ''
  return french
    ? `Le premier à ${format.scoreToWin} point${plural} gagne. Surveillez la distance en haut de l’écran.`
    : `First to ${format.scoreToWin} point${plural} wins. Watch the distance at the top of the screen.`
}

export function reactionFor(impact: Impact): ArenaCombatMotion {
  if (impact === 'blocked') return 'guard'
  if (impact === 'knockdown' || impact === 'ko') return 'down'
  if (impact === 'clean' || impact === 'critical') return 'hit'
  return 'idle'
}

export function reactionTime(impact: Impact): number {
  if (impact === 'knockdown' || impact === 'ko') return 900
  return impact === 'critical' ? 520 : 360
}
