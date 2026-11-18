import { chrolloPageForMove, chrolloPageSource, chrolloCopiedMove } from './chrolloBook'
import { historicalChrolloPage } from './chrolloHistoricalPages'
import { FIGHT_NEN_PROFILES } from './nenCatalogue.gen'
import { nenOperationPower } from './nenOperations'
import type { ArcadeFighter, FighterId } from './types'

const DEFAULT_ABILITY: Partial<Record<FighterId, string | null>> = {
  // Archive entries do not turn unknown, bodily or post-mortem actions into attack Hatsu.
  theta: null,
  biscuit: null,
  camilla: null,
  beyond: null,
  benjamin: 'air-blow',
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
  if (moveId === 'chrollo:forwardSpecial') return 'skill-hunter'
  const page = chrolloPageForMove(fighter, moveId)
  if (historicalChrolloPage(page)) return page
  if (page === 'feitan')
    return fighter.hatsuEffects.painPacker?.armour ? 'rising-sun' : 'pain-packer'
  const source = chrolloPageSource(page)
  return source ? selectedAbility(source, chrolloCopiedMove(fighter, moveId) ?? undefined) : null
}

function chainAbility(fighter: ArcadeFighter, moveId?: string): string | null {
  const held = fighter.kurapika?.held
  if (held?.used && (!moveId || moveId === held.moveId))
    return selectedAbility(held.source, held.moveId)
  const slot = moveId?.split(':')[1] ?? 'neutralSpecial'
  return KURAPIKA_ABILITIES[slot] ?? null
}

function selectedAbility(source: FighterId, moveId?: string): string | null {
  const slot = moveId?.split(':')[1] ?? 'neutralSpecial'
  if (source === 'bonolenov') return battleAbility(slot)
  if (source === 'feitan') return feitanAbility(slot)
  if (source === 'benjamin') return BENJAMIN_ABILITIES[slot] ?? null
  return variantAbility(source, slot) ?? defaultAbility(source)
}

function variantAbility(source: FighterId, slot: string): string | null {
  if (source === 'kalluto' && slot === 'backSpecial') return 'surveillance-paper-dolls'
  if (source === 'saiyu' && ['backSpecial', 'finisher'].includes(slot)) return 'saiyu-priest-staff'
  if (source === 'hisoka' && slot === 'downSpecial') return 'texture-surprise'
  return null
}

function battleAbility(slot: string): string | null {
  if (slot === 'backSpecial') return null
  if (slot === 'finisher') return 'battle-cantabile-jupiter'
  return slot === 'downSpecial' ? 'battle-cantabile-metamorphosen' : 'battle-cantabile-prologue'
}

function feitanAbility(slot: string): string | null {
  if (slot === 'neutralSpecial') return 'pain-packer'
  return slot === 'finisher' ? 'rising-sun' : null
}

function defaultAbility(source: FighterId): string | null {
  if (source in DEFAULT_ABILITY) return DEFAULT_ABILITY[source] ?? null
  return FIGHT_NEN_PROFILES[source]?.abilities[0] ?? null
}

export function abilityPower(fighter: ArcadeFighter, ability = fightAbility(fighter)): number {
  return nenOperationPower(fighter, { ability, operation: 'impact' })
}
