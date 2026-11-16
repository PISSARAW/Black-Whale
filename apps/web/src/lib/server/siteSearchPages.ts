import type { SearchDocument } from './siteSearchRanking'

const PAGES = [
  ['/', 'Black Whale', 'Black Whale'],
  ['/ship', 'Ship map', 'Carte du navire'],
  ['/tour', 'Virtual tour', 'Visite virtuelle'],
  ['/timeline', 'Timeline', 'Chronologie'],
  ['/characters', 'Passenger registry', 'Registre des personnages'],
  ['/abilities', 'Ability archive', 'Archive des pouvoirs'],
  ['/nen-archive', 'Nen scanner', 'Scanner du Nen'],
  ['/relationships', 'Faction network', 'Réseau des factions'],
  ['/simulations', 'Simulations', 'Simulations'],
  ['/reconstruction', 'Living reconstruction', 'Reconstruction vivante'],
  ['/reconstruction/v3', 'Counterfactual scenarios', 'Scénarios et branches alternatives'],
  ['/investigation', 'Investigation cases', 'Enquêtes et indices'],
  ['/hunt', 'Hunt game', 'Jeu de traque'],
  ['/hunt/editor', 'Hunt scenario editor', 'Éditeur de traque'],
  ['/infiltration', 'Infiltration game', 'Jeu d’infiltration'],
  ['/strategy', 'Turn-based strategy', 'Stratégie au tour par tour'],
  ['/arena', 'Combat arena', 'Arène de combat'],
  ['/arena/pvp', 'Multiplayer combat', 'Combat multijoueur'],
  ['/fighting', 'Arcade fighting', 'Combat arcade'],
  ['/tour/sources', 'Ship reconstruction sources', 'Sources de reconstruction du navire'],
  ['/tour/modes', 'Tour game modes', 'Modes de jeu de la visite'],
  ['/tour/morena', 'Morena negotiation game', 'Jeu de négociation de Morena'],
  ['/about', 'About and methodology', 'À propos et méthode'],
] as const

export function searchPages(): SearchDocument[] {
  return PAGES.map(([href, titleEn, titleFr]) => ({
    id: `page:${href}`,
    kind: 'page',
    title: titleEn,
    titleEn,
    titleFr,
    href,
    chapter: null,
    text: `${titleEn} ${titleFr}`,
    excerpt: '',
    category: 'none',
    dated: true,
    onlyUncapped: href === '/tour/morena',
  }))
}
