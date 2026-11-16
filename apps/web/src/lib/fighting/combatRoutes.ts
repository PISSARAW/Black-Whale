import type { FighterId, MoveSlot } from './types'

export const COMBAT_FIGHTERS = ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const
export type CombatFighter = (typeof COMBAT_FIGHTERS)[number]
export type CombatRouteKind = 'confirm' | 'low' | 'punish' | 'air'
export interface CombatRoute {
  id: string
  fighter: CombatFighter
  kind: CombatRouteKind
  title: readonly [string, string]
  moves: readonly MoveSlot[]
  requirement: readonly [string, string]
}
const TITLES = {
  confirm: ['Confirmer une touche', 'Confirm a hit'],
  low: ['Conversion sur attaque basse', 'Convert a low hit'],
  punish: ['Punition engagée', 'Committed punish'],
  air: ['Conversion aérienne', 'Air conversion'],
} as const
const REQUIREMENTS: Record<CombatFighter, readonly [string, string]> = {
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
const ROUTES: Record<CombatFighter, Record<CombatRouteKind, readonly MoveSlot[]>> = {
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
export const COMBAT_ROUTES: readonly CombatRoute[] = COMBAT_FIGHTERS.flatMap((fighter) =>
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
)
export const combatRoutesFor = (fighter: FighterId) =>
  COMBAT_ROUTES.filter((route) => route.fighter === fighter)
export function combatRoute(id: string): CombatRoute {
  const route = COMBAT_ROUTES.find((entry) => entry.id === id)
  if (!route) throw Error('Unknown combat route')
  return route
}
