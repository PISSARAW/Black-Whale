import type { FighterId } from './types'

export interface CanonCombatRule {
  fighter: FighterId
  sourceChapters: readonly string[]
  attested: readonly string[]
  gameplayAdaptations: readonly string[]
  prohibitedExtrapolations: readonly string[]
}

type RuleArguments = [
  fighter: FighterId,
  sourceChapters: readonly string[],
  attested: readonly string[],
  gameplayAdaptations: readonly string[],
  prohibitedExtrapolations: readonly string[],
]

const rule = (
  ...[
    fighter,
    sourceChapters,
    attested,
    gameplayAdaptations,
    prohibitedExtrapolations,
  ]: RuleArguments
): CanonCombatRule => ({
  fighter,
  sourceChapters,
  attested,
  gameplayAdaptations,
  prohibitedExtrapolations,
})

/**
 * Canon boundary for the character-specific combat project.
 * Numeric timings and ranges may be tuned, but no implementation may cross a listed prohibition.
 */
export const CANON_COMBAT_RULES = {
  rihan: rule(
    'rihan',
    ['374–375'],
    [
      'Personal observation of a live manifestation',
      'Specialized Predator',
      '48 hours without Nen after success',
    ],
    ['Observation time and visible certainty feedback'],
    ['Facts supplied by allies', 'Generic weak Predator', 'Passive defence or category resistance'],
  ),
  camilla: rule(
    'camilla',
    ['373'],
    ['Attributed death', 'Cat kills the living responsible attacker', 'Camilla resurrects'],
    ['Non-lethal duel victories'],
    ['Zetsu as an activation condition', 'Trigger on KO, points or timeout'],
  ),
  halkenburg: rule(
    'halkenburg',
    ['382', '403–404'],
    [
      'Marked consenting group with common will',
      'Unblockable arrow',
      'Persistent consciousness exchange',
    ],
    ['Compressed preparation time and deterministic replay draw'],
    ['Temporary stun substitute', 'Created followers', 'Hatsu inherited from the occupied body'],
  ),
  saiyu: rule(
    'saiyu',
    ['348'],
    ['Contact removes sight, hearing or speech according to the monkey'],
    ['Player-specific audiovisual presentation'],
    ['Automatic Zetsu', 'Stun', 'Global silence field'],
  ),
  terebellum: rule(
    'terebellum',
    ['399'],
    [
      'Left hand routes own wound',
      'Right then left routes another body wound',
      'Real simultaneous contacts',
    ],
    ['Physical arena objects as receptacles'],
    ['Timed abstract damage storage', 'Free direct status transfer', 'Remote routing'],
  ),
  voconte: rule(
    'voconte',
    ['398–399'],
    ['Connected physical doorframes', 'Traversal through the triggering threshold'],
    ['Represented rooms within the arena system'],
    ['Portal on arbitrary surfaces', 'Luini conditions copied onto Door'],
  ),
  longhi: rule(
    'longhi',
    ['401'],
    [
      'Disclosed fixed terms',
      'Two voluntary signatures',
      'Reward and penalty bind actual signatories',
    ],
    ['Short predefined duel contracts'],
    ['Consent on hit', 'Hidden clause', 'Effect on a non-signatory'],
  ),
  yokotani: rule(
    'yokotani',
    ['399'],
    [
      'Heil-Ly hideout',
      'Morena present',
      'Introduction and real offence',
      'Invulnerable guards expel without injury',
    ],
    ['Compressed escort speed and arena boundary'],
    ['Use in an ordinary arena', 'Direct damage', 'Automatic personal invulnerability'],
  ),
  leorio: rule(
    'leorio',
    ['347'],
    ['Strike transmitted through a solid surface'],
    ['Selectable exit within bounded reach'],
    ['Medical sonar', 'Aura detection', 'Multiple simultaneous fists'],
  ),
  bill: rule(
    'bill',
    ['388'],
    ['Erigeron accelerates growth in a suitable living target', 'Weak effect on untrained people'],
    ['A real nearby seed as a scenario target'],
    ['Personal healing', 'Aura regeneration buff', 'Poison or burn catalyst', 'Offensive roots'],
  ),
  mizaistom: rule(
    'mizaistom',
    ['346'],
    ['Perceived warning precedes Cross Game restraint', 'Restraint follows real disobedience'],
    ['Closed set of duel-relevant orders'],
    ['Direct-damage card', 'Automatic hitstun', 'Zetsu', 'Second red-card combat engine'],
  ),
  gel: rule(
    'gel',
    ['390'],
    ['Arm transformation extends physical striking reach'],
    ['Directional attacks and arcade reach'],
    ['Venom', 'Aura drain', 'Automatic restraint', 'Protective shedding'],
  ),
  padaille: rule(
    'padaille',
    ['391'],
    ['Right hand transforms into the shown hammer, drill, or axe'],
    ['Direct tool selection, reach and recovery'],
    ['Automatic guard piercing', 'Guaranteed wound', 'Extra Body Memory', 'Unshown tools'],
  ),
  beyond: rule(
    'beyond',
    ['340–341', '401–404'],
    ['Prepared sacrificial curses require marked vessels and designated targets'],
    ['Martial duel moves while the curse preparation is absent'],
    ['Inherited Isaac ability', 'Gyo saturation', 'Reduced Ren cost', 'Superior Ko multiplier'],
  ),
  musse: rule(
    'musse',
    ['366', '373'],
    ['Contact owl reports bodily actions and words', 'Shoulder owl listens through obstacles'],
    ['Private observation journal'],
    ['Aura reading', 'Future or input prediction', 'Cancelling In', 'Paralysis or damage'],
  ),
  sayird: rule(
    'sayird',
    ['360–361', '364', '369'],
    ['Aura ball captures a real small animal', 'Owner receives its sight and hearing'],
    ['Local animal navigation controls'],
    ['Conjured free animal', 'Animal combat buff', 'Thought transmission'],
  ),
  zakuro: rule(
    'zakuro',
    ['390'],
    ['Real manipulated blood', 'Physical drops and grasp', 'Carried transfusion equipment'],
    ['Finite duel blood reserve'],
    ['Free blood generation', 'Automatic detection of In or Zetsu', 'Aura vision'],
  ),
  bonolenov: rule(
    'bonolenov',
    ['225–226', '405'],
    [
      'Body-hole music precedes each piece',
      'Distinct Prologue, Jupiter and Metamorphosen',
      'Spoken exchange for learned model',
    ],
    ['Interruptible performance timing'],
    ['Copied powers', 'Generic acoustic Nen-transfer penalty'],
  ),
  biscuit: rule(
    'biscuit',
    ['177', '201–202'],
    [
      'Voluntary return to natural body',
      'Cookie is a separate masseuse',
      'Piano Massage requires sleep',
    ],
    ['Form-specific physical tuning and compressed rest time'],
    ['Aura cost for transformation', 'Instant wound healing', 'Clone of natural body'],
  ),
  kalluto: rule(
    'kalluto',
    ['226'],
    [
      'Attached fragments and listening dolls',
      'Physical cutting paper can be dispersed and gathered',
    ],
    ['Finite persistent paper lots'],
    ['Universal sensor paper', 'Aura detection', 'Thought reading', 'Explosive marks'],
  ),
  hinrigh: rule(
    'hinrigh',
    ['390–391', '398'],
    ['Real touched objects become animals while retaining original function'],
    ['Finite prepared equipment inventory'],
    ['Created source equipment', 'Free ammunition', 'Unrelated animal function'],
  ),
  shizuku: rule(
    'shizuku',
    ['229–230'],
    [
      'Named non-living target',
      'Nen rejected',
      'Only last swallowed object can be returned',
      'Blood requires an open wound',
    ],
    ['Vacuum rate and duel range'],
    ['Living target swallowed', 'Aura drain through blood', 'History of every swallowed object'],
  ),
  machi: rule(
    'machi',
    ['78', '225', '357'],
    ['Real threads for suture, tracking and binding', 'Strength depends on deployed length'],
    ['Finite duel thread budget'],
    ['Independent paralysis', 'Forced exit from Zetsu', 'Regenerated flesh or limbs'],
  ),
  phinks: rule(
    'phinks',
    ['226'],
    ['Complete right-arm rotations empower one punch'],
    ['Numeric gain and miss-consumption rule'],
    ['Global buff', 'Automatic recoil threshold', 'Stored half-charge after cancellation'],
  ),
  franklin: rule(
    'franklin',
    ['73–75'],
    ['Severed fingertips improve emitted bullets', 'Sustained fire from both hands'],
    ['Projectile cadence, spread, recovery and finite aura cost'],
    ['Extra Ken aura drain', 'Automatic suppression status', 'Unrelated firearm mechanics'],
  ),
  feitan: rule(
    'feitan',
    ['228–229'],
    [
      'Real injuries feed Pain Packer',
      'Rising Sun follows Pain Packer',
      'Thermal protection is separate',
    ],
    ['Heat, radius and duration'],
    ['Body-part charge multipliers', 'Ken as universal immunity', 'Unshown Pain Packer variants'],
  ),
  furykov: rule(
    'furykov',
    ['369'],
    ['Immediate alert when concealed Nen is directed at him', 'Unknown source remains unknown'],
    ['Alert presentation and Gyo follow-up'],
    [
      'Aura reserve brackets',
      'Category resistance',
      'Automatic counter',
      'General intention reading',
    ],
  ),
  lynch: rule(
    'lynch',
    ['390', '405'],
    [
      'Audible question followed by a real punch on a conscious target',
      'Private answer from the soul',
    ],
    ['Questions limited to represented facts'],
    ['General memory reading', 'Deck reveal', 'Ko, Ryu or Hatsu prediction', 'Damage bonus'],
  ),
  theta: rule(
    'theta',
    ['385–387'],
    ['Material handgun', 'Basic Nen and trained soldier behaviour', 'Personal Hatsu unknown'],
    ['Martial AI, ammunition and reload timing'],
    ['Nen bullet', 'Stress-hiding power', 'Automatic punishment of aura mistakes'],
  ),
  kurapika: rule(
    'kurapika',
    ['83', '108', '361–369'],
    [
      'Chain Jail only on active Troupe members under fatal vow',
      'Identity differs from appearance',
      'Five chains retain separate conditions',
    ],
    ['Arcade reach and explicit identity evidence'],
    ['Chain Jail against everyone', 'Automatic identity knowledge', 'Merged chain restrictions'],
  ),
} as const satisfies Record<string, CanonCombatRule>

export type CanonCombatRuleId = keyof typeof CANON_COMBAT_RULES

export function canonCombatRule(id: CanonCombatRuleId): CanonCombatRule {
  return CANON_COMBAT_RULES[id]
}
