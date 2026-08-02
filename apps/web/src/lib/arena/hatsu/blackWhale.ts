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
  contract(
    'biohazard-hinrigh',
    'enhance',
    14,
    true,
    'terrain',
    'touch-nonliving-object',
    'limited-transformations',
  ),
  contract(
    'rihan-predator',
    'enhance',
    100,
    false,
    'analysis',
    'three-correct-readings',
    'forty-eight-hour-zetsu',
  ),
  contract(
    'parallel-future',
    'enhance',
    20,
    false,
    'forecast',
    'zetsu-and-eyes-closed',
    'defenceless-preview',
  ),
  contract(
    'cats-name',
    'restore',
    100,
    false,
    'post-mortem',
    'death-by-attacker',
    'must-die-first',
  ),
  contract(
    'benjamin-baton',
    'enhance',
    12,
    true,
    'inheritance',
    'deceased-loyal-soldier',
    'fixed-inherited-loadout',
  ),
  contract(
    'contagion',
    'enhance',
    8,
    true,
    'progression',
    'infected-member-level',
    'requires-kills',
  ),
  contract('bloody-mary', 'bind', 12, true, 'tracking', 'shed-blood', 'blood-loss'),
  contract('body-and-soul', 'impact', 10, false, 'truth', 'question-before-punch', 'melee-contact'),
  contract(
    'damage-sweet-home',
    'restore',
    18,
    true,
    'transfer',
    'touch-source-and-recipient',
    'damage-is-not-erased',
  ),
  contract(
    'lsdf',
    'bind',
    20,
    true,
    'jurisdiction',
    'declared-hideout-intruder',
    'cannot-inflict-harm',
  ),
  contract(
    'luini-spatial-teleportation',
    'enhance',
    16,
    false,
    'space',
    'prepared-entry-and-return',
    'entry-burns-after-discovery',
  ),
  contract(
    'secret-window',
    'enhance',
    8,
    true,
    'surveillance',
    'attach-owl-to-target',
    'observer-is-exposed',
  ),
  contract('erigeron', 'restore', 14, false, 'growth', 'living-target', 'slow-on-humans'),
  contract(
    'hanzo-skill-4',
    'enhance',
    12,
    true,
    'projection',
    'body-asleep-and-still',
    'body-left-defenceless',
  ),
  contract(
    'magical-esthetician-cookie',
    'restore',
    24,
    false,
    'recovery',
    'uninterrupted-session',
    'no-offence-during-treatment',
  ),
  contract(
    'silent-majority',
    'barrage',
    20,
    true,
    'ambush',
    'puppet-and-ten-suspects',
    'user-damage-on-failure',
  ),
  contract(
    'steal-chain',
    'bind',
    20,
    true,
    'theft',
    'syringe-contact-and-drain',
    'single-held-ability',
  ),
  contract(
    'stealth-dolphin',
    'enhance',
    16,
    false,
    'loan',
    'previously-stolen-ability',
    'single-use-loan',
  ),
  contract('holy-chain', 'restore', 22, false, 'healing', 'emperor-time', 'lifespan-cost'),
  contract(
    'skill-hunter',
    'enhance',
    18,
    true,
    'loadout',
    'book-and-theft-conditions',
    'hand-and-page-restrictions',
  ),
  contract(
    'pain-packer',
    'impact',
    6,
    true,
    'retaliation',
    'damage-received',
    'must-survive-charge',
  ),
  contract('blinky', 'bind', 14, false, 'vacuum', 'named-nonliving-target', 'cannot-vacuum-nen'),
  contract(
    'nen-stitches',
    'restore',
    10,
    true,
    'threads',
    'shorter-thread-is-stronger',
    'thread-can-be-cut',
  ),
  contract(
    'illumi-needle-people',
    'bind',
    18,
    true,
    'manipulation',
    'needle-contact-and-order',
    'consumes-target',
  ),
]

export function blackWhaleArenaContract(id: string): BlackWhaleArenaContract | null {
  return BLACK_WHALE_ARENA_CONTRACTS.find((contract) => contract.id === id) ?? null
}

function contract(
  id: string,
  effect: ArenaHatsuEffect,
  cost: number,
  persistent: boolean,
  mechanic: BlackWhaleArenaContract['mechanic'],
  condition: string,
  risk: string,
): BlackWhaleArenaContract {
  return { id, effect, cost, persistent, mechanic, condition, risk }
}
