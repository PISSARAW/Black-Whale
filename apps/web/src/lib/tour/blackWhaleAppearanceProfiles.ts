import type { HumanProfile } from './humanProfiles'
import type { HumanAppearance } from './humanAppearance'

/** Bonolenov's travelling clothes and face in chapters 392–393. */
const bonolenovHisokaProfile: HumanProfile = {
  likeness: 'bonolenov-as-hisoka',
  build: 'slim',
  frame: 'adult',
  height: 1.12,
  shoulders: 1.03,
  proportions: { limbs: 1.07, hips: 0.9, shoulderSlope: 0.07 },
  skin: 0xe4c8b3,
  hair: 0x89648d,
  hairStyle: 'curtain',
  face: 'narrow',
  expression: 'neutral',
  jacket: 0x202126,
  trousers: 0x1e1f23,
  shirt: 0x3b3c40,
  accent: 0xb9b5ac,
  clothing: 'civilian',
  signatures: [],
}

export function declaredBlackWhaleProfile(
  identity: string,
  appearance: HumanAppearance | undefined,
  profiles: ReadonlyMap<string, HumanProfile>,
): HumanProfile | undefined {
  if (identity === 'bonolenov-ndongo' && appearance?.bonolenovDisguise)
    return appearance.bonolenovDisguise === 'hisoka'
      ? bonolenovHisokaProfile
      : profiles.get('lynch-fullbokko')
  const declared = profiles.get(identity)
  if (declared && identity === 'keni-wang' && appearance?.plainSuit)
    return { ...declared, plainSuit: true, jacket: 0x25252a, trousers: 0x25252a }
  return declared
}
