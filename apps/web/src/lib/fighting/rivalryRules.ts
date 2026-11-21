import { troupeMember } from './troupeMembership'
import type { ChrolloPage } from './chrolloBook'
import { fighterDefinition } from './roster'
import type { FightSide, FightState } from './types'

export type RivalryRuleId = 'chrollo-hisoka-preparation' | 'chain-jail-vow' | 'cats-name-trap'
export type RivalryRuleTone = 'preparation' | 'vow' | 'death'

export interface ActiveRivalryRule {
  id: RivalryRuleId
  tone: RivalryRuleTone
  sides: readonly FightSide[]
  titleFr: string
  titleEn: string
  descriptionFr: string
  descriptionEn: string
}

const HEAVENS_ARENA_PAGES: readonly ChrolloPage[] = [
  'sun-and-moon',
  'black-voice',
  'gallery-fake',
  'order-stamp',
  'convert-hands',
]

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')
const sidesWith = (state: FightState, id: FightState['player']['id']): FightSide[] =>
  (['player', 'opponent'] as const).filter((side) => state[side].id === id)

/** Canonical matchup preparation happens once, before control schemes and replay recording. */
export function applyRivalryRules(state: FightState): FightState {
  const chrollos = sidesWith(state, 'chrollo').filter((side) => state[other(side)].id === 'hisoka')
  if (!chrollos.length) return state
  let next = state
  for (const side of chrollos) {
    const fighter = next[side]
    const book = fighter.chrolloBook
    if (!book) continue
    const pages = [...book.pages]
    for (const page of HEAVENS_ARENA_PAGES) if (!pages.includes(page)) pages.push(page)
    next = { ...next, [side]: { ...fighter, chrolloBook: { ...book, pages } } }
  }
  return next
}

/** Rules shown to both players are derived from authoritative state, never stored separately. */
export function activeRivalryRules(state: FightState): ActiveRivalryRule[] {
  const rules: ActiveRivalryRule[] = []
  const chrollos = sidesWith(state, 'chrollo').filter((side) => state[other(side)].id === 'hisoka')
  if (chrollos.length)
    rules.push({
      id: 'chrollo-hisoka-preparation',
      tone: 'preparation',
      sides: chrollos,
      titleFr: 'Plan contre Hisoka',
      titleEn: 'Plan against Hisoka',
      descriptionFr:
        'Chrollo commence avec les cinq pages préparées pour la Tour Céleste. Il doit toujours ouvrir ou marquer chaque page pour l’employer.',
      descriptionEn:
        'Chrollo starts with the five pages prepared for Heavens Arena. He must still open or bookmark each page to use it.',
    })

  const kurapikas = sidesWith(state, 'kurapika')
  if (kurapikas.length) {
    const side = kurapikas[0]
    const target = state[other(side)]
    const targetName = fighterDefinition(target.id).name
    const allowed = troupeMember(target.id)
    rules.push({
      id: 'chain-jail-vow',
      tone: 'vow',
      sides: kurapikas,
      titleFr: 'Serment de Chain Jail',
      titleEn: 'Chain Jail vow',
      descriptionFr: allowed
        ? `${targetName} appartient à la Brigade Fantôme : Chain Jail est autorisée et impose le Zetsu.`
        : 'La cible n’appartient pas à la Brigade Fantôme : Chain Jail est verrouillée par le serment mortel de Kurapika.',
      descriptionEn: allowed
        ? `${targetName} belongs to the Phantom Troupe: Chain Jail is available and forces Zetsu.`
        : 'The target is not a Phantom Troupe member: Kurapika’s fatal vow locks Chain Jail.',
    })
  }

  const camillas = sidesWith(state, 'camilla')
  if (camillas.length)
    rules.push({
      id: 'cats-name-trap',
      tone: 'death',
      sides: camillas,
      titleFr: 'Piège de Cat’s Name',
      titleEn: 'Cat’s Name trap',
      descriptionFr:
        'Une mort infligée par un adversaire vivant déclenche automatiquement le Nen post-mortem de Camilla. Une décision aux points ou au temps ne suffit pas.',
      descriptionEn:
        'Death caused by a living opponent automatically triggers Camilla’s post-mortem Nen. A points or time decision is not enough.',
    })
  return rules
}
