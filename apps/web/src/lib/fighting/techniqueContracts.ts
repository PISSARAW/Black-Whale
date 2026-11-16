import { BENJAMIN_CANON } from './benjaminCanon'
import { CHROLLO_CANON } from './chrolloCanon'
import { hisokaTechniqueAllowed } from './hisokaTechnique'
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
  'bill:neutralSpecial': {
    source: 'Succession Contest — chapter 388, Erigeron',
    evidence: 'manga-shown',
    conditions: ['Bill brings his palms close to a living target to accelerate its growth.'],
    prohibitions: [
      'No attested self-healing, automatic combat boost, plant attacks or low-health finisher.',
    ],
    narrativeCost: 'Targeted support; Nen development remains weak on untrained individuals.',
    narrativeEffect:
      'Accelerates living growth and can support another person’s Nen development. The current duel has no support target.',
  },
  'biscuit:neutralSpecial': {
    source: 'Greed Island — ch. 154, Biscuit reveals her natural body',
    evidence: 'manga-shown',
    conditions: ['Biscuit is in her compact form and free to act on the ground.'],
    prohibitions: ['This reveal is not an attack or Cookie treatment and cannot be stolen.'],
    narrativeCost: 'Reveals the appearance Biscuit prefers to hide; no aura cost or timer.',
    narrativeEffect: 'Returns to her natural muscular body for the rest of the round.',
  },
  'leorio:neutralSpecial': {
    source: 'Hunter × Hunter — chapter 325',
    evidence: 'manga-shown',
    conditions: ['Strike a connected solid surface to transmit the aura.'],
    prohibitions: ['No airborne aura ball, medical pulse, or low-health transformation.'],
    narrativeCost: 'Aura and commitment to striking the surface.',
    narrativeEffect: 'Aura travels through the surface and emerges as a fist at a distant point.',
  },
  'hanzo:neutralSpecial': {
    source: 'Succession Contest — chapter 372, Hanzo Skill 4',
    evidence: 'manga-shown',
    conditions: [
      'Hanzo leaves his physical body asleep and motionless to control the double.',
      'He must return to his body to end the projection voluntarily.',
    ],
    prohibitions: [
      'The double is not a substitution that absorbs an incoming attack.',
      'Touch or speech directed at the sleeping body interrupts the projection.',
      'The projected vessel does not gain physical throwing ammunition.',
    ],
    narrativeCost: 'The sleeping body cannot move or guard; the double requires his full focus.',
    narrativeEffect:
      'A precisely controlled double floats, passes through matter and can strike physically.',
  },
  'hanzo:finisher': {
    source: 'Succession Contest — chapter 372, Hanzo strangles Tuffdy with his double',
    evidence: 'manga-shown',
    conditions: ['The astral double must be active and reach the target physically.'],
    prohibitions: [
      'No remote decapitation, automatic execution or protection of the sleeping body.',
    ],
    narrativeCost: 'A close-range commitment while the physical body stays exposed.',
    narrativeEffect:
      'The double grabs and strangles the target; damage and timing are duel abstractions.',
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
    narrativeEffect:
      'The thumb chain heals the user; Enhancement efficiency rises from 60% to 100% under Emperor Time. It never strikes an opponent.',
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
    narrativeCost:
      'Requires Emperor Time to implant; the implanted rule persists when Emperor Time ends.',
    narrativeEffect: 'Breaking the imposed rules triggers the blade around the heart.',
  },
  ...CHROLLO_CANON,
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
    conditions: [
      'Hisoka must own an attached, stretched gum line; no pull is already in progress.',
    ],
    prohibitions: ['The pull follows the existing elastic attachment.'],
    narrativeCost: 'Tension exposes Hisoka if the opponent anticipates the pull.',
    narrativeEffect: 'Retracts the elastic line to alter spacing.',
  },
  'hisoka:downSpecial': {
    source: 'Heavens Arena — Texture Surprise',
    evidence: 'manga-shown',
    conditions: [
      'A thin, flat surface must receive the texture: the existing shirt panel in this duel.',
    ],
    prohibitions: [
      'It changes appearance, never substance, health, collisions, or invulnerability.',
    ],
    narrativeCost:
      'Grounded preparation and aura; incoming contact exposes the cloth disguise (duel adaptation).',
    narrativeEffect: 'Disguises the cloth panel as skin without changing the physical costume.',
  },
  'hisoka:backSpecial': {
    source: 'Heavens Arena — Bungee Gum recoil',
    evidence: 'manga-shown',
    conditions: [
      'Hisoka must own a stretched gum line; the attached opponent serves as the duel anchor.',
    ],
    prohibitions: ['The rebound cannot occur without stored elastic tension.'],
    narrativeCost: 'A predictable anchor can be punished.',
    narrativeEffect:
      'Releases stored tension to launch Hisoka toward the anchor, without moving the target.',
  },
  'hisoka:finisher': {
    source: 'Heavens Arena / Yorknew — cards and Bungee Gum combination',
    evidence: 'gameplay-abstraction',
    conditions: ['Bungee Gum must be attached to the opponent.'],
    prohibitions: ['This named sequence is a competitive composition, not a manga attack name.'],
    narrativeCost: 'Spends aura on startup and consumes the attachment on a successful strike.',
    narrativeEffect: 'A lethal card sequence accelerated by elastic retraction.',
  },
}

export function techniqueContract(
  move: Pick<FighterMove, 'id' | 'category'>,
): TechniqueCanonContract {
  const defined = CONTRACTS[move.id as `${FighterId}:${MoveSlot}`]
  if (defined) return defined
  if (BENJAMIN_CANON[move.id]) return BENJAMIN_CANON[move.id]
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
  if (!hisokaTechniqueAllowed(state, side, move.id)) return false
  if (move.id !== 'kurapika:neutralSpecial') return true
  const opponent = state[side === 'player' ? 'opponent' : 'player']
  return PHANTOM_TROUPE.has(opponent.id)
}
