import type { TechniqueCanonContract } from './techniqueContracts'

/** Manga rules are separate from the duel's costs, duration, dialogue and contact shortcuts. */
export const CHROLLO_CANON: Record<string, TechniqueCanonContract> = {
  'chrollo:neutralSpecial': {
    source: 'Ch. 106, 351 — Skill Hunter, Black Voice, The Sun and Moon',
    evidence: 'gameplay-abstraction',
    conditions: [
      'Use the open page, or the bookmarked page with the book closed.',
      'Black Voice uses Shalnark’s original paired phone and one of his two physical antennas; Sun uses the left hand.',
    ],
    prohibitions: ['Stored pages are not all active at once. A single mark cannot explode.'],
    narrativeCost:
      'The open book occupies the right hand. Phone commands persist until the antenna is removed, the subject dies or the active page is lost; movement speed is duel tuning.',
    narrativeEffect:
      'Uses the selected ability. Two contacts on one target abstract the marks meeting.',
  },
  'chrollo:forwardSpecial': {
    source: 'Ch. 106 — Skill Hunter acquisition conditions',
    evidence: 'gameplay-abstraction',
    conditions: [
      'Witness the Hatsu, ask its owner about it and receive an audible answer.',
      'The owner’s palm must touch the handprint on the cover, all within one hour.',
    ],
    prohibitions: ['Cannot steal basic Nen, bodily forms or an unseen Hatsu.'],
    narrativeCost: 'Close-range commitment; the victim loses access until the round resets.',
    narrativeEffect: 'Adds a retained page and opens it without replacing earlier pages.',
  },
  'chrollo:downSpecial': {
    source: 'Ch. 351 — Double Face',
    evidence: 'manga-shown',
    conditions: ['Place the single bookmark on an owned page, or reopen the closed book.'],
    prohibitions: ['One bookmark only; its extra canon conditions remain unknown.'],
    narrativeCost: 'A vulnerable book-handling action, without a damaging carrier.',
    narrativeEffect: 'Keeps the bookmarked page active with the book closed or another page open.',
  },
  'chrollo:backSpecial': {
    source: 'Ch. 106, 351 — Bandit’s Secret page selection',
    evidence: 'manga-shown',
    conditions: ['The selected page belongs to the book.'],
    prohibitions: ['An unbookmarked page stops working when turned away; Sun/Moon marks persist.'],
    narrativeCost: 'Occupies the right hand; switching has duel recovery frames.',
    narrativeEffect: 'Opens the next retained page while preserving the single bookmark.',
  },
  'chrollo:finisher': {
    source: 'Ch. 351–352 — Double Face and Sun/Moon’s post-mortem Nen',
    evidence: 'gameplay-abstraction',
    conditions: [
      'An owned page must be bookmarked.',
      'Moon requires the right hand free: book closed.',
    ],
    prohibitions: ['No Moon stamp while holding the open book; no explosion from one mark.'],
    narrativeCost: 'Uses the bookmarked ability; closing the book suspends the other page.',
    narrativeEffect: 'Replays the bookmarked page, or stamps Moon with the free right hand.',
  },
}
