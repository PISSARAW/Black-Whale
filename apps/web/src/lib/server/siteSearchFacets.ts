import { foldSearch } from '$lib/search/text'
import type { SearchCategory, SearchIntent, SearchKind } from '$lib/search/types'

const KIND_WORDS: Array<[SearchKind, RegExp]> = [
  ['character', /\b(personnages?|utilisateurs?|characters?|people|users?)\b/],
  ['ability', /\b(pouvoirs?|capacites?|techniques?|hatsu|abilities|ability|powers?)\b/],
  ['place', /\b(pieces?|salles?|lieux|endroits?|rooms?|places?)\b/],
  ['event', /\b(evenements?|chronologie|events?|timeline|chapitres?|chapters?)\b/],
  ['faction', /\b(factions?|groupes?|groups?)\b/],
  ['page', /\b(jeux|jeu|modes?|games?|tools?|outils?|simulations?)\b/],
]
const CATEGORY_WORDS: Array<[SearchCategory, string[]]> = [
  ['enhancer', ['enhancer', 'enhancement', 'renforcement']],
  ['transmuter', ['transmuter', 'transmutation', 'transformation']],
  ['emitter', ['emitter', 'emission']],
  ['conjurer', ['conjurer', 'conjuration', 'materialisation']],
  ['manipulator', ['manipulator', 'manipulation']],
  ['specialist', ['specialist', 'specialization', 'specialisation']],
]

/** Explicit filters beat model guesses; inferred words still power semantic matching. */
export function normalizeSearchIntent(query: string, intent: SearchIntent): SearchIntent {
  const text = foldSearch(query)
  const kind = KIND_WORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? intent.kind
  const words = new Set(text.split(' '))
  const category =
    CATEGORY_WORDS.find(([, names]) => names.some((name) => words.has(name)))?.[0] ??
    intent.category
  const redundant = new Set(CATEGORY_WORDS.find(([value]) => value === category)?.[1] ?? [])
  return { kind, category, terms: intent.terms.filter((term) => !redundant.has(foldSearch(term))) }
}
