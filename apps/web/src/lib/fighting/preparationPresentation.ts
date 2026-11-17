import { luiniPhasePresentation } from './luiniPresentation'
import { preparationCheck } from './preparationRequirements'
import { preparedSource, preparedActionReady, controlledEntities } from './preparationActions'
import type { HatsuRequirement } from './preparationTypes'
import type { FightSide, FightState } from './types'

export const REQUIREMENT_LABELS: Record<'fr' | 'en', Record<HatsuRequirement, string>> = {
  fr: {
    needles: 'Aiguilles réelles',
    flute: 'Flûte portée',
    book: 'Livre porté',
    'free-hands': 'Deux mains libres',
    'small-animal': 'Petit animal réel à portée',
    bird: 'Oiseau réel à portée',
    'living-target': 'Graine vivante au contact',
    cohort: 'Partisan consentant marqué du panache',
    'cohort-charge': 'Volonté collective réunie (8 s)',
    morena: 'Morena présente',
    hideout: 'Planque Heil-Ly',
    intruder: 'Intrus en infraction',
    'sealed-room': 'Pièce fermée à porte unique',
    'room-interior': 'À l’intérieur de la pièce',
    'luini-anchor': 'Ancrage personnel encore valide',
    'visited-destination': 'Destination visitée par cet utilisateur',
  },
  en: {
    needles: 'Real needles',
    flute: 'Flute carried',
    book: 'Book carried',
    'free-hands': 'Both hands free',
    'small-animal': 'Real small animal in range',
    bird: 'Real bird in range',
    'living-target': 'Living seed in contact',
    cohort: 'Consenting feather-marked supporter',
    'cohort-charge': 'Shared will gathered (8 s)',
    morena: 'Morena present',
    hideout: 'Heil-Ly hideout',
    intruder: 'Unlawful intruder',
    'sealed-room': 'Sealed single-door room',
    'room-interior': 'Inside the room',
    'luini-anchor': 'Personal anchor still valid',
    'visited-destination': 'Destination visited by this user',
  },
}
export { ENTITY_LABELS } from './preparationEntityLabels'

export function visiblePreparationCheck(state: FightState, side: FightSide) {
  const fighter = state[side]
  const held = fighter.kurapika?.held
  if (!held) return preparationCheck(state, side)
  const actor = { ...fighter, id: held.source, nenOwner: fighter.id }
  return preparationCheck({ ...state, [side]: actor }, side, held.moveId)
}

export function preparedSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  const source = preparedSource(state, 'player')
  if (!source) return null
  const active = controlledEntities(state, 'player', source).length > 0
  const report = preparationCheck(state, 'player')
  const missing = report.requirements
    .filter((entry) => !entry.satisfied)
    .map((entry) => REQUIREMENT_LABELS[language][entry.id])
  if (source === 'luini') {
    const phase = luiniPhasePresentation(state, 'player', language)
    return {
      ...phase,
      ready: preparedActionReady(state, 'player'),
      hint: missing.length ? `${phase.hint} · ${missing.join(' · ')}` : phase.hint,
    }
  }
  const labels = {
    sayird: 'Little Eye',
    cluck: language === 'fr' ? 'Courrier par pigeon' : 'Pigeon courier',
    bill: 'Erigeron',
    luini: language === 'fr' ? 'Passage préparé' : 'Prepared passage',
  }
  return {
    label: active
      ? language === 'fr'
        ? 'Libérer l’animal'
        : 'Release animal'
      : labels[source as keyof typeof labels],
    ready: preparedActionReady(state, 'player'),
    hint: missing.length
      ? missing.join(' · ')
      : language === 'fr'
        ? 'L · utiliser la cible réelle du scénario'
        : 'L · use the real scenario target',
  }
}
