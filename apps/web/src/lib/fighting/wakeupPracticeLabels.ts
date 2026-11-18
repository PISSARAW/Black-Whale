import type { WakeupProgress, WakeupSettings } from './combatWakeupPractice'

type Labels<T extends keyof WakeupSettings> = Record<WakeupSettings[T], readonly [string, string]>

export const WAKEUP_POSITIONS: Labels<'position'> = {
  centre: ['Centre', 'Midscreen'],
  corner: ['Coin', 'Corner'],
}
export const WAKEUP_REACTIONS: Labels<'reaction'> = {
  guard: ['Garde', 'Guard'],
  jab: ['Léger dès la récupération', 'First-frame jab'],
  tech: ['Déprojection retardée', 'Delayed throw tech'],
  wait: ['Attente', 'Wait'],
}
export const WAKEUP_FOLLOWUPS: Labels<'followup'> = {
  strike: ['Frappe à la reprise', 'Timed strike'],
  throw: ['Projection à la reprise', 'Timed throw'],
  bait: ['Feinte de projection', 'Throw bait'],
}

const PHASES = {
  down: ['Au sol. Prépare ton placement.', 'Downed. Set up your position.'],
  stun: [
    'La cible récupère debout. Prépare-toi à bloquer sa riposte.',
    'The defender recovers standing. Be ready to block their response.',
  ],
  protected: [
    'Relevée protégée. Cale ton impact à la fin de la protection.',
    'Protected wakeup. Time your impact for the end of protection.',
  ],
  open: ['Reprise. Frappe, projette ou temporise.', 'Actionable. Strike, throw or wait.'],
} as const
const RESULTS = {
  hit: ['Ton attaque touche.', 'Your attack hits.'],
  blocked: ['Le défenseur bloque ton attaque.', 'The defender blocks your attack.'],
  tech: ['Le défenseur déprojette.', 'The defender techs the throw.'],
  'defender-hit': [
    'Le défenseur reprend l’initiative et touche.',
    'The defender takes their turn and hits.',
  ],
  'defender-blocked': ['Tu bloques la riposte du défenseur.', 'You block the defender’s response.'],
  protected: [
    'Impact trop tôt. La protection de relevée est encore active.',
    'Impact too early. Wakeup protection is still active.',
  ],
  punish: [
    'Le coup du défenseur manque. Tu punis sa récupération.',
    'The defender whiffs. You punish their recovery.',
  ],
  reset: ['Les deux combattants reviennent au jeu neutre.', 'Both fighters return to neutral.'],
} as const

export function wakeupPracticeLabel(progress: WakeupProgress, index: number): string {
  return progress.result ? RESULTS[progress.result][index] : PHASES[progress.phase][index]
}
