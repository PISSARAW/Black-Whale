import type { FighterDefinition, FighterId } from './types'

export type RosterGroupId =
  | 'royal-factions'
  | 'hunter-association'
  | 'phantom-troupe'
  | 'mafia-families'
  | 'zoldyck-family'
  | 'independent'

export interface RosterGroup {
  id: RosterGroupId
  nameFr: string
  nameEn: string
  descriptionFr: string
  descriptionEn: string
}

export interface GroupedFighter extends FighterDefinition {
  affiliationFr: string
  affiliationEn: string
}

export interface FighterRosterGroup extends RosterGroup {
  fighters: GroupedFighter[]
}

interface Affiliation {
  group: RosterGroupId
  fr: string
  en: string
}

export const ROSTER_GROUPS: readonly RosterGroup[] = [
  {
    id: 'royal-factions',
    nameFr: 'Factions princières',
    nameEn: 'Royal factions',
    descriptionFr: 'Famille royale, gardes et Hunters engagés dans la Succession',
    descriptionEn: 'Royal family, guards and Hunters involved in the Succession',
  },
  {
    id: 'hunter-association',
    nameFr: 'Association Hunter',
    nameEn: 'Hunter Association',
    descriptionFr: 'Zodiaques et représentants de l’Association',
    descriptionEn: 'Zodiacs and Association representatives',
  },
  {
    id: 'phantom-troupe',
    nameFr: 'Brigade Fantôme',
    nameEn: 'Phantom Troupe',
    descriptionFr: 'Membres de l’Araignée à bord du Black Whale',
    descriptionEn: 'Members of the Spider aboard the Black Whale',
  },
  {
    id: 'mafia-families',
    nameFr: 'Familles de la mafia',
    nameEn: 'Mafia families',
    descriptionFr: 'Familles Xi-Yu et Heil-Ly',
    descriptionEn: 'Xi-Yu and Heil-Ly families',
  },
  {
    id: 'zoldyck-family',
    nameFr: 'Famille Zoldyck',
    nameEn: 'Zoldyck family',
    descriptionFr: 'Assassins de la famille Zoldyck',
    descriptionEn: 'Assassins of the Zoldyck family',
  },
  {
    id: 'independent',
    nameFr: 'Indépendants & expédition',
    nameEn: 'Independent & expedition',
    descriptionFr: 'Combattants sans faction directe dans la guerre de succession',
    descriptionEn: 'Fighters without a direct Succession War faction',
  },
] as const

const AFFILIATIONS: Partial<Record<FighterId, Affiliation>> = {
  kurapika: royal('Woble'),
  benjamin: royal('Benjamin'),
  tserriednich: royal('Tserriednich'),
  theta: royal('Tserriednich'),
  biscuit: royal('Marayam'),
  hanzo: royal('Marayam'),
  rihan: royal('Benjamin'),
  melody: royal('Kacho'),
  basho: royal('Luzurus'),
  camilla: royal('Camilla'),
  halkenburg: royal('Halkenburg'),
  bill: royal('Woble'),
  furykov: royal('Benjamin'),
  longhi: royal('Tubeppa'),
  musse: royal('Benjamin'),
  sayird: royal('Woble'),
  saiyu: hunter('Zodiaques', 'Zodiacs'),
  mizaistom: hunter('Zodiaques', 'Zodiacs'),
  leorio: hunter('Zodiaques', 'Zodiacs'),
  gel: hunter('Zodiaques', 'Zodiacs'),
  cluck: hunter('Zodiaques', 'Zodiacs'),
  chrollo: troupe(),
  feitan: troupe(),
  phinks: troupe(),
  franklin: troupe(),
  machi: troupe(),
  bonolenov: troupe(),
  shizuku: troupe(),
  hinrigh: mafia('Xi-Yu'),
  zakuro: mafia('Xi-Yu'),
  lynch: mafia('Xi-Yu'),
  luini: mafia('Heil-Ly'),
  padaille: mafia('Heil-Ly'),
  terebellum: mafia('Heil-Ly'),
  voconte: mafia('Heil-Ly'),
  yokotani: mafia('Heil-Ly'),
  illumi: zoldyck(),
  kalluto: zoldyck(),
  hisoka: independent('Indépendant', 'Independent'),
  beyond: independent('Expédition du Continent Sombre', 'Dark Continent expedition'),
}

export function groupedFightingRoster(roster: readonly FighterDefinition[]): FighterRosterGroup[] {
  return ROSTER_GROUPS.map((group) => ({
    ...group,
    fighters: roster.flatMap((fighter) => {
      const affiliation = AFFILIATIONS[fighter.id] ?? independent('Indépendant', 'Independent')
      return affiliation.group === group.id
        ? [{ ...fighter, affiliationFr: affiliation.fr, affiliationEn: affiliation.en }]
        : []
    }),
  })).filter((group) => group.fighters.length > 0)
}

export function randomDuel(
  roster: readonly FighterDefinition[],
  random: () => number = Math.random,
): [FighterId, FighterId] {
  const playerIndex = randomIndex(roster.length, random)
  const opponentIndex = randomIndex(Math.max(0, roster.length - 1), random)
  const opponent = roster[opponentIndex >= playerIndex ? opponentIndex + 1 : opponentIndex]
  return [roster[playerIndex].id, (opponent ?? roster[playerIndex]).id]
}

export function randomFighter(
  roster: readonly FighterDefinition[],
  excluded: FighterId,
  random: () => number = Math.random,
): FighterId {
  const choices = roster.filter(({ id }) => id !== excluded)
  return choices[randomIndex(choices.length, random)]?.id ?? excluded
}

function randomIndex(length: number, random: () => number): number {
  if (length <= 1) return 0
  return Math.min(length - 1, Math.floor(random() * length))
}

function royal(name: string): Affiliation {
  return { group: 'royal-factions', fr: `Faction ${name}`, en: `${name} faction` }
}

function hunter(fr: string, en: string): Affiliation {
  return { group: 'hunter-association', fr, en }
}

function troupe(): Affiliation {
  return { group: 'phantom-troupe', fr: 'Brigade Fantôme', en: 'Phantom Troupe' }
}

function mafia(name: string): Affiliation {
  return { group: 'mafia-families', fr: `Famille ${name}`, en: `${name} family` }
}

function zoldyck(): Affiliation {
  return { group: 'zoldyck-family', fr: 'Famille Zoldyck', en: 'Zoldyck family' }
}

function independent(fr: string, en: string): Affiliation {
  return { group: 'independent', fr, en }
}
