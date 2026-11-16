import type { FighterMove } from './movesetTypes'
import type { FightSide, FightState, FighterId, MoveSlot } from './types'

export type CanonEvidence = 'manga-shown' | 'manga-stated' | 'gameplay-abstraction'

export interface TechniqueCanonContract {
  source: string
  evidence: CanonEvidence
  conditions: readonly string[]
  prohibitions: readonly string[]
  narrativeCost: string
  narrativeEffect: string
}

const PHANTOM_TROUPE = new Set<FighterId>([
  'chrollo',
  'feitan',
  'phinks',
  'franklin',
  'illumi',
  'machi',
  'kalluto',
  'bonolenov',
  'shizuku',
])

const CONTRACTS: Partial<Record<`${FighterId}:${MoveSlot}`, TechniqueCanonContract>> = {
  'leorio:neutralSpecial': {
    source: 'Hunter × Hunter — chapter 325',
    evidence: 'manga-shown',
    conditions: ['Strike a connected solid surface to transmit the aura.'],
    prohibitions: ['No airborne aura ball, medical pulse, or low-health transformation.'],
    narrativeCost: 'Aura and commitment to striking the surface.',
    narrativeEffect: 'Aura travels through the surface and emerges as a fist at a distant point.',
  },
  'kurapika:neutralSpecial': {
    source: 'Yorknew City — Chain Jail and Kurapika’s limiting vow',
    evidence: 'manga-shown',
    conditions: ['The target must be an active member of the Phantom Troupe.'],
    prohibitions: ['Using Chain Jail on anyone else would cost Kurapika his life.'],
    narrativeCost: 'A lethal Judgment Chain is placed around Kurapika’s own heart.',
    narrativeEffect: 'The captured Spider is restrained and forced into Zetsu.',
  },
  'kurapika:forwardSpecial': {
    source: 'Yorknew City — Dowsing Chain',
    evidence: 'manga-shown',
    conditions: ['Kurapika must be able to direct the chain from his right hand.'],
    prohibitions: ['It does not inherit Chain Jail’s forced-Zetsu effect.'],
    narrativeCost: 'Aura is conducted through the chain.',
    narrativeEffect: 'Kurapika’s primary combat chain controls range and checks incoming attacks.',
  },
  'kurapika:downSpecial': {
    source: 'Yorknew City — Holy Chain',
    evidence: 'manga-shown',
    conditions: ['Its full restorative power requires Emperor Time.'],
    prohibitions: ['It cannot impose Zetsu on an opponent.'],
    narrativeCost: 'Emperor Time consumes Kurapika’s lifespan while active.',
    narrativeEffect: 'Accelerated recovery, represented competitively by a defensive step.',
  },
  'kurapika:backSpecial': {
    source: 'Succession Contest — Steal Chain',
    evidence: 'manga-shown',
    conditions: ['The syringe must pierce the target and drain their aura.'],
    prohibitions: ['A stolen ability is not equivalent to Chain Jail.'],
    narrativeCost: 'The extracted ability must be managed through Stealth Dolphin.',
    narrativeEffect: 'Drains aura and temporarily steals an ability.',
  },
  'kurapika:finisher': {
    source: 'Yorknew City — Judgment Chain',
    evidence: 'manga-shown',
    conditions: ['Kurapika states rules that bind the target’s heart.'],
    prohibitions: ['It is not Chain Jail and is not restricted to the Phantom Troupe.'],
    narrativeCost: 'Requires precise chain control and, at full power, Emperor Time.',
    narrativeEffect: 'Breaking the imposed rules triggers the blade around the heart.',
  },
  'chrollo:neutralSpecial': {
    source: 'Yorknew City — Skill Hunter (Bandit’s Secret)',
    evidence: 'manga-stated',
    conditions: [
      'Chrollo must have seen the ability in action.',
      'The user’s palm must touch the book (abstracted as a clean hit).',
      'The canon question and answer cannot be played in a duel and are omitted.',
    ],
    prohibitions: ['The owner cannot use an ability while it is held in the book.'],
    narrativeCost: 'Only the page Skill Hunter holds can be replayed.',
    narrativeEffect: 'Steals the opponent’s Hatsu, then replays it.',
  },
  'chrollo:forwardSpecial': {
    source: 'Succession Contest — Black Voice (Shalnark)',
    evidence: 'manga-shown',
    conditions: ['The antenna must strike the target.'],
    prohibitions: ['There is no control without a planted antenna.'],
    narrativeCost: 'One antenna, one puppet.',
    narrativeEffect: 'Remote control, represented as a short lock.',
  },
  'chrollo:downSpecial': {
    source: 'Succession Contest — The Sun and Moon',
    evidence: 'manga-shown',
    conditions: ['The Sun mark is stamped on contact.'],
    prohibitions: ['A single mark never explodes.'],
    narrativeCost: 'Needs the Moon mark to pay off.',
    narrativeEffect: 'Stamps the Sun mark.',
  },
  'chrollo:backSpecial': {
    source: 'Succession Contest — The Sun and Moon',
    evidence: 'manga-shown',
    conditions: ['The Moon mark is stamped on contact.'],
    prohibitions: ['A single mark never explodes.'],
    narrativeCost: 'Needs the Sun mark to pay off.',
    narrativeEffect: 'Stamps the Moon mark.',
  },
  'chrollo:finisher': {
    source: 'Succession Contest — The Sun and Moon detonation',
    evidence: 'manga-shown',
    conditions: ['One of the two marks must already be stamped.'],
    prohibitions: ['The explosion requires both marks to meet.'],
    narrativeCost: 'Consumes both marks.',
    narrativeEffect: 'Stamps the missing mark; the pair explodes.',
  },
  'hisoka:neutralSpecial': {
    source: 'Heavens Arena — Bungee Gum',
    evidence: 'manga-shown',
    conditions: ['Hisoka must attach his aura to the target or a surface.'],
    prohibitions: ['Elasticity pulls and rebounds; it does not teleport a target.'],
    narrativeCost: 'The gum remains connected until detached or released.',
    narrativeEffect: 'Aura with the properties of both rubber and gum binds the target.',
  },
  'hisoka:forwardSpecial': {
    source: 'Heavens Arena — Bungee Gum retraction',
    evidence: 'manga-shown',
    conditions: ['Bungee Gum must already be attached.'],
    prohibitions: ['The pull follows the existing elastic attachment.'],
    narrativeCost: 'Tension exposes Hisoka if the opponent anticipates the pull.',
    narrativeEffect: 'Retracts the elastic line to alter spacing.',
  },
  'hisoka:downSpecial': {
    source: 'Heavens Arena — Texture Surprise',
    evidence: 'manga-shown',
    conditions: ['A thin, flat surface must receive the texture.'],
    prohibitions: ['It changes appearance and texture, not the underlying substance.'],
    narrativeCost: 'The deception collapses once the covered surface is exposed.',
    narrativeEffect: 'Creates a visual feint, abstracted as a defensive mix-up.',
  },
  'hisoka:backSpecial': {
    source: 'Heavens Arena — Bungee Gum recoil',
    evidence: 'manga-shown',
    conditions: ['Hisoka needs an anchor or a stretched gum line.'],
    prohibitions: ['The rebound cannot occur without stored elastic tension.'],
    narrativeCost: 'A predictable anchor can be punished.',
    narrativeEffect: 'Releases stored tension for sudden movement or a counterattack.',
  },
  'hisoka:finisher': {
    source: 'Heavens Arena / Yorknew — cards and Bungee Gum combination',
    evidence: 'gameplay-abstraction',
    conditions: ['Bungee Gum must be attached to the opponent.'],
    prohibitions: ['This named sequence is a competitive composition, not a manga attack name.'],
    narrativeCost: 'Consumes the attachment and a large amount of aura.',
    narrativeEffect: 'A lethal card sequence accelerated by elastic retraction.',
  },
}

export function techniqueContract(
  move: Pick<FighterMove, 'id' | 'category'>,
): TechniqueCanonContract {
  const defined = CONTRACTS[move.id as `${FighterId}:${MoveSlot}`]
  if (defined) return defined
  return {
    source: 'Black Whale: Clash combat interpretation',
    evidence: 'gameplay-abstraction',
    conditions: ['Standard combat and aura rules apply.'],
    prohibitions: ['This move must not invent a new Nen ability.'],
    narrativeCost: move.category === 'normal' ? 'Physical commitment.' : 'Aura and recovery.',
    narrativeEffect: 'Competitive expression of established martial ability.',
  }
}

export function canonicalTechniqueAllowed(
  state: FightState,
  side: FightSide,
  move: Pick<FighterMove, 'id'>,
): boolean {
  if (move.id !== 'kurapika:neutralSpecial') return true
  const opponent = state[side === 'player' ? 'opponent' : 'player']
  return PHANTOM_TROUPE.has(opponent.id)
}
