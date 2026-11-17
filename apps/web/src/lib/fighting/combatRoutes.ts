import type { FighterId, MoveSlot } from './types'
import { FIGHTING_ROSTER } from './roster'
import { ROSTER_COMBAT_ROUTES } from './rosterCombatRoutes'
import type { RosterFighterId } from './rosterChoreography'
import { DUEL_COMBO_LESSONS } from './duelComboLessons'
import type { CombatRouteSetup } from './combatRouteSetup'

const REFERENCE_FIGHTERS = ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const
type ReferenceFighter = (typeof REFERENCE_FIGHTERS)[number]
export const COMBAT_FIGHTERS = FIGHTING_ROSTER.map((fighter) => fighter.id as RosterFighterId)
export type CombatFighter = RosterFighterId
export type CombatRouteKind = 'confirm' | 'low' | 'punish' | 'air'
export interface CombatRoute {
  id: string
  fighter: CombatFighter
  kind: CombatRouteKind
  title: readonly [string, string]
  moves: readonly MoveSlot[]
  requirement: readonly [string, string]
  setup?: CombatRouteSetup
}
const TITLES = {
  confirm: ['Confirmer une touche', 'Confirm a hit'],
  low: ['Conversion sur attaque basse', 'Convert a low hit'],
  punish: ['Punition engagée', 'Committed punish'],
  air: ['Conversion aérienne', 'Air conversion'],
} as const
const REQUIREMENTS: Record<ReferenceFighter, readonly [string, string]> = {
  kurapika: [
    'Ten et aura pour le fouet divinatoire ; aucune Chain Jail.',
    'Ten and aura for Dowsing Whip; no Chain Jail.',
  ],
  hisoka: [
    'Ten et aura pour attacher Bungee Gum ; le rappel est un repositionnement séparé.',
    'Ten and aura to attach Bungee Gum; recall is a separate repositioning action.',
  ],
  chrollo: [
    'Livre ouvert sur Sun and Moon, main disponible et aura ; la marque prépare la suite.',
    'Book open on Sun and Moon, free hand and aura; the mark prepares the next exchange.',
  ],
  benjamin: [
    'Air Blow hérité et aura disponible ; Secret Window et Culdcept restent des préparations.',
    'Inherited Air Blow and available aura; Secret Window and Culdcept remain setup actions.',
  ],
}
const ROUTES: Record<ReferenceFighter, Record<CombatRouteKind, readonly MoveSlot[]>> = {
  kurapika: {
    confirm: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    low: ['lowLight', 'forwardLight', 'forwardSpecial'],
    punish: ['backHeavy', 'forwardSpecial'],
    air: ['airLight', 'airHeavy'],
  },
  hisoka: {
    confirm: ['standingLight', 'standingHeavy', 'neutralSpecial'],
    low: ['lowLight', 'forwardLight', 'neutralSpecial'],
    punish: ['forwardHeavy', 'neutralSpecial'],
    air: ['airLight', 'airHeavy'],
  },
  chrollo: {
    confirm: ['standingLight', 'backHeavy', 'neutralSpecial'],
    low: ['lowLight', 'standingHeavy', 'neutralSpecial'],
    punish: ['forwardHeavy', 'neutralSpecial'],
    air: ['airLight', 'airHeavy'],
  },
  benjamin: {
    confirm: ['standingLight', 'standingHeavy', 'neutralSpecial'],
    low: ['lowLight', 'forwardLight', 'neutralSpecial'],
    punish: ['backHeavy', 'neutralSpecial'],
    air: ['airLight', 'airHeavy'],
  },
}
export const COMBAT_ROUTES: readonly CombatRoute[] = [
  ...REFERENCE_FIGHTERS.flatMap((fighter) =>
    (['confirm', 'low', 'punish', 'air'] as const).map((kind) => ({
      id: `${fighter}:${kind}`,
      fighter,
      kind,
      title: TITLES[kind],
      moves: ROUTES[fighter][kind],
      requirement:
        kind === 'air'
          ? ([
              'Saut en descente en Ten, près de la cible ; aucun coût de Hatsu.',
              'Descending jump in Ten near the target; no Hatsu cost.',
            ] as const)
          : REQUIREMENTS[fighter],
    })),
  ),
  ...Object.entries(ROSTER_COMBAT_ROUTES).flatMap(([id, routes]) =>
    (['confirm', 'low', 'punish', 'air'] as const).map((kind, index) => ({
      id: `${id}:${kind}`,
      fighter: id as CombatFighter,
      kind,
      title: TITLES[kind],
      moves: routes[index],
      requirement:
        kind === 'air'
          ? ([
              'Saut en descente, près de la cible ; deux coups physiques, sans préparation de Hatsu.',
              'Descending jump near the target; two physical strikes, without Hatsu preparation.',
            ] as const)
          : ([
              'Route physique en Ten : confirmer chaque touche avant la suite. Le Hatsu conserve ses propres conditions.',
              'Physical route in Ten: confirm each hit before continuing. Personal Hatsu keeps its own conditions.',
            ] as const),
    })),
  ),
  ...DUEL_COMBO_LESSONS,
]
export const combatRoutesFor = (fighter: FighterId) =>
  COMBAT_ROUTES.filter((route) => route.fighter === fighter)
export function combatRoute(id: string): CombatRoute {
  const route = COMBAT_ROUTES.find((entry) => entry.id === id)
  if (!route) throw Error('Unknown combat route')
  return route
}
