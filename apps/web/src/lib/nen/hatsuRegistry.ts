/**
 * What the site does with a hatsu, once the catalogue has said which one.
 *
 * The catalogue itself is no longer here. `HATSU_PROFILES` used to be
 * eighty-two entries written by hand next to eighty-two modules that said the
 * same things; ADR-001 chantier 3 turned it into `hatsuProfiles.gen.ts`,
 * compiled from `data/` and the modules' `site` blocks. What stays is what is
 * genuinely the web app's own: the impact each kind of interaction has on the
 * page, and the visual language it is drawn in. Both are keyed by `kind`, and
 * `satisfies Record<HatsuInteractionKind, …>` is what makes a new ability
 * arrive with a hole in each table rather than a silent default.
 */

import { HATSU_PROFILES } from './hatsuProfiles.gen.js'
import type { HatsuInteractionKind, HatsuProfile } from '@black-whale/nen-engine'

export { HATSU_PROFILES }
export type { HatsuInteractionKind, HatsuProfile }

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
  elastic: 'layout',
  disguise: 'content-access',
  scarlet: 'control',
  'chain-rule': 'control',
  'chain-bind': 'control',
  dowsing: 'navigation',
  enhance: 'control',
  growth: 'content-access',
  vehicle: 'layout',
  scout: 'data-revelation',
  tribunal: 'control',
  curse: 'control',
  inherit: 'control',
  blast: 'control',
  surveillance: 'data-revelation',
  capture: 'control',
  future: 'data-revelation',
  arrow: 'map-state',
  guardian: 'simulation-state',
  portal: 'map-state',
  resurrection: 'control',
  poetry: 'content-access',
  restoration: 'map-state',
  transformation: 'content-access',
  rhythm: 'control',
  impact: 'content-access',
  mimicry: 'control',
  theft: 'control',
  bookmark: 'layout',
  devour: 'content-access',
  pocket: 'storage',
  teleport: 'layout',
  polarity: 'control',
  command: 'layout',
  'identity-swap': 'layout',
  divination: 'navigation',
  prophecy: 'navigation',
  clone: 'control',
  puppet: 'control',
  barrage: 'layout',
  projection: 'navigation',
  animate: 'control',
  needle: 'control',
  'paper-spy': 'data-revelation',
  shred: 'content-access',
  'remote-strike': 'control',
  spatial: 'storage',
  stitch: 'control',
  melody: 'control',
  infection: 'control',
  windup: 'content-access',
  predator: 'control',
  staff: 'control',
  senses: 'control',
  vacuum: 'storage',
  snakes: 'control',
  'training-shot': 'control',
  serpent: 'control',
  flock: 'navigation',
  relay: 'storage',
  'postmortem-curse': 'control',
  'postmortem-host-succession': 'simulation-state',
  healing: 'content-access',
  'heart-vow': 'control',
  'ability-loan': 'control',
  'ability-lending': 'control',
  contract: 'control',
  'truth-punch': 'data-revelation',
  'blood-search': 'navigation',
  'legal-defense': 'control',
  'damage-transfer': 'simulation-state',
  'door-network': 'navigation',
  'weapon-body': 'control',
  'coercive-beast': 'control',
  'coin-growth': 'simulation-state',
  'lie-marks': 'control',
  'drug-synthesis': 'content-access',
  'aura-levy': 'control',
  'desire-trap': 'control',
  'diffusive-smoke': 'control',
  solicitation: 'control',
  'room-isolation': 'content-access',
  'pain-armour': 'storage',
  'sun-flare': 'content-access',
  // Combo Master reads an ability and reports what it found: the one kind in
  // the catalogue whose whole output is knowledge about another entry.
  decipher: 'data-revelation',
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
  disguise: {
    glyph: '▧',
    manifestation: 'Forged texture sheet',
    form: 'construct',
    motion: 'flicker',
  },
  scarlet: { glyph: '◉', manifestation: 'Scarlet eyes', form: 'mark', motion: 'pulse' },
  'chain-rule': {
    glyph: '⛓',
    manifestation: 'Syringe index chain',
    form: 'chain',
    motion: 'strike',
  },
  'chain-bind': {
    glyph: '⌁',
    manifestation: 'Restraining middle chain',
    form: 'chain',
    motion: 'coil',
  },
  dowsing: { glyph: '◇', manifestation: 'Dowsing pendulum', form: 'chain', motion: 'scan' },
  enhance: { glyph: '✦', manifestation: 'Royal Ren mantle', form: 'aura', motion: 'pulse' },
  growth: { glyph: '❧', manifestation: 'Erigeron sprout', form: 'organic', motion: 'bloom' },
  vehicle: {
    glyph: '▰',
    manifestation: 'Five-seat transformed hull',
    form: 'construct',
    motion: 'drift',
  },
  scout: { glyph: '◉', manifestation: 'Blue aura flying insect', form: 'beast', motion: 'drift' },
  tribunal: {
    glyph: '■',
    manifestation: 'Cross Game penalty card',
    form: 'construct',
    motion: 'flicker',
  },
  curse: { glyph: '⌖', manifestation: 'Sacrificial birthmark', form: 'mark', motion: 'pulse' },
  inherit: { glyph: '★★★★', manifestation: 'Four-star palm', form: 'mark', motion: 'bloom' },
  blast: { glyph: '◁', manifestation: 'Compressed palm shock', form: 'aura', motion: 'strike' },
  surveillance: { glyph: '♧', manifestation: 'Secret Window owl', form: 'beast', motion: 'orbit' },
  capture: {
    glyph: '▣',
    manifestation: 'Culdcept acquisition card',
    form: 'construct',
    motion: 'flicker',
  },
  future: { glyph: '◫', manifestation: 'Parallel future frame', form: 'field', motion: 'flicker' },
  arrow: { glyph: '➶', manifestation: 'Grimmel soul arrow', form: 'weapon', motion: 'strike' },
  guardian: {
    glyph: '♙',
    manifestation: 'Kacho post-mortem double',
    form: 'beast',
    motion: 'drift',
  },
  portal: { glyph: '◯', manifestation: 'Magical Worm door', form: 'field', motion: 'orbit' },
  resurrection: {
    glyph: '♾',
    manifestation: 'Cat counteractive beast',
    form: 'beast',
    motion: 'strike',
  },
  poetry: {
    glyph: '句',
    manifestation: 'Materialized haiku verse',
    form: 'construct',
    motion: 'bloom',
  },
  restoration: { glyph: '✿', manifestation: 'Cookie massage aura', form: 'beast', motion: 'pulse' },
  transformation: {
    glyph: '◆',
    manifestation: 'Biscuit true-body seal',
    form: 'organic',
    motion: 'bloom',
  },
  rhythm: { glyph: '♫', manifestation: 'Prologue battle rhythm', form: 'aura', motion: 'orbit' },
  impact: {
    glyph: '♃',
    manifestation: 'Jupiter crushing sphere',
    form: 'construct',
    motion: 'strike',
  },
  mimicry: {
    glyph: '♬',
    manifestation: 'Metamorphosen war mask',
    form: 'construct',
    motion: 'flicker',
  },
  theft: {
    glyph: '▤',
    manifestation: 'Bandit’s Secret book',
    form: 'construct',
    motion: 'flicker',
  },
  bookmark: {
    glyph: '▮',
    manifestation: 'Double Face bookmark',
    form: 'construct',
    motion: 'pulse',
  },
  devour: { glyph: '⌇', manifestation: 'Indoor Fish bite', form: 'beast', motion: 'drift' },
  pocket: { glyph: '◇', manifestation: 'Fun Fun Cloth bundle', form: 'construct', motion: 'coil' },
  teleport: {
    glyph: '⇄',
    manifestation: 'Chrollo displacement cross',
    form: 'field',
    motion: 'flicker',
  },
  polarity: { glyph: '☀☾', manifestation: 'Sun and Moon marks', form: 'mark', motion: 'orbit' },
  command: { glyph: '人', manifestation: 'Order Stamp puppet seal', form: 'mark', motion: 'drift' },
  'identity-swap': {
    glyph: '↔',
    manifestation: 'Convert Hands palms',
    form: 'mark',
    motion: 'flicker',
  },
  divination: { glyph: '♡', manifestation: 'Love Dial handset', form: 'construct', motion: 'scan' },
  prophecy: { glyph: '✍', manifestation: 'Ghostwriter quill', form: 'construct', motion: 'drift' },
  clone: {
    glyph: '▦',
    manifestation: 'Gallery Fake duplicate',
    form: 'construct',
    motion: 'flicker',
  },
  puppet: { glyph: '⌁', manifestation: 'Black Voice antenna', form: 'weapon', motion: 'pulse' },
  barrage: {
    glyph: '••',
    manifestation: 'Severed-finger aura volley',
    form: 'weapon',
    motion: 'strike',
  },
  projection: { glyph: '☍', manifestation: 'Hanzo astral double', form: 'beast', motion: 'drift' },
  animate: {
    glyph: '♞',
    manifestation: 'Biohazard animal-machine',
    form: 'organic',
    motion: 'bloom',
  },
  needle: { glyph: '†', manifestation: 'Needle Person pin', form: 'weapon', motion: 'strike' },
  'paper-spy': {
    glyph: '人',
    manifestation: 'Paper surveillance doll',
    form: 'construct',
    motion: 'drift',
  },
  shred: { glyph: '✣', manifestation: 'Serpent’s paper confetti', form: 'weapon', motion: 'orbit' },
  'remote-strike': {
    glyph: '拳',
    manifestation: 'Surface-emerging fist',
    form: 'weapon',
    motion: 'strike',
  },
  spatial: {
    glyph: '▱',
    manifestation: 'Luini hidden-room hatch',
    form: 'field',
    motion: 'flicker',
  },
  stitch: { glyph: '××', manifestation: 'Machi aura sutures', form: 'chain', motion: 'coil' },
  melody: { glyph: '♪', manifestation: 'Melody aura score', form: 'aura', motion: 'drift' },
  infection: { glyph: '☣', manifestation: 'Contagion level mark', form: 'mark', motion: 'pulse' },
  windup: { glyph: '↻', manifestation: 'Cyclotron arm rotation', form: 'aura', motion: 'orbit' },
  predator: { glyph: '◈', manifestation: 'Predator counter-beast', form: 'beast', motion: 'scan' },
  staff: { glyph: '│', manifestation: 'Extending priest staff', form: 'weapon', motion: 'strike' },
  senses: { glyph: '見聞言', manifestation: 'Three sense monkeys', form: 'beast', motion: 'orbit' },
  vacuum: { glyph: '◁', manifestation: 'Blinky vacuum mouth', form: 'beast', motion: 'coil' },
  snakes: { glyph: '∿∿', manifestation: 'Silent Majority snakes', form: 'beast', motion: 'coil' },
  'training-shot': {
    glyph: '◎',
    manifestation: 'Theta’s weak aura shot',
    form: 'aura',
    motion: 'strike',
  },
  serpent: {
    glyph: '§',
    manifestation: 'Gel transformed snake arm',
    form: 'organic',
    motion: 'coil',
  },
  flock: { glyph: '⌁', manifestation: 'Cluck delivery flock', form: 'beast', motion: 'drift' },
  relay: { glyph: '▻▻', manifestation: 'Tokarine transport relay', form: 'field', motion: 'drift' },
  'postmortem-curse': {
    glyph: '灰',
    manifestation: 'Yomotsu Hegui ash curse',
    form: 'mark',
    motion: 'flicker',
  },
  'postmortem-host-succession': {
    glyph: '♜',
    manifestation: 'Bohemian bloodline host mantle',
    form: 'beast',
    motion: 'orbit',
  },
  healing: { glyph: '✚', manifestation: 'Holy Chain cross', form: 'chain', motion: 'pulse' },
  'heart-vow': {
    glyph: '♢',
    manifestation: 'Judgment heart blade',
    form: 'chain',
    motion: 'strike',
  },
  'ability-loan': { glyph: '◡', manifestation: 'Stealth Dolphin', form: 'beast', motion: 'drift' },
  'ability-lending': {
    glyph: '⇥',
    manifestation: 'Stand By Me transfer seal',
    form: 'mark',
    motion: 'pulse',
  },
  contract: {
    glyph: '☾',
    manifestation: 'Moonlight contract seal',
    form: 'mark',
    motion: 'flicker',
  },
  'truth-punch': {
    glyph: '◉!',
    manifestation: 'Body’s truthful voice',
    form: 'aura',
    motion: 'strike',
  },
  'blood-search': {
    glyph: '●',
    manifestation: 'Eyed blood droplets',
    form: 'organic',
    motion: 'drift',
  },
  'legal-defense': {
    glyph: '§',
    manifestation: 'LSDF numbered guards',
    form: 'construct',
    motion: 'strike',
  },
  'damage-transfer': {
    glyph: '⇢',
    manifestation: 'Sweet Home transfer line',
    form: 'aura',
    motion: 'strike',
  },
  'door-network': {
    glyph: '▥',
    manifestation: 'Voconte hideout door',
    form: 'field',
    motion: 'flicker',
  },
  'weapon-body': {
    glyph: '槌',
    manifestation: 'Padaille body weapon',
    form: 'organic',
    motion: 'strike',
  },
  'coercive-beast': {
    glyph: '♜',
    manifestation: 'Camilla coercive jellyfish',
    form: 'beast',
    motion: 'drift',
  },
  'coin-growth': {
    glyph: '₵',
    manifestation: 'Zhang Lei Nen coin',
    form: 'construct',
    motion: 'orbit',
  },
  'lie-marks': {
    glyph: 'Ⅲ',
    manifestation: 'Three-lie facial wound',
    form: 'mark',
    motion: 'flicker',
  },
  'drug-synthesis': {
    glyph: '⚗︎',
    manifestation: 'Tubeppa synthesis flask',
    form: 'organic',
    motion: 'bloom',
  },
  'aura-levy': { glyph: '☉', manifestation: 'Tyson Eye-wog', form: 'beast', motion: 'orbit' },
  'desire-trap': {
    glyph: '◒',
    manifestation: 'Luzurus desire bait',
    form: 'beast',
    motion: 'pulse',
  },
  'diffusive-smoke': {
    glyph: '☁',
    manifestation: 'Salé-salé aura smoke',
    form: 'aura',
    motion: 'bloom',
  },
  solicitation: {
    glyph: '¿',
    manifestation: 'Momoze solicitation mouse',
    form: 'beast',
    motion: 'pulse',
  },
  'room-isolation': {
    glyph: '▣',
    manifestation: 'Marayam duplicate room',
    form: 'field',
    motion: 'flicker',
  },
  'pain-armour': {
    glyph: '⛨',
    manifestation: 'Pain Packer wrapping',
    form: 'construct',
    motion: 'pulse',
  },
  'sun-flare': { glyph: '☀', manifestation: 'Rising Sun sphere', form: 'field', motion: 'bloom' },
  // The only ability in the catalogue whose canonical manifestation is an
  // interface: a hand-held console, conjured, with menus on it.
  decipher: { glyph: '▤', manifestation: 'Conjured console', form: 'construct', motion: 'pulse' },
} satisfies Record<HatsuInteractionKind, HatsuVisualSignature>

export const visualSignatureFor = (profile: HatsuProfile) =>
  HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind]

export const hatsuById = (id: string | null | undefined) =>
  HATSU_PROFILES.find((profile) => profile.id === id) ?? null
