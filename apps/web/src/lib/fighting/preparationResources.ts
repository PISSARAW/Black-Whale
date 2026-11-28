import type { PreparationResource } from './preparationTypes'

/** Explicit scenario matter, shared by the visible setup, PvP and replays. */
export const SCENARIO_RESOURCES: readonly {
  id: PreparationResource
  fr: string
  en: string
  initiallySelected?: boolean
}[] = [
  {
    id: 'hisoka-asphyxia',
    initiallySelected: false,
    fr: 'Hisoka · scène du chapitre 357 : ordre antérieur, asphyxie et organes viables, air rétabli',
    en: 'Hisoka · chapter 357 scene: prior order, asphyxia, viable organs and restored air',
  },
  {
    id: 'fortunes',
    fr: 'Lovely Ghostwriter · participant fictif, identité manuscrite, portrait et mois défini',
    en: 'Lovely Ghostwriter · fictional participant, handwritten identity, portrait and defined month',
  },
  { id: 'corpses', fr: 'Cadavres réels à implanter', en: 'Real corpses for implantation' },
  {
    id: 'armed-corpses',
    initiallySelected: false,
    fr: 'Cadavres armés pour les fils de Machi',
    en: 'Armed corpses for Machi’s threads',
  },
  { id: 'hostages', fr: 'Otages déjà retenus', en: 'Already held hostages' },
  {
    id: 'sedatives',
    fr: 'Sédatif réel préparé pour le sommeil prolongé d’une conscience',
    en: 'Actual sedative prepared for a consciousness’ prolonged sleep',
  },
  { id: 'documents', fr: 'Documents papier déjà écrits', en: 'Already written paper documents' },
  { id: 'maps', fr: 'Plans papier de l’arène', en: 'Paper arena maps' },
  {
    id: 'paper',
    fr: 'Éventails, confettis et feuilles réels',
    en: 'Actual fans, confetti and paper sheets',
  },
  {
    id: 'musse-history',
    fr: 'Benjamin et Camilla · hibou hérité de Musse et longue surveillance déjà accomplis',
    en: 'Benjamin and Camilla · Musse’s owl inherited and prolonged monitoring completed',
  },
  {
    id: 'devices',
    fr: 'Caméras, armes, émetteurs et récepteurs réels',
    en: 'Real cameras, firearms, transmitters and receivers',
  },
  {
    id: 'spirits',
    fr: 'Faibles esprits pour les talismans',
    en: 'Weak spirits for protective charms',
  },
  {
    id: 'people',
    fr: 'Reine Oito · destinataire non éveillée',
    en: 'Queen Oito · unawakened recipient',
  },
  { id: 'writing', fr: 'Papier, pinceaux et encre réels', en: 'Real paper, brushes and ink' },
  { id: 'animals', fr: 'Petits animaux réels', en: 'Real small animals' },
  { id: 'birds', fr: 'Pigeons et points de livraison', en: 'Pigeons and delivery points' },
  { id: 'plants', fr: 'Graines vivantes à faire germer', en: 'Living seeds to germinate' },
  { id: 'objects', fr: 'Caisses réelles pour Sweet Home', en: 'Real crates for Sweet Home' },
  { id: 'needles', fr: 'Aiguilles réelles à ramasser', en: 'Real needles to pick up' },
  { id: 'flutes', fr: 'Flûtes à ramasser', en: 'Flutes to pick up' },
  {
    id: 'rooms',
    fr: 'Pièces d’ancrage fermées et destinations déjà visitées',
    en: 'Sealed anchor rooms and already visited destinations',
  },
]

export const SCENARIO_RESOURCE_IDS = SCENARIO_RESOURCES.map((entry) => entry.id)
