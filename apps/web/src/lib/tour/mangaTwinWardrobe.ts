import type { HumanAppearance } from './humanAppearance'
import type { HumanProfile } from './humanProfiles'

export type TwinCostume = 'twins-banquet' | 'fugetsu-night'

const BANQUET = {
  royalCostume: 'twins-banquet',
  clothing: 'gown',
  jacket: 0xe8dfd4,
  shirt: 0xe8dfd4,
  trousers: 0xf2e0ca,
  accent: 0x655462,
} as const

const NIGHT = {
  royalCostume: 'fugetsu-night',
  clothing: 'civilian',
  jacket: 0xc6cad8,
  shirt: 0xe7e4e7,
  trousers: 0xc6cad8,
} as const

export function twinWardrobe(profile: HumanProfile, human?: HumanAppearance): HumanProfile {
  const costume = human?.royalCostume
  const { likeness } = profile
  if (costume === 'twins-banquet' && (likeness === 'prince-kacho' || likeness === 'prince-fugetsu'))
    return { ...profile, ...BANQUET, expression: 'neutral' }
  if (costume === 'fugetsu-night' && likeness === 'prince-fugetsu') return { ...profile, ...NIGHT }
  return profile
}
