import type { SecretWindowObservation } from './secretWindow'

export const WINDOW_ACTION_LABELS: Record<
  SecretWindowObservation['action'],
  readonly [string, string]
> = {
  'audio-only': ['Écoute à travers les obstacles', 'Listening through obstacles'],
  idle: ['Attente', 'Idle'],
  walk: ['Déplacement', 'Movement'],
  jump: ['Saut', 'Jump'],
  guard: ['Garde', 'Guard'],
  light: ['Frappe légère', 'Light strike'],
  heavy: ['Frappe lourde', 'Heavy strike'],
  special: ['Geste technique', 'Technique gesture'],
  ranged: ['Tir', 'Shot'],
  hit: ['Impact reçu', 'Hit received'],
  down: ['Au sol', 'Down'],
  wakeup: ['Relevée', 'Getting up'],
  ko: ['Corps inerte', 'Unmoving body'],
  'concealed-gesture': ['Geste observé', 'Observed gesture'],
  'sleeping-body': ['Corps endormi', 'Sleeping body'],
}
