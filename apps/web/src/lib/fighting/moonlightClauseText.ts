import { moonlightClause, type MoonlightClause, type MoonlightClauseId } from './moonlightClauses'

export interface MoonlightClauseText {
  name: string
  terms: string
  duration: string
  reward: string
  penalty: string
}

type Language = 'fr' | 'en'

const NAMES: Record<MoonlightClauseId, [string, string]> = {
  truce: ['Trêve mutuelle', 'Mutual truce'],
  'bare-hands': ['Duel à mains nues', 'Bare-hands duel'],
  'long-truce': ['Longue trêve', 'Long truce'],
  'no-ken-surge': ['Afflux sans Ken', 'No-Ken Surge'],
}

const TERMS: Record<MoonlightClause['terms'], [string, string]> = {
  'no-attacks': [
    'Aucun coup, projectile ni technique. Déplacement, garde et Nen de base restent libres.',
    'No strikes, projectiles or techniques. Movement, guard and basic Nen remain free.',
  ],
  'no-techniques': [
    'Coups physiques sans aura chargée seulement : aucun projectile, spécial ni Hatsu.',
    'Uncharged physical strikes only: no projectiles, specials or Hatsu.',
  ],
  'no-ken': [
    'Combat libre, mais activer Ken est interdit pendant toute la durée du pacte.',
    'Full combat stays open, but activating Ken is forbidden for the duration of the pact.',
  ],
}

function rewardText(clause: MoonlightClause, language: Language): string {
  if (clause.reward === 'one-use-of-moonlight-act')
    return language === 'fr'
      ? 'Le destinataire reçoit un usage de Moonlight Act.'
      : 'The recipient receives one use of Moonlight Act.'
  if (clause.immediateAura)
    return language === 'fr'
      ? `Chaque signataire reçoit immédiatement +${clause.immediateAura} d’aura à la signature.`
      : `Each signatory immediately gains +${clause.immediateAura} aura upon signing.`
  return language === 'fr'
    ? `Chaque signataire récupère ${clause.auraReward} d’aura.`
    : `Each signatory recovers ${clause.auraReward} aura.`
}

/** Every disclosed field of a contract, in the order the recipient reads it before signing. */
export function moonlightClauseText(
  id: MoonlightClauseId,
  language: Language,
): MoonlightClauseText {
  const clause = moonlightClause(id)
  const index = language === 'fr' ? 0 : 1
  const seconds = clause.durationFrames / 60
  return {
    name: NAMES[clause.id][index],
    terms: TERMS[clause.terms][index],
    duration: language === 'fr' ? `${seconds} secondes de combat` : `${seconds} seconds of combat`,
    reward: rewardText(clause, language),
    penalty:
      language === 'fr'
        ? 'Le signataire qui rompt la clause passe en Zetsu pour une semaine de simulation, conservée entre les manches.'
        : 'A signatory who breaks the clause is held in Zetsu for one simulated week, kept across rounds.',
  }
}
