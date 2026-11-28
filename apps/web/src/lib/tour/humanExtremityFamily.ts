import type { HumanProfile } from './humanProfiles'

export type HumanExtremityFamily = 'child' | 'delicate' | 'average' | 'broad'

const LEGACY_HANDS = new Set(['franklin-bordeau'])

export function humanExtremityFamily(profile: HumanProfile): HumanExtremityFamily {
  if (profile.frame !== 'adult') return 'child'
  if (profile.build === 'slim') return 'delicate'
  return profile.build
}

export function usesSkinnedHands(profile: HumanProfile): boolean {
  return Boolean(profile.likeness) && !LEGACY_HANDS.has(profile.likeness ?? '')
}

export function usesSkinnedFeet(profile: HumanProfile): boolean {
  return Boolean(profile.likeness)
}

export function handFamilyScale(family: HumanExtremityFamily): readonly [number, number, number] {
  if (family === 'child') return [0.78, 0.78, 0.74]
  if (family === 'delicate') return [0.9, 0.96, 0.88]
  if (family === 'broad') return [1.12, 1.06, 1.1]
  return [1, 1, 1]
}

export function footFamilyScale(family: HumanExtremityFamily): readonly [number, number, number] {
  if (family === 'child') return [0.82, 0.82, 0.82]
  if (family === 'delicate') return [0.92, 0.98, 0.94]
  if (family === 'broad') return [1.12, 1.06, 1.1]
  return [1, 1, 1]
}
