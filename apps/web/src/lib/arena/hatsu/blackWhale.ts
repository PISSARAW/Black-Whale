import type { ArenaHatsuEffect } from '../../combat/types'

export interface BlackWhaleArenaContract {
  id: string
  effect: ArenaHatsuEffect
  cost: number
  persistent: boolean
  mechanic:
    | 'terrain'
    | 'analysis'
    | 'forecast'
    | 'post-mortem'
    | 'inheritance'
    | 'progression'
    | 'tracking'
    | 'truth'
    | 'transfer'
    | 'jurisdiction'
    | 'space'
    | 'surveillance'
    | 'growth'
    | 'projection'
    | 'recovery'
    | 'ambush'
    | 'theft'
    | 'loan'
    | 'healing'
    | 'loadout'
    | 'retaliation'
    | 'vacuum'
    | 'threads'
    | 'manipulation'
  condition: string
  risk: string
}

export const BLACK_WHALE_ARENA_CONTRACTS: BlackWhaleArenaContract[] = [
  {
    id: 'biohazard-hinrigh',
    effect: 'enhance',
    cost: 14,
    persistent: true,
    mechanic: 'terrain',
    condition: 'touch-nonliving-object',
    risk: 'limited-transformations',
  },
  {
    id: 'rihan-predator',
    effect: 'enhance',
    cost: 100,
    persistent: false,
    mechanic: 'analysis',
    condition: 'three-correct-readings',
    risk: 'forty-eight-hour-zetsu',
  },
  {
    id: 'parallel-future',
    effect: 'enhance',
    cost: 20,
    persistent: false,
    mechanic: 'forecast',
    condition: 'zetsu-and-eyes-closed',
    risk: 'defenceless-preview',
  },
  {
    id: 'cats-name',
    effect: 'restore',
    cost: 100,
    persistent: false,
    mechanic: 'post-mortem',
    condition: 'death-by-attacker',
    risk: 'must-die-first',
  },
  {
    id: 'benjamin-baton',
    effect: 'enhance',
    cost: 12,
    persistent: true,
    mechanic: 'inheritance',
    condition: 'deceased-loyal-soldier',
    risk: 'fixed-inherited-loadout',
  },
  {
    id: 'contagion',
    effect: 'enhance',
    cost: 8,
    persistent: true,
    mechanic: 'progression',
    condition: 'infected-member-level',
    risk: 'requires-kills',
  },
  {
    id: 'bloody-mary',
    effect: 'bind',
    cost: 12,
    persistent: true,
    mechanic: 'tracking',
    condition: 'shed-blood',
    risk: 'blood-loss',
  },
  {
    id: 'body-and-soul',
    effect: 'impact',
    cost: 10,
    persistent: false,
    mechanic: 'truth',
    condition: 'question-before-punch',
    risk: 'melee-contact',
  },
  {
    id: 'damage-sweet-home',
    effect: 'restore',
    cost: 18,
    persistent: true,
    mechanic: 'transfer',
    condition: 'touch-source-and-recipient',
    risk: 'damage-is-not-erased',
  },
  {
    id: 'lsdf',
    effect: 'bind',
    cost: 20,
    persistent: true,
    mechanic: 'jurisdiction',
    condition: 'declared-hideout-intruder',
    risk: 'cannot-inflict-harm',
  },
  {
    id: 'luini-spatial-teleportation',
    effect: 'enhance',
    cost: 16,
    persistent: false,
    mechanic: 'space',
    condition: 'prepared-entry-and-return',
    risk: 'entry-burns-after-discovery',
  },
  {
    id: 'secret-window',
    effect: 'enhance',
    cost: 8,
    persistent: true,
    mechanic: 'surveillance',
    condition: 'attach-owl-to-target',
    risk: 'observer-is-exposed',
  },
  {
    id: 'erigeron',
    effect: 'restore',
    cost: 14,
    persistent: false,
    mechanic: 'growth',
    condition: 'living-target',
    risk: 'slow-on-humans',
  },
  {
    id: 'hanzo-skill-4',
    effect: 'enhance',
    cost: 12,
    persistent: true,
    mechanic: 'projection',
    condition: 'body-asleep-and-still',
    risk: 'body-left-defenceless',
  },
  {
    id: 'magical-esthetician-cookie',
    effect: 'restore',
    cost: 24,
    persistent: false,
    mechanic: 'recovery',
    condition: 'uninterrupted-session',
    risk: 'no-offence-during-treatment',
  },
  {
    id: 'silent-majority',
    effect: 'barrage',
    cost: 20,
    persistent: true,
    mechanic: 'ambush',
    condition: 'puppet-and-ten-suspects',
    risk: 'user-damage-on-failure',
  },
  {
    id: 'steal-chain',
    effect: 'bind',
    cost: 20,
    persistent: true,
    mechanic: 'theft',
    condition: 'syringe-contact-and-drain',
    risk: 'single-held-ability',
  },
  {
    id: 'stealth-dolphin',
    effect: 'enhance',
    cost: 16,
    persistent: false,
    mechanic: 'loan',
    condition: 'previously-stolen-ability',
    risk: 'single-use-loan',
  },
  {
    id: 'holy-chain',
    effect: 'restore',
    cost: 22,
    persistent: false,
    mechanic: 'healing',
    condition: 'emperor-time',
    risk: 'lifespan-cost',
  },
  {
    id: 'skill-hunter',
    effect: 'enhance',
    cost: 18,
    persistent: true,
    mechanic: 'loadout',
    condition: 'book-and-theft-conditions',
    risk: 'hand-and-page-restrictions',
  },
  {
    id: 'pain-packer',
    effect: 'impact',
    cost: 6,
    persistent: true,
    mechanic: 'retaliation',
    condition: 'damage-received',
    risk: 'must-survive-charge',
  },
  {
    id: 'blinky',
    effect: 'bind',
    cost: 14,
    persistent: false,
    mechanic: 'vacuum',
    condition: 'named-nonliving-target',
    risk: 'cannot-vacuum-nen',
  },
  {
    id: 'nen-stitches',
    effect: 'restore',
    cost: 10,
    persistent: true,
    mechanic: 'threads',
    condition: 'shorter-thread-is-stronger',
    risk: 'thread-can-be-cut',
  },
  {
    id: 'illumi-needle-people',
    effect: 'bind',
    cost: 18,
    persistent: true,
    mechanic: 'manipulation',
    condition: 'needle-contact-and-order',
    risk: 'consumes-target',
  },
]

export function blackWhaleArenaContract(id: string): BlackWhaleArenaContract | null {
  return BLACK_WHALE_ARENA_CONTRACTS.find((contract) => contract.id === id) ?? null
}
