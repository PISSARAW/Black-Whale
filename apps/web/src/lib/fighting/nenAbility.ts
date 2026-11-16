import { chrolloPageForMove } from './chrolloBook'
import { FIGHT_NEN_PROFILES } from './nenCatalogue.gen'
import { abilityCategories, categoryPower } from './nenCategories'
import type { ArcadeFighter, FighterId } from './types'

const DEFAULT_ABILITY: Partial<Record<FighterId, string>> = {
  hisoka: 'bungee-gum',
  feitan: 'rising-sun',
  saiyu: 'saiyu-three-monkeys',
  bonolenov: 'battle-cantabile-jupiter',
  kalluto: 'dance-of-the-serpents-bite',
  leorio: 'leorio-remote-punch',
  kurapika: 'dowsing-chain',
}
const KURAPIKA_ABILITIES: Readonly<Record<string, string>> = {
  neutralSpecial: 'chain-jail',
  forwardSpecial: 'dowsing-chain',
  backSpecial: 'steal-chain',
  downSpecial: 'holy-chain',
  finisher: 'judgment-chain',
}
const BENJAMIN_ABILITIES: Readonly<Record<string, string>> = {
  neutralSpecial: 'air-blow',
  forwardSpecial: 'secret-window',
  downSpecial: 'culdcept',
  finisher: 'culdcept',
}

/** Resolve the actual page/borrowed action, while retaining the user's own affinity. */
export function fightAbility(
  fighter: ArcadeFighter,
  moveId = fighter.attack?.moveId,
): string | null {
  if (fighter.id === 'chrollo') return bookAbility(fighter, moveId)
  if (fighter.id === 'kurapika') return chainAbility(fighter, moveId)
  return selectedAbility(fighter.id, moveId)
}

function bookAbility(fighter: ArcadeFighter, moveId?: string): string | null {
  const page = chrolloPageForMove(fighter, moveId)
  if (page === 'sun-and-moon' || page === 'black-voice') return page
  return page ? defaultAbility(page) : null
}

function chainAbility(fighter: ArcadeFighter, moveId?: string): string | null {
  const held = fighter.kurapika?.held
  if (held?.used) return selectedAbility(held.source, held.moveId)
  const slot = moveId?.split(':')[1] ?? 'neutralSpecial'
  return KURAPIKA_ABILITIES[slot] ?? null
}

function selectedAbility(source: FighterId, moveId?: string): string | null {
  const slot = moveId?.split(':')[1] ?? 'neutralSpecial'
  if (source === 'benjamin') return BENJAMIN_ABILITIES[slot] ?? null
  if (source === 'hisoka' && slot === 'downSpecial') return 'texture-surprise'
  return defaultAbility(source)
}

function defaultAbility(source: FighterId): string | null {
  return DEFAULT_ABILITY[source] ?? FIGHT_NEN_PROFILES[source]?.abilities[0] ?? null
}

export function abilityPower(fighter: ArcadeFighter, ability = fightAbility(fighter)): number {
  const categories = abilityCategories(ability)
  if (!categories.length) return 1
  // A compound technique needs every declared component. Geometric mean keeps
  // an inefficient component relevant without multiplying unrelated flat bonuses.
  return Math.pow(
    categories.reduce((power, category) => power * categoryPower(fighter, category), 1),
    1 / categories.length,
  )
}
