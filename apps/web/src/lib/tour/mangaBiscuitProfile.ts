import type { HumanProfile } from './humanProfiles'

/** The supplied adult reference has its own clothes and braids, resolved only on transformation. */
export function mangaBiscuitTrueForm(compact: HumanProfile): HumanProfile {
  return {
    ...compact,
    frame: 'adult',
    build: 'broad',
    height: 1.2,
    shoulders: 1.5,
    face: 'square',
    expression: 'severe',
    clothing: 'civilian',
    hairStyle: 'ponytail',
    jacket: 0xd9d4c9,
    shirt: 0xe9e3d5,
    trousers: 0x333137,
    accent: 0x8b8172,
  }
}
