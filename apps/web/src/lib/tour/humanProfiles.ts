import type { Apparition } from './apparitions'

export type HairStyle =
  | 'short'
  | 'military'
  | 'swept'
  | 'long'
  | 'ponytail'
  | 'spiked'
  | 'shaved'
  | 'bob'

export interface HumanProfile {
  build: 'slim' | 'average' | 'broad'
  height: number
  shoulders: number
  skin: number
  hair: number
  hairStyle: HairStyle
  face: 'narrow' | 'round' | 'square'
  expression: 'neutral' | 'severe' | 'tired' | 'anxious' | 'hostile'
  jacket: number
  trousers: number
  shirt: number
  accent: number
  clothing: 'civilian' | 'uniform' | 'suit' | 'combat' | 'ritual'
}

const ROLE_PROFILES: Record<NonNullable<Apparition['human']>['role'], HumanProfile> = {
  witness: {
    build: 'average',
    height: 1,
    shoulders: 1,
    skin: 0xd8b49a,
    hair: 0x342820,
    hairStyle: 'swept',
    face: 'round',
    expression: 'anxious',
    jacket: 0x59636d,
    trousers: 0x29313a,
    shirt: 0xd8d3c8,
    accent: 0x8ba2b5,
    clothing: 'civilian',
  },
  guard: {
    build: 'broad',
    height: 1.04,
    shoulders: 1.12,
    skin: 0xc99473,
    hair: 0x201c1a,
    hairStyle: 'military',
    face: 'square',
    expression: 'severe',
    jacket: 0x475467,
    trousers: 0x273140,
    shirt: 0xd6d9dc,
    accent: 0xd3a742,
    clothing: 'uniform',
  },
  'nen-guard': {
    build: 'broad',
    height: 1.06,
    shoulders: 1.14,
    skin: 0xb8795d,
    hair: 0x171719,
    hairStyle: 'spiked',
    face: 'square',
    expression: 'hostile',
    jacket: 0x582d3b,
    trousers: 0x2c1d26,
    shirt: 0xd9d1cc,
    accent: 0xc95062,
    clothing: 'uniform',
  },
  hunter: {
    build: 'average',
    height: 1.05,
    shoulders: 1.06,
    skin: 0xc8906f,
    hair: 0x252129,
    hairStyle: 'spiked',
    face: 'narrow',
    expression: 'tired',
    jacket: 0x354356,
    trousers: 0x202a37,
    shirt: 0xc7d0d8,
    accent: 0x6f9fbd,
    clothing: 'combat',
  },
  fighter: {
    build: 'broad',
    height: 1.08,
    shoulders: 1.16,
    skin: 0xb9785d,
    hair: 0x241719,
    hairStyle: 'short',
    face: 'square',
    expression: 'hostile',
    jacket: 0x753e3c,
    trousers: 0x332426,
    shirt: 0xd9c9bf,
    accent: 0xc36f68,
    clothing: 'combat',
  },
  steward: {
    build: 'slim',
    height: 0.98,
    shoulders: 0.94,
    skin: 0xe0b894,
    hair: 0x4b3527,
    hairStyle: 'short',
    face: 'narrow',
    expression: 'neutral',
    jacket: 0x335d7d,
    trousers: 0x22384c,
    shirt: 0xeee8dc,
    accent: 0x69a7cf,
    clothing: 'suit',
  },
  victim: {
    build: 'slim',
    height: 1,
    shoulders: 0.96,
    skin: 0xb99b88,
    hair: 0x2e2928,
    hairStyle: 'shaved',
    face: 'narrow',
    expression: 'tired',
    jacket: 0x55565c,
    trousers: 0x303136,
    shirt: 0xbdbab3,
    accent: 0x6c2024,
    clothing: 'civilian',
  },
  'silent-majority': {
    build: 'slim',
    height: 0.96,
    shoulders: 0.94,
    skin: 0xf0ece4,
    hair: 0x141414,
    hairStyle: 'bob',
    face: 'narrow',
    expression: 'neutral',
    jacket: 0x171717,
    trousers: 0x151515,
    shirt: 0xf0ece4,
    accent: 0xf0ece4,
    clothing: 'ritual',
  },
}

function identityHash(value: string): number {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

export function humanProfile(seen: Apparition): HumanProfile {
  const role = seen.human?.role ?? (seen.kind === 'combatant' ? 'fighter' : 'witness')
  const base = ROLE_PROFILES[role]
  const hash = identityHash(seen.human?.identity ?? seen.id)
  const hairs: HairStyle[] =
    role === 'guard' || role === 'nen-guard'
      ? ['military', 'short', 'shaved']
      : ['short', 'swept', 'long', 'ponytail', 'spiked', 'shaved']
  if (role === 'silent-majority') return base
  const skins = [0x8f5d45, 0xb8795d, 0xc99473, 0xd8b49a, 0xe4c3a5]
  return {
    ...base,
    height: base.height * (0.96 + ((hash >>> 5) % 9) / 100),
    skin: skins[(hash >>> 9) % skins.length],
    hairStyle: role === 'victim' ? base.hairStyle : hairs[(hash >>> 13) % hairs.length],
  }
}
