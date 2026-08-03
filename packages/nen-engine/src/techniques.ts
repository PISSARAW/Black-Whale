/** The ten Nen techniques shared by every interactive surface. */
export type NenTechnique =
  'in' | 'gyo' | 'en' | 'zetsu' | 'ren' | 'ten' | 'ken' | 'ko' | 'ryu' | 'shu' | 'on'

export type NenAuraMode = 'ten' | 'ren' | 'zetsu'

export interface NenTechniqueState<Zone extends string = string> {
  mode: NenAuraMode
  in: boolean
  gyo: boolean
  en: { radius: number } | null
  ken: boolean
  /** On: a dark Ren whose Ryu distribution is imposed until released. */
  on: boolean
  ko: Zone | null
  /** Normalised aura shares. Missing zones carry no deliberately assigned aura. */
  ryu: Partial<Record<Zone, number>>
  /** Object ids currently enveloped in Shu. */
  shu: string[]
}

export type NenTechniqueAction<Zone extends string = string> =
  | { type: 'TEN' }
  | { type: 'REN' }
  | { type: 'ZETSU' }
  | { type: 'IN'; on: boolean }
  | { type: 'GYO'; on: boolean }
  | { type: 'EN'; radius: number | null }
  | { type: 'KEN'; on: boolean }
  | { type: 'KO'; zone: Zone | null }
  | { type: 'RYU'; distribution: Partial<Record<Zone, number>> }
  | { type: 'SHU'; objectId: string; on: boolean }
  | { type: 'ON'; on: boolean; distribution?: Partial<Record<Zone, number>> }

export interface NenTransition<Zone extends string = string> {
  state: NenTechniqueState<Zone>
  accepted: boolean
  reason?: NenTechniqueBlock
}

export type NenTechniqueBlock =
  'ZETSU_HAS_NO_AURA' | 'RADIUS_MUST_BE_POSITIVE' | 'RYU_DISTRIBUTION_EMPTY' | 'ON_FORCES_RYU'

export const NEN_TECHNIQUES: readonly NenTechnique[] = [
  'in',
  'gyo',
  'en',
  'zetsu',
  'ren',
  'ten',
  'ken',
  'ko',
  'ryu',
  'shu',
  'on',
]

export function createNenTechniqueState<Zone extends string = string>(): NenTechniqueState<Zone> {
  return {
    mode: 'ten',
    in: false,
    gyo: false,
    en: null,
    ken: false,
    on: false,
    ko: null,
    ryu: {},
    shu: [],
  }
}

/** Zetsu closes aura output, so every technique fed by aura falls with it. */
function enterZetsu<Zone extends string>(state: NenTechniqueState<Zone>): NenTechniqueState<Zone> {
  return {
    ...state,
    mode: 'zetsu',
    in: false,
    gyo: false,
    en: null,
    ken: false,
    on: false,
    ko: null,
    ryu: {},
    shu: [],
  }
}

/** Ten and Ren reshape the body's output; aura already entrusted to Shu remains. */
function enterAuraMode<Zone extends string>(
  state: NenTechniqueState<Zone>,
  mode: Exclude<NenAuraMode, 'zetsu'>,
): NenTechniqueState<Zone> {
  return { ...state, mode, on: false, ken: false, ko: null, ryu: {} }
}

function needsAura<Zone extends string>(
  state: NenTechniqueState<Zone>,
): NenTransition<Zone> | null {
  return state.mode === 'zetsu' ? { state, accepted: false, reason: 'ZETSU_HAS_NO_AURA' } : null
}

function normalise<Zone extends string>(input: Partial<Record<Zone, number>>) {
  const entries = Object.entries(input).filter((entry): entry is [Zone, number] => {
    const value = entry[1]
    return typeof value === 'number' && Number.isFinite(value) && value > 0
  })
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  if (!total) return null
  return Object.fromEntries(entries.map(([zone, value]) => [zone, value / total])) as Partial<
    Record<Zone, number>
  >
}

/**
 * Authoritative state transition for Nen basics. UI, combat and exploration
 * adapters may attach costs or animation, but they do not redefine compatibility.
 */
export function transitionNen<Zone extends string>(
  state: NenTechniqueState<Zone>,
  action: NenTechniqueAction<Zone>,
): NenTransition<Zone> {
  if (action.type === 'ZETSU') return { state: enterZetsu(state), accepted: true }
  if (action.type === 'TEN') return { state: enterAuraMode(state, 'ten'), accepted: true }
  if (action.type === 'REN') return { state: enterAuraMode(state, 'ren'), accepted: true }

  if (action.type === 'ON') {
    if (!action.on) return { state: { ...state, on: false }, accepted: true }
    const ryu = normalise(action.distribution ?? {})
    return ryu
      ? {
          state: { ...state, mode: 'ren', on: true, ken: false, ko: null, ryu },
          accepted: true,
        }
      : { state, accepted: false, reason: 'RYU_DISTRIBUTION_EMPTY' }
  }

  const blocked = needsAura(state)
  if (blocked) return blocked
  return transitionWithAura(state, action)
}

/**
 * The half of the vocabulary that presupposes aura already flowing.
 *
 * Split out because the two halves answer different questions: everything
 * above decides whether aura is up at all, everything here shapes aura that is
 * already up. Read together they formed one function wide enough that adding a
 * technique meant re-reading all of it.
 */
function transitionWithAura<Zone extends string>(
  state: NenTechniqueState<Zone>,
  action: Exclude<NenTechniqueAction<Zone>, { type: 'ZETSU' | 'TEN' | 'REN' | 'ON' }>,
): NenTransition<Zone> {
  if (action.type === 'IN') return { state: { ...state, in: action.on }, accepted: true }
  if (action.type === 'GYO') return { state: { ...state, gyo: action.on }, accepted: true }
  if (action.type === 'EN') {
    if (action.radius !== null && action.radius <= 0)
      return { state, accepted: false, reason: 'RADIUS_MUST_BE_POSITIVE' }
    return {
      state: { ...state, en: action.radius === null ? null : { radius: action.radius } },
      accepted: true,
    }
  }
  if (action.type === 'KEN') {
    if (state.on) return { state, accepted: false, reason: 'ON_FORCES_RYU' }
    return {
      state: {
        ...state,
        mode: action.on ? 'ren' : state.mode,
        ken: action.on,
        ko: action.on ? null : state.ko,
      },
      accepted: true,
    }
  }
  if (action.type === 'KO') {
    if (state.on) return { state, accepted: false, reason: 'ON_FORCES_RYU' }
    return {
      state: {
        ...state,
        ken: false,
        ko: action.zone,
        ryu:
          action.zone === null
            ? state.ryu
            : ({ [action.zone]: 1 } as Partial<Record<Zone, number>>),
      },
      accepted: true,
    }
  }
  if (action.type === 'RYU') {
    if (state.on) return { state, accepted: false, reason: 'ON_FORCES_RYU' }
    const ryu = normalise(action.distribution)
    return ryu
      ? { state: { ...state, ko: null, ryu }, accepted: true }
      : { state, accepted: false, reason: 'RYU_DISTRIBUTION_EMPTY' }
  }

  const shu = action.on
    ? [...new Set([...state.shu, action.objectId])]
    : state.shu.filter((id) => id !== action.objectId)
  return { state: { ...state, shu }, accepted: true }
}

export const canUseHatsu = (state: NenTechniqueState) => state.mode !== 'zetsu'
export const canSeeIn = (state: NenTechniqueState) => state.gyo
export const isAuraVisibleTo = (source: NenTechniqueState, observer: NenTechniqueState) =>
  !source.in || observer.gyo
/** Zetsu leaves the body with no aura defence against Hatsu or aura-clad blows. */
export const nenDefenceFactor = (state: NenTechniqueState) =>
  state.mode === 'zetsu' ? 0 : state.ken ? 1 : state.on ? 0.9 : state.mode === 'ren' ? 0.65 : 0.35

export interface EnPresence {
  id: string
  at: readonly [number, number]
  nen?: NenTechniqueState
}

export interface EnDetection extends EnPresence {
  distance: number
  /** Zetsu suppresses the aura signature, but not the body's displacement of En. */
  auraSignature: boolean
}

/** Everything physically entering the user's En, nearest first. */
export function detectWithEn(
  observer: { at: readonly [number, number]; nen: NenTechniqueState },
  presences: readonly EnPresence[],
): EnDetection[] {
  if (!observer.nen.en || observer.nen.mode === 'zetsu') return []
  return presences
    .map((presence) => ({
      ...presence,
      distance: Math.hypot(presence.at[0] - observer.at[0], presence.at[1] - observer.at[1]),
      auraSignature: presence.nen?.mode !== 'zetsu',
    }))
    .filter((presence) => presence.distance <= observer.nen.en!.radius)
    .sort((left, right) => left.distance - right.distance)
}
