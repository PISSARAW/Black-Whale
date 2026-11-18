import type { TrainingHistoryEntry } from './trainingTypes'

const LABELS: Record<string, [string, string]> = {
  neutral: ['Neutre', 'Neutral'],
  left: ['←', '←'],
  right: ['→', '→'],
  jump: ['↑', '↑'],
  down: ['↓', '↓'],
  guard: ['Garde', 'Guard'],
  light: ['Léger', 'Light'],
  heavy: ['Lourd', 'Heavy'],
  special: ['Hatsu', 'Hatsu'],
  ranged: ['Tir', 'Shot'],
  throw: ['Projection', 'Throw'],
  finisher: ['Ultime', 'Finisher'],
  aura: ['Aura', 'Aura'],
  hatsu: ['Charge Hatsu', 'Charge Hatsu'],
  conceal: ['In', 'In'],
  coverEars: ['Oreilles couvertes', 'Cover ears'],
  plugWounds: ['Plaies couvertes', 'Cover wounds'],
  call: ['Appel', 'Call'],
  kameo: ['Kaméo', 'Kameo'],
  interact: ['Interaction', 'Interact'],
  arena: ['Terrain', 'Arena'],
  focusHead: ['Tête', 'Head'],
  focusTorso: ['Torse', 'Torso'],
  focusHands: ['Mains', 'Hands'],
  focusFeet: ['Pieds', 'Feet'],
}
const OUTCOMES: Record<TrainingHistoryEntry['outcome'], [string, string]> = {
  input: ['Entrée', 'Input'],
  started: ['Exécutée', 'Started'],
  buffered: ['En attente', 'Buffered'],
  refused: ['Refusée', 'Refused'],
}
export function trainingInputLabel(label: string, language: 'fr' | 'en'): string {
  return label
    .split(' + ')
    .map((key) => LABELS[key]?.[language === 'fr' ? 0 : 1] ?? key)
    .join(' + ')
}
export function trainingOutcomeLabel(
  outcome: TrainingHistoryEntry['outcome'],
  language: 'fr' | 'en',
): string {
  return OUTCOMES[outcome][language === 'fr' ? 0 : 1]
}
