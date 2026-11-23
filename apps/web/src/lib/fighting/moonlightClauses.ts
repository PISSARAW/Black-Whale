import type { ArcadeFighter } from './types'

/**
 * Moonlight Act in Clash offers a short list of fixed, balanced contracts instead of a free
 * editor. Every field below is disclosed before signature and copied into the offer, so a
 * signed agreement can never carry a term the recipient did not see.
 */
export type MoonlightClauseId = 'truce' | 'bare-hands' | 'long-truce' | 'no-ken-surge'
/**
 * `no-attacks`: no strike, projectile or technique.
 * `no-techniques`: bare strikes stay legal.
 * `no-ken`: full combat stays legal, but activating Ken breaches the pact (high-stakes PvP dilemma).
 */
export type MoonlightTerms = 'no-attacks' | 'no-techniques' | 'no-ken'
export type MoonlightReward = 'one-use-of-moonlight-act' | 'aura-for-each-signatory'
export type MoonlightPenalty = 'one-week-zetsu'

export interface MoonlightClause {
  id: MoonlightClauseId
  terms: MoonlightTerms
  reward: MoonlightReward
  penalty: MoonlightPenalty
  durationFrames: number
  /** Aura granted to each signatory by `aura-for-each-signatory`; zero otherwise. */
  auraReward: number
  /** Immediate aura surge granted to both signatories upon signing (creates real PvP temptation). */
  immediateAura?: number
}

export const MOONLIGHT_CLAUSES: readonly MoonlightClause[] = [
  {
    id: 'truce',
    terms: 'no-attacks',
    reward: 'one-use-of-moonlight-act',
    penalty: 'one-week-zetsu',
    durationFrames: 300,
    auraReward: 0,
  },
  {
    id: 'bare-hands',
    terms: 'no-techniques',
    reward: 'aura-for-each-signatory',
    penalty: 'one-week-zetsu',
    durationFrames: 480,
    auraReward: 20,
  },
  {
    id: 'long-truce',
    terms: 'no-attacks',
    reward: 'aura-for-each-signatory',
    penalty: 'one-week-zetsu',
    durationFrames: 600,
    auraReward: 35,
  },
  {
    id: 'no-ken-surge',
    terms: 'no-ken',
    reward: 'aura-for-each-signatory',
    penalty: 'one-week-zetsu',
    durationFrames: 480,
    auraReward: 0,
    immediateAura: 30,
  },
]

export const DEFAULT_MOONLIGHT_CLAUSE: MoonlightClauseId = 'truce'
export const MOONLIGHT_CLAUSE_IDS = MOONLIGHT_CLAUSES.map((clause) => clause.id)

export function moonlightClause(id: MoonlightClauseId = DEFAULT_MOONLIGHT_CLAUSE): MoonlightClause {
  return MOONLIGHT_CLAUSES.find((clause) => clause.id === id) ?? MOONLIGHT_CLAUSES[0]
}

export function isMoonlightClause(value: unknown): value is MoonlightClauseId {
  return MOONLIGHT_CLAUSE_IDS.includes(value as MoonlightClauseId)
}

/** Agreements signed before the catalogue existed carry no clause id and mean the truce. */
export function agreementClause(agreement: { clause?: MoonlightClauseId }): MoonlightClause {
  return moonlightClause(agreement.clause)
}

/** A bare, uncharged strike is the only action `no-techniques` leaves to the signatories. */
export function clausePermitsAction(terms: MoonlightTerms, after: ArcadeFighter): boolean {
  if (terms === 'no-ken') return !after.nen.ken
  if (terms === 'no-attacks') return false
  const attack = after.attack
  if (!attack || attack.auraCharged) return false
  return attack.kind === 'light' || attack.kind === 'heavy'
}

export function rewardSignatory(fighter: ArcadeFighter, clause: MoonlightClause): ArcadeFighter {
  if (clause.reward === 'one-use-of-moonlight-act')
    return { ...fighter, moonlightLoan: (fighter.moonlightLoan ?? 0) + 1 }
  return { ...fighter, aura: Math.min(100, fighter.aura + clause.auraReward) }
}
