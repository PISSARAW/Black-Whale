import { FIGHT_FPS } from '../fightClock'
import type { FightSide, FightState } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoRole } from './catalogue'
import type { KameoId } from './types'

type Language = 'fr' | 'en'

const ROLES: Record<KameoRole, [string, string]> = {
  soin: ['Soin', 'Healing'],
  defense: ['Défense', 'Defence'],
  boost: ['Boost', 'Boost'],
  attaque: ['Attaque', 'Attack'],
  piege: ['Piège', 'Trap'],
  zone: ['Zone', 'Zone'],
}

export interface KameoBadge {
  name: string
  role: string
  status: string
  ready: boolean
  /** 0 to 1: how much of the cooldown is still to run. */
  cooldown: number
}

/** What the HUD shows for one camp's kameo, or null when the camp has none. */
export function kameoBadge(
  state: FightState,
  side: FightSide,
  language: Language,
): KameoBadge | null {
  const slot = state.kameos?.[side]
  if (!slot) return null
  const definition = KAMEO_CATALOGUE[slot.fighter.id as KameoId]
  const lang = language === 'fr' ? 0 : 1
  const ready = slot.phase === 'reserve' && slot.cooldownFrames === 0
  return {
    name: definition.name,
    role: ROLES[definition.role][lang],
    status: kameoStatus(slot, lang, definition.auraCost),
    ready: ready && slot.fighter.aura >= definition.auraCost,
    cooldown: slot.phase === 'reserve' ? slot.cooldownFrames / definition.cooldownFrames : 0,
  }
}

function kameoStatus(
  slot: NonNullable<NonNullable<FightState['kameos']>['player']>,
  lang: 0 | 1,
  cost: number,
): string {
  if (slot.phase === 'eliminated') return ['Mort', 'Dead'][lang]
  if (slot.phase !== 'reserve') return ['En scène', 'On stage'][lang]
  if (slot.cooldownFrames > 0) {
    const seconds = Math.ceil(slot.cooldownFrames / FIGHT_FPS)
    return [`Recharge ${seconds} s`, `Cooldown ${seconds}s`][lang]
  }
  return slot.fighter.aura < cost ? ['Aura épuisée', 'Out of aura'][lang] : ['Prêt', 'Ready'][lang]
}
