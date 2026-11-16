import { chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, AttackKind } from './types'

export const ERIGERON_MOVE = 'bill:neutralSpecial'

/** Erigeron develops another living target; preparation supplies seeds in scenario mode. */
export const ERIGERON_SUPPORT = {
  mechanicFr:
    'Erigeron accélère la croissance d’un être vivant et peut favoriser le développement du Nen d’autrui. Aucun soin personnel ni bonus de combat. Le combat scénarisé peut fournir une graine vivante à faire germer ; sans cible adaptée, le Hatsu reste indisponible.',
  mechanicEn:
    'Erigeron accelerates a living target’s growth and can support another person’s Nen development. No self-healing or combat bonus. Scenario combat may supply a living seed to germinate; the Hatsu stays unavailable without a suitable target.',
  hintFr: 'Erigeron · soutien à autrui · aucune cible de soutien dans ce duel',
  hintEn: 'Erigeron · support for others · no support target in this duel',
} as const

/** Copying the ability preserves its supportive purpose and targeting requirements. */
export function isErigeronAction(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (kind !== 'special') return false
  if (fighter.id === 'bill' || moveId === ERIGERON_MOVE) return true
  return chrolloPageForMove(fighter, moveId) === 'bill'
}

/** Even a directly constructed attack cannot turn the support ability into a strike. */
export function isErigeronAttack(fighter: ArcadeFighter): boolean {
  if (!fighter.attack) return false
  if (fighter.attack.hatsuSource === 'bill') return true
  return isErigeronAction(fighter, fighter.attack.kind, fighter.attack.moveId)
}

export function erigeronHint(language: 'fr' | 'en'): string {
  return language === 'fr' ? ERIGERON_SUPPORT.hintFr : ERIGERON_SUPPORT.hintEn
}

export function erigeronPresentation(language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Erigeron · Soutien' : 'Erigeron · Support',
    ready: false,
    hint: erigeronHint(language),
  }
}
