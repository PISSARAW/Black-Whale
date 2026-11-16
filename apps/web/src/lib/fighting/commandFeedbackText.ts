import type { CommandFailure } from './commandFailure'
import type { CommandFeedback } from './commandFeedback'

const FAILURES: Record<CommandFailure, readonly [string, string]> = {
  phase: [
    'Le combat ne permet pas encore cette commande.',
    'This command is unavailable in this fight phase.',
  ],
  stun: [
    'Corps indisponible : attendre la fin du stun ou de la relevée.',
    'Body unavailable: wait for stun or wake-up to end.',
  ],
  recovery: [
    'Engagement en cours : attendre la récupération ou un cancel autorisé.',
    'Still committed: wait for recovery or an allowed cancel.',
  ],
  hands: [
    'Mains occupées : relâcher la protection, terminer la performance ou adapter le livre.',
    'Hands occupied: release protection, finish the performance or adjust the book.',
  ],
  nen: [
    'Nen indisponible ou technique scellée dans votre état actuel.',
    'Nen unavailable or technique sealed in your current state.',
  ],
  aura: [
    'Aura insuffisante pour le coût réel de cette commande.',
    'Not enough aura for this command’s actual cost.',
  ],
  equipment: [
    'Équipement requis absent : la copie ne fournit pas le matériel.',
    'Required equipment missing: copying does not supply it.',
  ],
  preparation: [
    'Préparation requise incomplète. Consultez les conditions de votre Hatsu.',
    'Required preparation incomplete. Check your Hatsu conditions.',
  ],
  range: [
    'Corps, lieu ou cible matérielle requis absent ou hors de portée.',
    'Required body, place or material target absent or out of range.',
  ],
  condition: [
    'Commande refusée : une condition propre à cette action manque.',
    'Command refused: an action-specific condition is unmet.',
  ],
}
export function commandFeedbackText(feedback: CommandFeedback, language: 'fr' | 'en'): string {
  const index = language === 'fr' ? 0 : 1
  if (feedback.outcome === 'buffered')
    return [
      'Commande en attente ; conditions et coût seront revérifiés au départ.',
      'Command buffered; conditions and cost will be checked again on execution.',
    ][index]
  if (feedback.outcome === 'started')
    return [
      'Commande exécutée ; le contact reste à confirmer.',
      'Command executed; contact is still required.',
    ][index]
  return FAILURES[feedback.reason ?? 'condition'][index]
}
