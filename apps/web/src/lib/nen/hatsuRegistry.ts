export type HatsuInteractionKind =
  | 'elastic'
  | 'disguise'
  | 'scarlet'
  | 'chain-rule'
  | 'chain-bind'
  | 'dowsing'
  | 'enhance'
  | 'control'
  | 'growth'
  | 'vehicle'
  | 'scout'
  | 'tribunal'
  | 'curse'
  | 'inherit'
  | 'blast'
  | 'surveillance'
  | 'capture'
  | 'future'
  | 'arrow'
  | 'guardian'
  | 'portal'
  | 'resurrection'
  | 'poetry'
  | 'restoration'
  | 'transformation'
  | 'rhythm'
  | 'impact'
  | 'mimicry'
  | 'theft'
  | 'bookmark'
  | 'devour'
  | 'pocket'
  | 'teleport'
  | 'polarity'
  | 'command'
  | 'identity-swap'
  | 'divination'
  | 'prophecy'
  | 'clone'
  | 'puppet'
  | 'barrage'
  | 'projection'
  | 'animate'
  | 'needle'
  | 'paper-spy'
  | 'shred'
  | 'remote-strike'
  | 'spatial'
  | 'stitch'
  | 'melody'
  | 'infection'
  | 'windup'
  | 'predator'
  | 'staff'
  | 'senses'
  | 'vacuum'
  | 'snakes'
  | 'training-shot'
  | 'serpent'
  | 'flock'
  | 'relay'
  | 'postmortem-curse'
  | 'healing'
  | 'heart-vow'
  | 'ability-loan'
  | 'contract'
  | 'truth-punch'
  | 'blood-search'
  | 'legal-defense'
  | 'damage-transfer'
  | 'door-network'
  | 'weapon-body'
  | 'coercive-beast'
  | 'coin-growth'
  | 'lie-marks'
  | 'drug-synthesis'
  | 'aura-levy'
  | 'desire-trap'
  | 'diffusive-smoke'
  | 'solicitation'
  | 'room-isolation'

export interface HatsuProfile {
  id: string
  name: string
  owner: string
  kind: HatsuInteractionKind
  instruction: string
  rule: string
  cost: string
  color: string
  action: string
}

export type HatsuSiteImpact =
  | 'navigation'
  | 'map-state'
  | 'control'
  | 'content-access'
  | 'layout'
  | 'storage'
  | 'data-revelation'
  | 'simulation-state'

/**
 * Functional contract for the interaction layer. A Hatsu may add visuals, but
 * it must also alter one of these real site capabilities; "visual" is
 * intentionally not a valid impact category.
 */
export const HATSU_SITE_IMPACT_BY_KIND = {
  elastic: 'layout', disguise: 'content-access', scarlet: 'control', 'chain-rule': 'control',
  'chain-bind': 'control', dowsing: 'navigation', enhance: 'control', control: 'layout',
  growth: 'content-access', vehicle: 'layout', scout: 'data-revelation', tribunal: 'control',
  curse: 'control', inherit: 'control', blast: 'layout', surveillance: 'data-revelation',
  capture: 'control', future: 'data-revelation', arrow: 'map-state', guardian: 'simulation-state',
  portal: 'map-state', resurrection: 'control', poetry: 'navigation', restoration: 'map-state',
  transformation: 'content-access', rhythm: 'navigation', impact: 'content-access', mimicry: 'control',
  theft: 'control', bookmark: 'layout', devour: 'content-access', pocket: 'storage',
  teleport: 'layout', polarity: 'control', command: 'layout', 'identity-swap': 'layout',
  divination: 'navigation', prophecy: 'navigation', clone: 'control', puppet: 'control',
  barrage: 'layout', projection: 'navigation', animate: 'control', needle: 'control',
  'paper-spy': 'data-revelation', shred: 'content-access', 'remote-strike': 'control', spatial: 'storage',
  stitch: 'control', melody: 'navigation', infection: 'control', windup: 'content-access',
  predator: 'content-access', staff: 'control', senses: 'control', vacuum: 'storage',
  snakes: 'control', 'training-shot': 'control', serpent: 'control', flock: 'navigation',
  relay: 'storage', 'postmortem-curse': 'control', healing: 'content-access', 'heart-vow': 'control',
  'ability-loan': 'control', contract: 'control', 'truth-punch': 'data-revelation', 'blood-search': 'navigation',
  'legal-defense': 'control', 'damage-transfer': 'simulation-state', 'door-network': 'navigation', 'weapon-body': 'control',
  'coercive-beast': 'control', 'coin-growth': 'simulation-state', 'lie-marks': 'control', 'drug-synthesis': 'content-access',
  'aura-levy': 'control', 'desire-trap': 'control', 'diffusive-smoke': 'control', solicitation: 'control',
  'room-isolation': 'content-access'
} satisfies Record<HatsuInteractionKind, HatsuSiteImpact>

export const siteImpactFor = (profile: HatsuProfile) => HATSU_SITE_IMPACT_BY_KIND[profile.kind]

export type HatsuVisualSignature = {
  glyph: string
  manifestation: string
  form: 'aura' | 'chain' | 'beast' | 'weapon' | 'field' | 'mark' | 'construct' | 'organic'
  motion: 'pulse' | 'orbit' | 'strike' | 'drift' | 'coil' | 'bloom' | 'scan' | 'flicker'
}

/** Canon-facing visual language used by both the active aura seal and impacts. */
export const HATSU_VISUAL_SIGNATURE_BY_KIND = {
  elastic: { glyph: '↝', manifestation: 'Elastic gum filament', form: 'aura', motion: 'coil' },
  disguise: { glyph: '▧', manifestation: 'Forged texture sheet', form: 'construct', motion: 'flicker' },
  scarlet: { glyph: '◉', manifestation: 'Scarlet eyes', form: 'mark', motion: 'pulse' },
  'chain-rule': { glyph: '⛓', manifestation: 'Syringe index chain', form: 'chain', motion: 'strike' },
  'chain-bind': { glyph: '⌁', manifestation: 'Restraining middle chain', form: 'chain', motion: 'coil' },
  dowsing: { glyph: '◇', manifestation: 'Dowsing pendulum', form: 'chain', motion: 'scan' },
  enhance: { glyph: '✦', manifestation: 'Royal Ren mantle', form: 'aura', motion: 'pulse' },
  control: { glyph: '♛', manifestation: 'Royal command threads', form: 'aura', motion: 'orbit' },
  growth: { glyph: '❧', manifestation: 'Erigeron sprout', form: 'organic', motion: 'bloom' },
  vehicle: { glyph: '▰', manifestation: 'Five-seat transformed hull', form: 'construct', motion: 'drift' },
  scout: { glyph: '◉', manifestation: 'Little Eye familiar', form: 'beast', motion: 'scan' },
  tribunal: { glyph: '■', manifestation: 'Cross Game penalty card', form: 'construct', motion: 'flicker' },
  curse: { glyph: '⌖', manifestation: 'Sacrificial birthmark', form: 'mark', motion: 'pulse' },
  inherit: { glyph: '★★★★', manifestation: 'Four-star palm', form: 'mark', motion: 'bloom' },
  blast: { glyph: '◁', manifestation: 'Compressed palm shock', form: 'aura', motion: 'strike' },
  surveillance: { glyph: '♧', manifestation: 'Secret Window owl', form: 'beast', motion: 'orbit' },
  capture: { glyph: '▣', manifestation: 'Culdcept acquisition card', form: 'construct', motion: 'flicker' },
  future: { glyph: '◫', manifestation: 'Parallel future frame', form: 'field', motion: 'flicker' },
  arrow: { glyph: '➶', manifestation: 'Grimmel soul arrow', form: 'weapon', motion: 'strike' },
  guardian: { glyph: '♙', manifestation: 'Kacho post-mortem double', form: 'beast', motion: 'drift' },
  portal: { glyph: '◯', manifestation: 'Magical Worm door', form: 'field', motion: 'orbit' },
  resurrection: { glyph: '♾', manifestation: 'Cat counteractive beast', form: 'beast', motion: 'strike' },
  poetry: { glyph: '句', manifestation: 'Materialized haiku verse', form: 'construct', motion: 'bloom' },
  restoration: { glyph: '✿', manifestation: 'Cookie massage aura', form: 'beast', motion: 'pulse' },
  transformation: { glyph: '◆', manifestation: 'Biscuit true-body seal', form: 'organic', motion: 'bloom' },
  rhythm: { glyph: '♫', manifestation: 'Prologue battle rhythm', form: 'aura', motion: 'orbit' },
  impact: { glyph: '♃', manifestation: 'Jupiter crushing sphere', form: 'construct', motion: 'strike' },
  mimicry: { glyph: '♬', manifestation: 'Metamorphosen war mask', form: 'construct', motion: 'flicker' },
  theft: { glyph: '▤', manifestation: 'Bandit’s Secret book', form: 'construct', motion: 'flicker' },
  bookmark: { glyph: '▮', manifestation: 'Double Face bookmark', form: 'construct', motion: 'pulse' },
  devour: { glyph: '⌇', manifestation: 'Indoor Fish bite', form: 'beast', motion: 'drift' },
  pocket: { glyph: '◇', manifestation: 'Fun Fun Cloth bundle', form: 'construct', motion: 'coil' },
  teleport: { glyph: '⇄', manifestation: 'Chrollo displacement cross', form: 'field', motion: 'flicker' },
  polarity: { glyph: '☀☾', manifestation: 'Sun and Moon marks', form: 'mark', motion: 'orbit' },
  command: { glyph: '人', manifestation: 'Order Stamp puppet seal', form: 'mark', motion: 'drift' },
  'identity-swap': { glyph: '↔', manifestation: 'Convert Hands palms', form: 'mark', motion: 'flicker' },
  divination: { glyph: '♡', manifestation: 'Love Dial handset', form: 'construct', motion: 'scan' },
  prophecy: { glyph: '✍', manifestation: 'Ghostwriter quill', form: 'construct', motion: 'drift' },
  clone: { glyph: '▦', manifestation: 'Gallery Fake duplicate', form: 'construct', motion: 'flicker' },
  puppet: { glyph: '⌁', manifestation: 'Black Voice antenna', form: 'weapon', motion: 'pulse' },
  barrage: { glyph: '••', manifestation: 'Severed-finger aura volley', form: 'weapon', motion: 'strike' },
  projection: { glyph: '☍', manifestation: 'Hanzo astral double', form: 'beast', motion: 'drift' },
  animate: { glyph: '♞', manifestation: 'Biohazard animal-machine', form: 'organic', motion: 'bloom' },
  needle: { glyph: '†', manifestation: 'Needle Person pin', form: 'weapon', motion: 'strike' },
  'paper-spy': { glyph: '人', manifestation: 'Paper surveillance doll', form: 'construct', motion: 'drift' },
  shred: { glyph: '✣', manifestation: 'Serpent’s paper confetti', form: 'weapon', motion: 'orbit' },
  'remote-strike': { glyph: '拳', manifestation: 'Surface-emerging fist', form: 'weapon', motion: 'strike' },
  spatial: { glyph: '▱', manifestation: 'Luini hidden-room hatch', form: 'field', motion: 'flicker' },
  stitch: { glyph: '××', manifestation: 'Machi aura sutures', form: 'chain', motion: 'coil' },
  melody: { glyph: '♪', manifestation: 'Melody aura score', form: 'aura', motion: 'drift' },
  infection: { glyph: '☣', manifestation: 'Contagion level mark', form: 'mark', motion: 'pulse' },
  windup: { glyph: '↻', manifestation: 'Cyclotron arm rotation', form: 'aura', motion: 'orbit' },
  predator: { glyph: '◈', manifestation: 'Predator counter-beast', form: 'beast', motion: 'scan' },
  staff: { glyph: '│', manifestation: 'Extending priest staff', form: 'weapon', motion: 'strike' },
  senses: { glyph: '見聞言', manifestation: 'Three sense monkeys', form: 'beast', motion: 'orbit' },
  vacuum: { glyph: '◁', manifestation: 'Blinky vacuum mouth', form: 'beast', motion: 'coil' },
  snakes: { glyph: '∿∿', manifestation: 'Silent Majority snakes', form: 'beast', motion: 'coil' },
  'training-shot': { glyph: '◎', manifestation: 'Theta’s weak aura shot', form: 'aura', motion: 'strike' },
  serpent: { glyph: '§', manifestation: 'Gel transformed snake arm', form: 'organic', motion: 'coil' },
  flock: { glyph: '⌁', manifestation: 'Cluck delivery flock', form: 'beast', motion: 'drift' },
  relay: { glyph: '▻▻', manifestation: 'Tokarine transport relay', form: 'field', motion: 'drift' },
  'postmortem-curse': { glyph: '灰', manifestation: 'Yomotsu Hegui ash curse', form: 'mark', motion: 'flicker' },
  healing: { glyph: '✚', manifestation: 'Holy Chain cross', form: 'chain', motion: 'pulse' },
  'heart-vow': { glyph: '♢', manifestation: 'Judgment heart blade', form: 'chain', motion: 'strike' },
  'ability-loan': { glyph: '◡', manifestation: 'Stealth Dolphin', form: 'beast', motion: 'drift' },
  contract: { glyph: '☾', manifestation: 'Moonlight contract seal', form: 'mark', motion: 'flicker' },
  'truth-punch': { glyph: '◉!', manifestation: 'Body’s truthful voice', form: 'aura', motion: 'strike' },
  'blood-search': { glyph: '●', manifestation: 'Eyed blood droplets', form: 'organic', motion: 'drift' },
  'legal-defense': { glyph: '§', manifestation: 'LSDF numbered guards', form: 'construct', motion: 'strike' },
  'damage-transfer': { glyph: '⇢', manifestation: 'Sweet Home transfer line', form: 'aura', motion: 'strike' },
  'door-network': { glyph: '▥', manifestation: 'Voconte hideout door', form: 'field', motion: 'flicker' },
  'weapon-body': { glyph: '槌', manifestation: 'Padaille body weapon', form: 'organic', motion: 'strike' },
  'coercive-beast': { glyph: '♜', manifestation: 'Camilla coercive jellyfish', form: 'beast', motion: 'drift' },
  'coin-growth': { glyph: '₵', manifestation: 'Zhang Lei Nen coin', form: 'construct', motion: 'orbit' },
  'lie-marks': { glyph: 'Ⅲ', manifestation: 'Three-lie facial wound', form: 'mark', motion: 'flicker' },
  'drug-synthesis': { glyph: '⚗︎', manifestation: 'Tubeppa synthesis flask', form: 'organic', motion: 'bloom' },
  'aura-levy': { glyph: '☉', manifestation: 'Tyson Eye-wog', form: 'beast', motion: 'orbit' },
  'desire-trap': { glyph: '◒', manifestation: 'Luzurus desire bait', form: 'beast', motion: 'pulse' },
  'diffusive-smoke': { glyph: '☁', manifestation: 'Salé-salé aura smoke', form: 'aura', motion: 'bloom' },
  solicitation: { glyph: '¿', manifestation: 'Momoze solicitation mouse', form: 'beast', motion: 'pulse' },
  'room-isolation': { glyph: '▣', manifestation: 'Marayam duplicate room', form: 'field', motion: 'flicker' }
} satisfies Record<HatsuInteractionKind, HatsuVisualSignature>

export const visualSignatureFor = (profile: HatsuProfile) => HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind]

/**
 * Interaction knowledge used by the global Hatsu layer.
 * This is deliberately explicit: a technique never falls back to a generic
 * particle effect when its canon mechanics are already known.
 */
export const HATSU_PROFILES: HatsuProfile[] = [
  { id: 'bungee-gum', name: 'Bungee Gum', owner: 'Hisoka', kind: 'elastic', instruction: 'Link map characters within emitted range; click a linked target again to retract every filament toward the first anchor.', rule: 'Elastic force rises with tension, emitted strands snap beyond ten meters and five seconds of stillness isolates linked targets.', cost: 'Continuous aura · range and increasing tension', color: '#f06bb5', action: 'Attach the first filament' },
  { id: 'texture-surprise', name: 'Texture Surprise', owner: 'Hisoka', kind: 'disguise', instruction: 'Click a flat page surface repeatedly to cycle forged paper, metal, skin and camouflage textures without changing its function.', rule: 'The aura layer changes only visual appearance; the original surface and behavior remain detectable by touch.', cost: 'Low aura · flat limited surface', color: '#d98fc4', action: 'Choose a surface to falsify' },
  { id: 'emperor-time', name: 'Emperor Time', owner: 'Kurapika', kind: 'scarlet', instruction: 'Restore any faded or restricted element to full efficiency while every active second consumes one hour of session life.', rule: 'Scarlet eyes grant 100% efficiency in every Nen category, but one year consumed forces five minutes of Zetsu.', cost: '1 second = 1 hour of life', color: '#ef3340', action: 'Operate at full efficiency' },
  { id: 'steal-chain', name: 'Steal Chain', owner: 'Kurapika', kind: 'chain-rule', instruction: 'Drive the chain into a map character to drain their aura and capture the first registered Hatsu in the Index Dolphin card.', rule: 'The target is forced into an aura-depleted state while the stolen ability becomes available to Kurapika.', cost: 'Contact, maintained drain and one captured ability', color: '#d7dce2', action: 'Drain a target’s Hatsu' },
  { id: 'chain-jail', name: 'Chain Jail', owner: 'Kurapika', kind: 'chain-bind', instruction: 'Bind a Phantom Troupe member into forced Zetsu; selecting anyone else violates the fatal vow and immediately ends the Hatsu.', rule: 'The absolute restraint is usable only against Spiders and suppresses their aura and movement completely.', cost: 'Kurapika’s life if used on a non-Spider', color: '#c9ced6', action: 'Choose a Spider' },
  { id: 'dowsing-chain', name: 'Dowsing Chain', owner: 'Kurapika', kind: 'dowsing', instruction: 'Move the pendulum to track nearby controls, then click text or a section to test its signal for uncertainty and deception.', rule: 'The chain combines available evidence, intuition and concentration rather than granting infallible omniscience.', cost: 'Sustained concentration and contextual information', color: '#8ecae6', action: 'Sweep for a target' },
  { id: 'benjamin-aura', name: 'Aura Manipulation', owner: 'Benjamin', kind: 'enhance', instruction: 'Click a target repeatedly to stack up to five layers of Ren, increasing its size, brightness and resistance.', rule: 'Benjamin’s immense aura reinforces physical output and defence in proportion to the aura committed.', cost: 'Increasing aura per reinforcement layer', color: '#f0b429', action: 'Reinforce with Ren' },
  { id: 'oito-hatsu', name: 'Royal Guard Hatsu', owner: 'Oito', kind: 'control', instruction: 'Select map characters to join one command network; each new guard is pulled toward the first commander.', rule: 'Control requires acquired targets and maintained aura links across the whole guard network.', cost: 'Aura per linked guard', color: '#70d6b2', action: 'Acquire the first guard' },
  { id: 'erigeron', name: 'Erigeron', owner: 'Bill', kind: 'growth', instruction: 'Click targets to accelerate growth; ordinary page life germinates quickly while character Nen develops in smaller increments.', rule: 'Growth is dramatic on plants but deliberately weak on inexperienced living Nen users.', cost: 'Palms near the living target · repeated treatment', color: '#7fd35b', action: 'Accelerate growth' },
  { id: 'kurton-vehicle-transformation', name: 'Vehicle Transformation', owner: 'Kurton', kind: 'vehicle', instruction: 'Board up to five page passengers, then click one passenger again to launch the whole convoy on their shared aura.', rule: 'Kurton becomes a vehicle whose capacity is five and whose fuel is supplied symbiotically by its passengers.', cost: 'Shared passenger aura · five-seat limit', color: '#f2a65a', action: 'Board a passenger' },
  { id: 'little-eye', name: 'Little Eye', owner: 'Sayird', kind: 'scout', instruction: 'Move the remote eye to detect aura, then click a non-character area to open a detached visual and auditory scouting feed.', rule: 'Only a real small creature can be possessed; people and materialized Nen life are invalid hosts.', cost: 'Very low aura · vulnerable animal host', color: '#55c2ff', action: 'Find a small host' },
  { id: 'cross-game', name: 'Cross Game', owner: 'Mizaistom', kind: 'tribunal', instruction: 'Click one target through Blue admission, Yellow warning, reversed Yellow restraint and Red expulsion.', rule: 'Restraint activates only after the warning is ignored, prevents movement but not speech, and can be reapplied.', cost: 'Brief reusable card effects', color: '#f0c94d', action: 'Present the Blue card' },
  { id: 'beyond-sacrificial-curse', name: 'Sacrificial Curse', owner: 'Beyond', kind: 'curse', instruction: 'Choose the distant victim, choose a separate sacrificial carrier, then click the carrier again to trigger the post-mortem curse.', rule: 'The dormant mark awakens its carrier from birth and kills the preselected target only when that sacrifice dies.', cost: 'Prepared child sacrifice · death · post-mortem Nen', color: '#9d65d0', action: 'Mark the intended victim' },
  { id: 'benjamin-baton', name: 'Benjamin Baton', owner: 'Benjamin', kind: 'inherit', instruction: 'Select deceased loyal soldiers on the map to awaken palm stars and activate their registered Hatsu from the inheritance panel.', rule: 'Only deceased loyal Military Academy graduates transfer abilities; active powers remain under Benjamin’s ownership.', cost: 'Death and sworn military loyalty', color: '#ffd166', action: 'Identify an eligible soldier' },
  { id: 'air-blow', name: 'Air Blow', owner: 'Benjamin / Vincent', kind: 'blast', instruction: 'Click an element to emit a ranged palm shock that breaks its guard and physically knocks it across the page.', rule: 'The inherited emission attack strikes without direct contact; its complete conditions remain unknown.', cost: 'Unknown emitted aura', color: '#c6f1ff', action: 'Fire the palm blast' },
  { id: 'secret-window', name: 'Secret Window', owner: 'Benjamin / Musse', kind: 'surveillance', instruction: 'Attach one owl to a map character to retain a live feed and expose movement or death recorded in the next chapter.', rule: 'The owl eavesdrops through barriers, follows by touch and retains earlier footage for later review.', cost: 'One attached surveillance owl', color: '#a8b7d8', action: 'Attach the owl' },
  { id: 'culdcept', name: 'Culdcept', owner: 'Benjamin / Shikaku', kind: 'capture', instruction: 'Click a Nen user, hold the aura rectangle through its charge, then activate the acquired ability from its Culdcept card.', rule: 'Culdcept acquires another user’s Hatsu as a card; Halkenburg’s invincible arrow penetrates it and makes acquisition fail.', cost: 'Joined hands · charged aura rectangle', color: '#8c7ae6', action: 'Acquire a Nen ability' },
  { id: 'parallel-future', name: 'Parallel Future', owner: 'Tserriednich', kind: 'future', instruction: 'Observe next-chapter bodies for ten seconds and click possible actions to leave predicted afterimages while choosing a divergent reality.', rule: 'Everyone except Tserriednich continues perceiving the immutable prediction even when his real actions change.', cost: 'Complete Zetsu · ten-second vision', color: '#7dd3fc', action: 'Enter the ten-second future' },
  { id: 'grimmel-the-dissonance', name: 'Grimmel the Dissonance', owner: 'Halkenburg', kind: 'arrow', instruction: 'Materialize the bow, then strike a character; a marked bearer is chosen and the two visible bodies exchange positions and perspective.', rule: 'Collective aura forms invincible armour and an arrow that pierces every defence before swapping two souls.', cost: 'United supporters · one bearer risks their soul', color: '#f7e27d', action: 'Gather collective will' },
  { id: 'without-you', name: 'Without You', owner: 'Kacho', kind: 'guardian', instruction: 'The guardian memorizes five interactions, intercepts one detected lethal event and can replay its protected memory trail.', rule: 'Kacho’s post-mortem double remains beside the surviving twin, indistinguishable from her and dedicated to protection.', cost: 'Death of one twin · post-mortem persistence', color: '#f6b8d1', action: 'Remain beside the survivor' },
  { id: 'magical-worm', name: 'Magical Worm', owner: 'Fugetsu', kind: 'portal', instruction: 'Right-click two map states to place Start and Return Doors; each crossing restores URL, tier and zoom but repeated use exhausts the site.', rule: 'The paired dimensional tunnel normally works once per night; abnormal repeated travel dangerously drains Fugetsu.', cost: 'One safe nightly route · escalating exhaustion', color: '#80edc7', action: 'Place the Start Door' },
  { id: 'cats-name', name: "Cat's Name", owner: 'Camilla', kind: 'resurrection', instruction: 'Click the direct killer to simulate Camilla’s death; the post-mortem cat crushes that culprit, absorbs life and restores the page.', rule: 'Only direct death activates the counterattack; nonlethal harm or refusal to kill bypasses the ability.', cost: 'Camilla’s death · identifiable direct killer', color: '#ff8fab', action: 'Choose the direct killer' },
  { id: 'great-haiku', name: 'Great Haiku', owner: 'Basho', kind: 'poetry', instruction: 'Select three pieces of page copy to compose a haiku; the finished verse materializes as a navigable three-stop path through the site.', rule: 'The result grows stronger when the three selected lines form a convincing poem.', cost: 'Three lines · quality determines power', color: '#e7c873', action: 'Choose the first line' },
  { id: 'magical-esthetician-cookie', name: 'Magical Esthetician Cookie', owner: 'Biscuit', kind: 'restoration', instruction: 'Click a tired section to restore it while Cookie resets chapter filters, map depth and event progress to a rested baseline.', rule: 'Cookie relieves exhaustion and compresses hours of rest into a short treatment.', cost: 'One treatment at a time', color: '#f3b6d2', action: 'Choose a section to restore' },
  { id: 'biscuit-body-transformation', name: 'Body Transformation', owner: 'Biscuit', kind: 'transformation', instruction: 'Click any card to alternate between a compact form that cannot expose nested controls and a full form that restores them.', rule: 'The visible body changes radically while its underlying identity remains the same.', cost: 'Maintained transformation', color: '#f0a6c5', action: 'Transform a page body' },
  { id: 'battle-cantabile-prologue', name: 'Battle Cantabile: Prologue', owner: 'Bonolenov', kind: 'rhythm', instruction: 'Strike page elements in sequence; each beat becomes a playable navigation step in the combat score.', rule: 'Air passing through the body’s holes becomes battle music whose rhythm carries the technique.', cost: 'Continuous movement and rhythm', color: '#d7b56d', action: 'Begin the rhythm' },
  { id: 'battle-cantabile-jupiter', name: 'Battle Cantabile: Jupiter', owner: 'Bonolenov', kind: 'impact', instruction: 'Choose a target and drop a miniature Jupiter on it, collapsing that part of the page under immense weight.', rule: 'The conjured planet crushes the designated target with overwhelming mass.', cost: 'One massive impact', color: '#d9935b', action: 'Choose the impact site' },
  { id: 'battle-cantabile-metamorphosen', name: 'Battle Cantabile: Metamorphosen', owner: 'Bonolenov', kind: 'mimicry', instruction: 'Select a model, then another element; the second adopts its form and reproduces its site action when clicked.', rule: 'Battle music changes Bonolenov’s appearance into a chosen identity or object.', cost: 'Model plus target', color: '#a889c8', action: 'Choose a form to copy' },
  { id: 'skill-hunter', name: 'Skill Hunter', owner: 'Chrollo', kind: 'theft', instruction: 'Click a button or link to steal it into the floating book; the original control is sealed while its copy remains usable.', rule: 'A stolen ability is stored in the book and cannot be used by its owner while held.', cost: 'Targeted control must be exposed', color: '#b69ad9', action: 'Open the book and steal a control' },
  { id: 'double-face', name: 'Double Face', owner: 'Chrollo', kind: 'bookmark', instruction: 'Bookmark up to two sections; both remain pinned and visible while you navigate the rest of the page.', rule: 'The bookmark keeps one stolen ability active while Skill Hunter opens on another page.', cost: 'Two simultaneous pages maximum', color: '#9c7ac4', action: 'Bookmark the first section' },
  { id: 'indoor-fish', name: 'Indoor Fish', owner: 'Chrollo', kind: 'devour', instruction: 'Click page copy to let the fish consume its words while the layout remains eerily intact until Zetsu.', rule: 'Indoor Fish eat flesh only inside a sealed room; victims feel nothing and remain alive until the ability ends.', cost: 'Enclosed active page', color: '#78b6c9', action: 'Release the fish indoors' },
  { id: 'fun-fun-cloth', name: 'Fun Fun Cloth', owner: 'Chrollo', kind: 'pocket', instruction: 'Click any section to shrink it into a cloth token; click the token to restore it at full size.', rule: 'Anything wrapped by the cloth is reduced and stored without damage.', cost: 'Stored targets remain bound', color: '#d9d1bd', action: 'Wrap and shrink a section' },
  { id: 'chrollo-teleportation', name: 'Teleport', owner: 'Chrollo', kind: 'teleport', instruction: 'Select two page elements to exchange their exact positions instantly.', rule: 'The stolen technique forcibly relocates targets without requiring visible travel.', cost: 'Two valid destinations', color: '#7dd4d0', action: 'Choose the first target' },
  { id: 'sun-and-moon', name: 'The Sun and Moon', owner: 'Chrollo', kind: 'polarity', instruction: 'Mark one element with the Sun and another with the Moon; touching either detonates both marks and blasts the two targets away.', rule: 'Opposite marks explode on contact and persist through post-mortem Nen.', cost: 'One Sun mark plus one Moon mark', color: '#ffb347', action: 'Place the Sun mark' },
  { id: 'order-stamp', name: 'Order Stamp', owner: 'Chrollo', kind: 'command', instruction: 'Stamp non-interactive blocks, then click a destination to command every stamped puppet to march there.', rule: 'The stamp controls puppets as objects, never beings the user considers alive.', cost: 'Only inanimate page bodies', color: '#cf6d62', action: 'Stamp page puppets' },
  { id: 'convert-hands', name: 'Convert Hands', owner: 'Chrollo', kind: 'identity-swap', instruction: 'Select two elements to exchange their visible identities while retaining their original destinations and behavior.', rule: 'Left and right hand marks exchange appearances without exchanging the underlying person.', cost: 'Two marked identities', color: '#d6a5cc', action: 'Mark the first identity' },
  { id: 'love-dial-6700', name: 'Love Dial 6700', owner: 'Chrollo', kind: 'divination', instruction: 'Click page elements to make the dial measure affinity and point toward the strongest match on the current page.', rule: 'The phone-like divination tool guides its user toward a desired person through changing compatibility readings.', cost: 'Repeated readings improve direction', color: '#f08db6', action: 'Take an affinity reading' },
  { id: 'lovely-ghostwriter', name: 'Lovely Ghostwriter', owner: 'Chrollo', kind: 'prophecy', instruction: 'Select a character or section to write a four-line prophecy whose foretold links become navigable routes.', rule: 'Automatic writing predicts the target’s immediate future in cryptic verse while hiding their own prophecy from them.', cost: 'Target information and written medium', color: '#d8c7ed', action: 'Choose a subject for prophecy' },
  { id: 'gallery-fake', name: 'Gallery Fake', owner: 'Chrollo', kind: 'clone', instruction: 'Click a page element to place a perfect-looking inert duplicate over its interaction space as a functional decoy.', rule: 'Gallery Fake creates exact copies that lack the original’s living qualities and special powers.', cost: 'Copies vanish after twenty-four hours', color: '#a7c8c5', action: 'Copy a visible object' },
  { id: 'black-voice', name: 'Black Voice', owner: 'Chrollo', kind: 'puppet', instruction: 'Plant an antenna in a button or link, then click anywhere to remotely force the captured control to act.', rule: 'The antenna grants total remote control until removed or the target is destroyed.', cost: 'One antenna and one controller', color: '#7f92b8', action: 'Plant an antenna' },
  { id: 'double-machine-gun', name: 'Double Machine Gun', owner: 'Franklin', kind: 'barrage', instruction: 'Every click fires paired aura bullets that knock page elements backward; rapid fire compounds the displacement.', rule: 'Severed fingertips emit a sustained, powerful volley whose force rewards commitment.', cost: 'Continuous emitted aura', color: '#e6ad57', action: 'Open fire' },
  { id: 'hanzo-skill-4', name: 'Hanzo Skill 4', owner: 'Hanzo', kind: 'projection', instruction: 'Click a section to disable the sleeping body and send an astral double through the section’s extracted route.', rule: 'Hanzo’s consciousness leaves his sleeping body as an invisible double but must return if the body is disturbed.', cost: 'Motionless unconscious body', color: '#8bd1cf', action: 'Project the double' },
  { id: 'biohazard-hinrigh', name: 'Biohazard', owner: 'Hinrigh', kind: 'animate', instruction: 'Click a nonliving interface object to animate it; transformed controls crawl toward the cursor while retaining their original function.', rule: 'Touched machines and objects become living animals without losing their practical properties.', cost: 'Direct contact with an object', color: '#77c887', action: 'Animate an object' },
  { id: 'illumi-needle-people', name: 'Needle People', owner: 'Illumi', kind: 'needle', instruction: 'Pierce page elements with needles; converted targets lose their own action and obediently follow the cursor.', rule: 'Needles overwrite autonomy and turn people into disposable puppets until exhaustion or death.', cost: 'One needle per puppet', color: '#b6a4d8', action: 'Insert a control needle' },
  { id: 'surveillance-paper-dolls', name: 'Surveillance Paper Dolls', owner: 'Kalluto', kind: 'paper-spy', instruction: 'Attach paper dolls to sections; they count and report every DOM change occurring inside their target.', rule: 'Tiny paper figures eavesdrop remotely and relay activity to their user.', cost: 'One paper observer per area', color: '#efb9c8', action: 'Deploy a paper observer' },
  { id: 'dance-of-the-serpents-bite', name: "Dance of the Serpent's Bite", owner: 'Kalluto', kind: 'shred', instruction: 'Click a target repeatedly to slice it into finer paper strips until its content scatters away.', rule: 'A fan controls razor paper confetti capable of tracking and cutting a chosen target.', cost: 'Sustained paper swarm', color: '#f1a7bb', action: 'Begin the paper dance' },
  { id: 'leorio-remote-punch', name: 'Remote Punch', owner: 'Leorio', kind: 'remote-strike', instruction: 'Click any target: aura crosses the page and remotely triggers the control or disclosure struck by the reproduced fist.', rule: 'Aura travels through a surface and reproduces the punch at a distant point.', cost: 'A connected surface and emitted aura', color: '#62c6e8', action: 'Choose a remote impact' },
  { id: 'luini-spatial-teleportation', name: 'Spatial Teleportation', owner: 'Luini', kind: 'spatial', instruction: 'Send sections through the page boundary into a hidden room; reopen the spatial hatch to bring them back.', rule: 'Luini passes through walls into a private connected space but must respect his marked entry points.', cost: 'Prepared boundary and return route', color: '#8a78d6', action: 'Open the hidden room' },
  { id: 'nen-stitches', name: 'Nen Stitches', owner: 'Machi', kind: 'stitch', instruction: 'Select two sections to sew them into one sticky body; activating either stitched edge pulls the counterpart into action.', rule: 'Aura threads reconnect severed flesh with exceptional speed and precision.', cost: 'Thread length and precision', color: '#dd77b7', action: 'Choose the first torn edge' },
  { id: 'melody-enchanting-music', name: 'Enchanting Music', owner: 'Melody', kind: 'melody', instruction: 'Click elements to add notes; every three-note phrase guides site focus through the selected emotional sequence.', rule: 'Music carries aura directly into listeners, soothing them and shaping their emotional state.', cost: 'Continuous performance and hearing', color: '#70c6d7', action: 'Play the first note' },
  { id: 'contagion', name: 'Contagion', owner: 'Morena', kind: 'infection', instruction: 'Infect an element, then click infected nodes to spread levels through neighboring content until the page becomes a Heil-Ly network.', rule: 'Members gain levels through murder and unlock power at thresholds while infection spreads only by Morena’s kiss.', cost: 'Membership, targets and escalating levels', color: '#d94f68', action: 'Create a level-one member' },
  { id: 'ripper-cyclotron', name: 'Ripper Cyclotron', owner: 'Phinks', kind: 'windup', instruction: 'Click the same target to wind the arm; six rotations release the stored impact and remove that section from use.', rule: 'Every full arm rotation increases the aura concentrated in the next punch.', cost: 'Visible wind-up time', color: '#f2c34f', action: 'Choose a target and wind up' },
  { id: 'rihan-predator', name: 'Predator', owner: 'Rihan', kind: 'predator', instruction: 'Study the same interface species three times; once its rules are known, Predator materializes and removes every matching target.', rule: 'Predator becomes stronger and more specialized as Rihan correctly deduces an enemy ability’s conditions.', cost: 'Accurate analysis · weak against unknowns', color: '#7bb66c', action: 'Begin analyzing a target' },
  { id: 'saiyu-priest-staff', name: 'Priest Staff', owner: 'Saiyu', kind: 'staff', instruction: 'Plant the staff on an element to pin it and repel neighboring content away from the impact point.', rule: 'The conjured staff extends and strikes with force at close or mid range.', cost: 'One controlled staff', color: '#d5a94f', action: 'Plant the staff' },
  { id: 'saiyu-three-monkeys', name: 'Three Monkeys', owner: 'Saiyu', kind: 'senses', instruction: 'Each click seals sight, hearing, then speech across the site; the fourth releases all three senses.', rule: 'Three Nen monkeys rob the target of vision, hearing and speech when their attacks connect.', cost: 'Three successful sensory strikes', color: '#c58c5b', action: 'Seal sight' },
  { id: 'blinky', name: 'Blinky', owner: 'Shizuku', kind: 'vacuum', instruction: 'Click nonliving page content to vacuum it into Blinky’s storage; living character markers are rejected.', rule: 'Blinky sucks up any nonliving matter Shizuku names, except Nen constructs and things she considers alive.', cost: 'Declared nonliving target', color: '#85b9d8', action: 'Name something to vacuum' },
  { id: 'silent-majority', name: 'Silent Majority', owner: 'Unknown Assassin', kind: 'snakes', instruction: 'Mark ten page targets to conceal the user among them; four snakes then drain the next selected victim while the others remain suspects.', rule: 'The curse needs a ten-person range, kills through four snakes and rebounds if dismissed without a victim.', cost: 'Ten nearby targets · one mandatory victim', color: '#8765aa', action: 'Build the ten-target field' },
  { id: 'theta-aura-projectile', name: 'Aura Projectile', owner: 'Theta', kind: 'training-shot', instruction: 'Select a target to seal its action in Zetsu; holding perfectly still for three seconds restores it after the controlled shot.', rule: 'Theta fires a controlled aura projectile to test whether a student can maintain complete Zetsu under pressure.', cost: 'Three seconds of flawless concentration', color: '#8fe3f0', action: 'Choose a Zetsu trainee' },
  { id: 'snake-arm', name: 'Snake Arm', owner: 'Gel', kind: 'serpent', instruction: 'Click an element to coil the transformed arm around it; the restrained target compresses and cannot act until clicked again.', rule: 'Gel partially transforms her arm into a snake capable of instantly restraining a Zodiac-level target.', cost: 'Maintained partial transformation', color: '#86c98a', action: 'Choose something to restrain' },
  { id: 'bird-manipulation', name: 'Bird Manipulation', owner: 'Cluck', kind: 'flock', instruction: 'Assign birds to page elements; each pigeon carries a readable dispatch into the flock’s delivery panel.', rule: 'Hundreds of controlled birds can deliver documents accurately over a vast area.', cost: 'One controlled bird per dispatch', color: '#b9d8e8', action: 'Give a dispatch to the flock' },
  { id: 'transport-portals', name: 'Transport Portals', owner: 'Tokarine', kind: 'relay', instruction: 'Load sections and advance each through three visible relay stages into recoverable transport storage without teleporting.', rule: 'The ability transports limited cargo between expedition relays but explicitly cannot teleport it.', cost: 'Low capacity · staged transport', color: '#e2b86e', action: 'Load cargo at relay one' },
  { id: 'yomotsu-hegui', name: 'Yomotsu Hegui', owner: "Camilla's Have-Nots", kind: 'postmortem-curse', instruction: 'Perform five preparation rites on the same target; the final click simulates the user’s sacrifice and releases the aura-draining curse.', rule: 'Years of fixation, a connected object, ashes, proximity and suicide empower a post-mortem curse against one target.', cost: 'Long preparation · connected object · user’s life', color: '#a04f68', action: 'Choose the lifelong target' },
  { id: 'holy-chain', name: 'Holy Chain', owner: 'Kurapika', kind: 'healing', instruction: 'Click damaged, hidden or disabled content to restore its original state and reopen its controls.', rule: 'The cross-tipped thumb chain accelerates natural healing and reaches full restorative efficiency during Emperor Time.', cost: 'Enhancement aura · strongest under Emperor Time', color: '#d9f1df', action: 'Choose something wounded' },
  { id: 'judgment-chain', name: 'Judgment Chain', owner: 'Kurapika', kind: 'heart-vow', instruction: 'Choose a subject, choose a forbidden site action, then touch that forbidden action again to enforce the lethal heart condition.', rule: 'The implanted chain pierces the heart only when the declared rule is knowingly violated.', cost: 'Emperor Time · explicit rule · lethal enforcement', color: '#d7dce2', action: 'Choose the contract subject' },
  { id: 'stealth-dolphin', name: 'Stealth Dolphin', owner: 'Kurapika', kind: 'ability-loan', instruction: 'Select a Nen user to analyze their registered Hatsu, then select a recipient and activate the single-use loan from the dolphin panel.', rule: 'The dolphin exists during Emperor Time, explains the captured ability and opens a non-user’s aura nodes when the loan is consumed.', cost: 'Emperor Time remains active until the loaded ability is used', color: '#63d5e6', action: 'Analyze a stolen ability' },
  { id: 'moonlight-act', name: 'Moonlight Act', owner: 'Longhi', kind: 'contract', instruction: 'Choose two consenting parties, then choose a clause; touching that clause again records a breach and applies the agreed penalty.', rule: 'Only a voluntary agreement with explicit terms can be rewarded or punished by the Manipulation contract.', cost: 'Mutual consent · declared duration and penalty', color: '#c6ddff', action: 'Choose the first signatory' },
  { id: 'body-and-soul', name: 'Body and Soul', owner: 'Lynch', kind: 'truth-punch', instruction: 'Punch a section after questioning it to extract its real destinations, hidden controls and factual DOM state into a truth report.', rule: 'The body’s emitted voice answers the question truthfully even when the conscious target lies or stays silent.', cost: 'A direct punch after a clear question', color: '#f1a06d', action: 'Question and punch a target' },
  { id: 'bloody-mary', name: 'Bloody Mary', owner: 'Zakuro', kind: 'blood-search', instruction: 'Release searching blood drops onto a section; they find its routes and characters and return them as a navigable search trail.', rule: 'Only Zakuro’s own blood can be manipulated; autonomous eyed droplets expire after roughly thirty to forty minutes.', cost: 'Open wound · carried blood supply · limited search time', color: '#b51f3c', action: 'Release the first blood drop' },
  { id: 'lsdf', name: 'A Battle of Wits: LSDF', owner: 'Yokotani', kind: 'legal-defense', instruction: 'Designate the Heil-Ly hideout, identify an intruder and click them again to sentence and expel them from that site section.', rule: 'The invincible guards work only in Morena’s hideout after Yokotani identifies unlawful intruders; they expel but cannot injure.', cost: 'Morena present · hideout only · declared offense', color: '#d4c58b', action: 'Establish hideout jurisdiction' },
  { id: 'damage-sweet-home', name: 'Damage: Sweet Home', owner: 'Terebellum', kind: 'damage-transfer', instruction: 'Touch a protected element and a recipient; hitting the protected element again transfers its collapse to the recipient.', rule: 'Damage is redirected between touched targets rather than erased, with stricter limits when living bodies are involved.', cost: 'Prior contact with both source and recipient', color: '#db8b78', action: 'Touch the protected target' },
  { id: 'voconte-hideout-doors', name: 'Hideout Doors', owner: 'Voconte', kind: 'door-network', instruction: 'Mark sections as rooms; the generated door network becomes a panel for moving focus directly between them.', rule: 'The doors connect prepared rooms throughout the Heil-Ly base instead of opening unrestricted portals anywhere.', cost: 'Prepared hideout walls and connected rooms', color: '#7ec8b6', action: 'Install the first door' },
  { id: 'padaille-weapon-transformation', name: 'Weapon Transformation', owner: 'Padaille', kind: 'weapon-body', instruction: 'Transform a button, link or disclosure into a body weapon, then strike with it to execute the control as an attack.', rule: 'Padaille changes his own body into familiar weapons and tools rather than conjuring independent equipment.', cost: 'Known weapon shape · transformed body part', color: '#c6925e', action: 'Choose a weapon function' },
  { id: 'camilla-guardian-coercion', name: "Camilla's Guardian Coercion", owner: 'Camilla Guardian Beast', kind: 'coercive-beast', instruction: 'Fulfil three unknown-condition contacts on one target; the third contact captures its control for remote command.', rule: 'The Beast’s total Manipulation is confirmed, but its actual activation conditions remain deliberately unknown.', cost: 'Unknown conditions · represented as three unresolved contacts', color: '#d98cae', action: 'Probe the first unknown condition' },
  { id: 'zhanglei-guardian-coins', name: 'Guardian Coins', owner: 'Zhang Lei Guardian Beast', kind: 'coin-growth', instruction: 'Give a target a coin and revisit it to accumulate value; threshold growth progressively opens concealed content and controls.', rule: 'One coin is produced daily, accumulates Nen over time and resets to value one whenever ownership changes.', cost: 'Long accumulation · transfer resets value', color: '#d7b34f', action: 'Mint a value-one coin' },
  { id: 'tserriednich-guardian-lie-marks', name: 'Three-Lie Transformation', owner: 'Tserriednich Guardian Beast', kind: 'lie-marks', instruction: 'Mark the same suspect for three detected lies: cut, infected warning, then irreversible removal of their site autonomy.', rule: 'Each lie escalates the curse and the third transforms the liar into something no longer human.', cost: 'Three lies told in Tserriednich’s presence', color: '#9e6d89', action: 'Detect the first lie' },
  { id: 'tubeppa-guardian-synthesis', name: 'Collaborative Drug Synthesis', owner: 'Tubeppa Guardian Beast', kind: 'drug-synthesis', instruction: 'Choose two collaborating page components; the Beast synthesizes a treatment that restores and enables both.', rule: 'The chemical-producing Beast requires a collaborative partner and can create many effects whose limits remain unknown.', cost: 'Active alliance · two cooperating components', color: '#91bd72', action: 'Choose the research partner' },
  { id: 'tyson-guardian-eye-wogs', name: 'Eye-wogs', owner: 'Tyson Guardian Beast', kind: 'aura-levy', instruction: 'Attach Eye-wogs to selected readers; each reading drains a control while adding its destination to a shared happiness path.', rule: 'Depth of engagement with Tyson’s Book determines returned happiness, while violating its single taboo brings punishment.', cost: 'Book exposure · continuous aura levy', color: '#ef91c4', action: 'Attach an Eye-wog to a reader' },
  { id: 'luzurus-guardian-desire-trap', name: 'Desire Trap', owner: 'Luzurus Guardian Beast', kind: 'desire-trap', instruction: 'Choose a desired destination, then a bait control; touching the bait again springs the trap and forces navigation to the desire.', rule: 'The Beast materializes what its victim wants and applies pseudo-coercive Manipulation only after the bait is accepted.', cost: 'Known desire · voluntarily satisfied bait', color: '#98b65c', action: 'Read the target’s desire' },
  { id: 'salesale-guardian-smoke', name: 'Diffusive Aura Smoke', owner: 'Salé-salé Guardian Beast', kind: 'diffusive-smoke', instruction: 'Expose neighboring sections repeatedly; converted controls join a spreading panel that routes visitors toward Salé-salé.', rule: 'Low-level coercive smoke builds goodwill over hours, creates secondary emitters and fails against targets holding their breath.', cost: 'Sustained exposure · breathable aura smoke', color: '#b7aac8', action: 'Release the first smoke cloud' },
  { id: 'momoze-guardian-solicitation', name: 'Are You Free?', owner: 'Momoze Guardian Beast', kind: 'solicitation', instruction: 'Ask one target twice: choosing another target represents refusal and continued harassment; clicking the same target accepts possession.', rule: 'Only an affirmative answer lets the spider enter the ear and manipulate the victim using their own aura.', cost: 'Repeated solicitation · explicit yes · heavy host fatigue', color: '#e8a9a1', action: 'Ask “Are you free?”' },
  { id: 'marayam-guardian-isolation', name: 'Room 1013 Isolation', owner: 'Marayam Guardian Beast', kind: 'room-isolation', instruction: 'Choose a room section to isolate it; surrounding content loses access while the protected room remains fully interactive inside.', rule: 'Occupants may leave the real room but outsiders and former occupants can reach only an empty spatial duplicate.', cost: 'Protected room · one-way perceptual boundary', color: '#7095d6', action: 'Isolate the protected room' },
]

export const hatsuById = (id: string | null | undefined) =>
  HATSU_PROFILES.find((profile) => profile.id === id) ?? null
