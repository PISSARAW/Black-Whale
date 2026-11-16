import { commandFeedbackText } from './commandFeedbackText'
import type { ResponseAttempt, ResponseOutcome } from './fightResponseDiagnostics'

const OUTCOMES: Record<ResponseOutcome, [string, string]> = {
  queued: ['Reçue · en file', 'Received · queued'],
  buffered: ['En buffer', 'Buffered'],
  executed: ['Exécutée', 'Executed'],
  refused: ['Refusée', 'Refused'],
  expired: ['Expirée', 'Expired'],
  cancelled: ['Annulée', 'Cancelled'],
}
export function responseOutcomeText(outcome: ResponseOutcome, language: 'fr' | 'en'): string {
  return OUTCOMES[outcome][language === 'fr' ? 0 : 1]
}
export function responseReasonText(entry: ResponseAttempt, language: 'fr' | 'en'): string {
  const index = language === 'fr' ? 0 : 1
  if (entry.reason === 'queue-full')
    return [
      'File pleine : trop de commandes avant le prochain tick.',
      'Queue full: too many commands before the next tick.',
    ][index]
  if (entry.reason === 'replaced')
    return ['Remplacée par une commande plus récente.', 'Replaced by a newer command.'][index]
  if (entry.reason === 'cleared' || entry.reason === 'reset')
    return [
      'File vidée après pause, perte de focus ou réinitialisation.',
      'Queue cleared after pause, focus loss or reset.',
    ][index]
  if (entry.reason === 'buffer-expired')
    return [
      'Fenêtre de buffer dépassée avant de pouvoir agir.',
      'Buffer expired before the fighter could act.',
    ][index]
  if (!entry.reason) return ''
  return commandFeedbackText(
    {
      frame: entry.appliedFrame ?? entry.receivedFrame,
      sequence: entry.id,
      outcome: 'refused',
      reason: entry.reason,
    },
    language,
  )
}
