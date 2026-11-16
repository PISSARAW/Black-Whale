import type { FighterId } from './types'

/**
 * The colour of a fighter's aura in the duel.
 *
 * A fighter shows the aura colour the manga or the anime gave them. When
 * neither ever showed it, the aura takes the colour of their Nen category on
 * the hexagon. A category nobody has stated falls back to a neutral ivory, so
 * an unknown never passes for a guess.
 *
 * `FighterDefinition.colour` stays the costume tint shown in the selection
 * grid. It is not an aura colour and no longer feeds the aura.
 */

export type NenCategory =
  'enhancer' | 'emitter' | 'transmuter' | 'conjurer' | 'manipulator' | 'specialist' | 'unknown'

export const CATEGORY_AURA_COLOURS: Readonly<Record<NenCategory, string>> = {
  enhancer: '#3b82f6',
  emitter: '#facc15',
  transmuter: '#a855f7',
  conjurer: '#ef4444',
  manipulator: '#22c55e',
  specialist: '#f5f0ff',
  unknown: '#fffff0',
}

/**
 * Each fighter's category, as `data/characters/characters.json` declares it
 * under `nen.type`. A fighter the catalogue leaves blank or `unknown` stays
 * `unknown` here: the category is the catalogue's call, not this file's.
 */
export const FIGHTER_NEN_CATEGORIES: Readonly<Record<FighterId, NenCategory>> = {
  kurapika: 'conjurer',
  hisoka: 'transmuter',
  chrollo: 'specialist',
  morena: 'specialist',
  benjamin: 'unknown',
  tserriednich: 'specialist',
  feitan: 'transmuter',
  saiyu: 'unknown',
  theta: 'unknown',
  biscuit: 'transmuter',
  marayam: 'unknown',
  phinks: 'enhancer',
  franklin: 'emitter',
  machi: 'transmuter',
  illumi: 'manipulator',
  kalluto: 'manipulator',
  bonolenov: 'conjurer',
  shizuku: 'conjurer',
  hinrigh: 'conjurer',
  mizaistom: 'unknown',
  leorio: 'emitter',
  hanzo: 'transmuter',
  rihan: 'unknown',
  zakuro: 'unknown',
  melody: 'emitter',
  basho: 'unknown',
  camilla: 'unknown',
  halkenburg: 'unknown',
  gel: 'unknown',
  lynch: 'unknown',
  luini: 'emitter',
  bill: 'enhancer',
  furykov: 'unknown',
  cluck: 'unknown',
  beyond: 'unknown',
  fugetsu: 'unknown',
  kacho: 'unknown',
  luzurus: 'unknown',
  momoze: 'unknown',
  salesale: 'unknown',
  zhanglei: 'unknown',
  gidal: 'unknown',
  longhi: 'unknown',
  musse: 'unknown',
  padaille: 'unknown',
  tubeppa: 'unknown',
  tyson: 'unknown',
  sayird: 'emitter',
  terebellum: 'unknown',
  voconte: 'unknown',
  yokotani: 'unknown',
}

export interface CanonAura {
  colour: string
  /** Where the colour was shown. A colour without a source does not belong here. */
  source: string
}

/**
 * Aura colours the manga or the 2011 anime actually showed. Only add a
 * fighter here with the scene that shows it.
 */
export const CANON_AURA_COLOURS: Readonly<Partial<Record<FighterId, CanonAura>>> = {
  kurapika: {
    colour: '#e8d44d',
    source: 'anime 2011, Yorknew — yellow aura around him and his chains against Uvogin',
  },
  hisoka: { colour: '#d946ef', source: 'anime 2011 — Bungee Gum, pink-magenta aura' },
  illumi: { colour: '#5b21b6', source: 'anime 2011 — dark violet aura' },
  feitan: { colour: '#f97316', source: 'anime 2011 — Rising Sun, red-orange aura' },
}

export function fighterNenCategory(id: FighterId): NenCategory {
  return FIGHTER_NEN_CATEGORIES[id] ?? 'unknown'
}

/** The aura colour a fighter wears, as `#rrggbb`. */
export function fighterAuraColour(id: FighterId): string {
  return CANON_AURA_COLOURS[id]?.colour ?? CATEGORY_AURA_COLOURS[fighterNenCategory(id)]
}

/** The same colour as a number, the form `buildHumanFigure` reads. */
export function fighterAuraHex(id: FighterId): number {
  return Number.parseInt(fighterAuraColour(id).slice(1), 16)
}
