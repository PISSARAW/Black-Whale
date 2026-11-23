import { bodyMemoryWeak } from '../bodyMemory'
import { impactCallout } from '../impactCallout'
import type { FightImpact, FightState } from '../types'
import type { FightHudMode } from './hudMode'
import { rivalSide } from './hudLayout'
import { resolvePerceptionLevel } from './opponentHudView'

export interface ResolveImpactCalloutInput {
  state: FightState
  language: 'fr' | 'en'
  mode: FightHudMode
}

const TACTICAL_WORDS = {
  fr: {
    transfer: 'TRANSFERT',
    left: 'MAIN GAUCHE',
    avoided: 'FUTUR ÉVITÉ',
    parry: 'PARADE · RYU',
    hollow: 'SON CREUX · KEN',
    cushioned: 'COUP AMORTI',
    heavy: 'IMPACT LOURD',
    clean: 'COUP FRANC',
    wall: 'PROJECTION',
    down: 'CHUTE',
    weakened: 'ZONE FRAGILISÉE',
  },
  en: {
    transfer: 'TRANSFER',
    left: 'LEFT HAND',
    avoided: 'FUTURE EVADED',
    parry: 'PARRY · RYU',
    hollow: 'HOLLOW RING · KEN',
    cushioned: 'CUSHIONED',
    heavy: 'HEAVY BLOW',
    clean: 'CLEAN HIT',
    wall: 'WALL IMPACT',
    down: 'KNOCKDOWN',
    weakened: 'WEAKENED LIMB',
  },
} as const

/**
 * Returns the numeric arcade callout in omniscient mode, or a sensory, number-free
 * callout in tactical mode enriched by Level 2 perception confirmations.
 */
export function resolveImpactCallout(input: ResolveImpactCalloutInput): string {
  const impact = input.state.impact
  if (!impact) return ''
  if (input.mode === 'omniscient') {
    return impactCallout(impact, input.language)
  }
  return formatTacticalImpact(input.state, impact, input.language)
}

function formatTacticalImpact(
  state: FightState,
  impact: FightImpact,
  language: 'fr' | 'en',
): string {
  const words = TACTICAL_WORDS[language]
  if (impact.transfer) {
    return `SWEET HOME · ${impact.transfer.backlash ? words.left : words.transfer}`
  }
  if (impact.invulnerable) return 'INVUL'
  if (impact.avoided) return words.avoided
  if (impact.parried) return words.parry
  if (impact.blocked) return impact.damage === 0 ? words.hollow : words.cushioned

  const tags = collectTacticalHitTags(state, impact, language)
  return tags.join(' · ')
}

function collectTacticalHitTags(
  state: FightState,
  impact: FightImpact,
  language: 'fr' | 'en',
): string[] {
  const words = TACTICAL_WORDS[language]
  const tags: string[] = []
  if (impact.counterHit) tags.push('COUNTER')
  else if (impact.punish) tags.push('PUNISH')
  if (impact.antiAir) tags.push('ANTI-AIR')
  if (impact.wallSplat) tags.push(words.wall)
  tags.push(impact.critical || impact.damage >= 22 ? words.heavy : words.clean)
  if (impact.knockdown) tags.push(words.down)
  if (confirmsWeakenedLimb(state, impact)) tags.push(words.weakened)
  return tags
}

/** The attacker confirms a weakened limb only if they are human and perceive at Level 2. */
function confirmsWeakenedLimb(state: FightState, impact: FightImpact): boolean {
  const observerSide = impact.attacker
  if (observerSide !== 'player' && state.mode !== 'versus-local') return false
  const level = resolvePerceptionLevel({ state, observerSide })
  if (level < 2) return false
  const defender = state[rivalSide(observerSide)]
  return bodyMemoryWeak(defender, 'hands') || bodyMemoryWeak(defender, 'feet')
}
