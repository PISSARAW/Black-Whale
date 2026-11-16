import type { TechniqueCanonContract } from './techniqueContracts'

const INHERITANCE =
  'The soldier died loyal, graduated from the Royal Military Academy and served in Benjamin’s private army.'

export const BENJAMIN_CANON: Readonly<Record<string, TechniqueCanonContract>> = {
  'benjamin:neutralSpecial': {
    source: 'Succession Contest — Vincent’s Air Blow, inherited through Benjamin Baton (ch. 373)',
    evidence: 'gameplay-abstraction',
    conditions: [INHERITANCE, 'Air Blow is attempted from the left palm.'],
    prohibitions: ['Its mechanism, exact range and complete conditions remain unrevealed.'],
    narrativeCost: 'Inherited before the duel; aura and recovery are competitive tuning.',
    narrativeEffect: 'A left-palm attack at short range; it never grants damage charges.',
  },
  'benjamin:forwardSpecial': {
    source:
      'Succession Contest — Musse’s Secret Window, inherited through Benjamin Baton (ch. 373)',
    evidence: 'manga-shown',
    conditions: [INHERITANCE, 'The surveillance bird is attached through physical contact.'],
    prohibitions: [
      'Surveillance causes no damage, paralysis or forced Zetsu and does not reveal In.',
    ],
    narrativeCost: 'Contact and aura; the duel begins after Musse’s death.',
    narrativeEffect: 'A bird relays the marked target’s actions; it grants no combat-stat bonus.',
  },
  'benjamin:downSpecial': {
    source:
      'Succession Contest — Shikaku’s Culdcept, inherited through Benjamin Baton (ch. 382, 389)',
    evidence: 'gameplay-abstraction',
    conditions: [INHERITANCE, 'Join hands and charge the aura rectangle before acquisition.'],
    prohibitions: [
      'Full acquisition conditions are unknown; success was not demonstrated in the manga.',
      'The rectangle cannot stop Halkenburg’s piercing arrow.',
      'Ordinary ammunition is not a Nen ability.',
    ],
    narrativeCost: 'A vulnerable startup, aura and one held card.',
    narrativeEffect:
      'Duel adaptation: stores one incoming Nen projectile, not the user’s entire Hatsu.',
  },
  'benjamin:backSpecial': {
    source: 'Benjamin’s military training and heavy firearm during martial law',
    evidence: 'gameplay-abstraction',
    conditions: ['Benjamin commits to a physical rifle-butt strike.'],
    prohibitions: ['This is a martial strike, not a fourth inherited ability.'],
    narrativeCost: 'Physical commitment and recovery.',
    narrativeEffect: 'A close-range rifle-butt strike without a Hatsu effect.',
  },
  'benjamin:finisher': {
    source: 'Succession Contest — Culdcept’s acquired ability card',
    evidence: 'gameplay-abstraction',
    conditions: [INHERITANCE, 'Culdcept must already hold a captured card.'],
    prohibitions: ['No card means no attack; no universal melee blast or damage multiplier.'],
    narrativeCost: 'Consumes the held card at release and pays aura on startup.',
    narrativeEffect: 'Duel adaptation: releases the captured projectile from the card once.',
  },
}
