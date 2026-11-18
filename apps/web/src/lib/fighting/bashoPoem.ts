import { illumiBodyFree } from './illumiState'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloPageForMove, CHROLLO_SECONDARY } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightState } from './types'

export const BASHO_POEM_MOVE = 'basho:neutralSpecial'
export const BASHO_WRITING_FRAMES = 60
export const BASHO_WRITING_COST = 25
export const BASHO_FIRE_FRAMES = 90
export const BASHO_FIRE_INTERVAL = 30
export const BASHO_POEMS = {
  fr: 'Tout ce que je frappe\nAvec mon poing\nPrendra feu',
  en: 'Whatever I strike\nWith my fist\nWill burn',
} as const

/** Meaning translations, not a claim to reproduce a particular licensed translation. */
export const BASHO_TRIAL_POEMS = {
  fr: 'Si vous me mentez\nVotre corps sera livré\nAu jugement du feu',
  en: 'If you lie to me\nYour body will be given\nTo the trial by fire',
} as const

export interface BashoPoem {
  text: string
  effect: 'ignite-punched-target' | 'trial-by-fire'
  declaration?: { frame: number; question: import('./dowsingTypes').DowsingQuestion }
  sourceMoveId?: string
  writingFrames: number
  originX: number
  ready: boolean
}

export interface BashoBurn {
  owner: 'player' | 'opponent'
  remainingFrames: number
}

/** Recognize this attested composition, never guess powers from arbitrary prose. */
export function recognizedBashoPoem(text: string): boolean {
  return bashoPoemEffect(text) !== null
}

export function bashoPoemEffect(text: string): BashoPoem['effect'] | null {
  const normalized = normalizePoem(text)
  if (Object.values(BASHO_POEMS).some((poem) => normalizePoem(poem) === normalized))
    return 'ignite-punched-target'
  return Object.values(BASHO_TRIAL_POEMS).some((poem) => normalizePoem(poem) === normalized)
    ? 'trial-by-fire'
    : null
}

function normalizePoem(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase()
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/[.,;:!?«»“”]/g, '')
        .trim()
        .replace(/\s+/g, ' '),
    )
    .join('\n')
}

export function bashoNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireReserve: true })
}

export function hasBashoPoem(fighter: ArcadeFighter, moveId?: string): boolean {
  if (!bashoNenAvailable(fighter)) return false
  if (fighter.id === 'basho')
    return fighter.hatsuEffects.hatsuStolen === 0 && !chainAbilitySealed(fighter, BASHO_POEM_MOVE)
  const held = fighter.kurapika?.held
  if (held?.used && held.source === 'basho') return true
  return (
    chrolloPageForMove(fighter, moveId) === 'basho' ||
    (!moveId && chrolloPageForMove(fighter, CHROLLO_SECONDARY) === 'basho')
  )
}

export function bashoWriting(fighter: ArcadeFighter): boolean {
  return (fighter.bashoPoem?.writingFrames ?? 0) > 0
}

export function bashoCanWrite(state: FightState, side: 'player' | 'opponent'): boolean {
  const fighter = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    hasBashoPoem(fighter) &&
    fighter.aura >= BASHO_WRITING_COST &&
    !bashoWriting(fighter) &&
    writingBodyAvailable(fighter)
  )
}

export function writingBodyAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.y === 0 &&
    !fighter.hanzoProjection &&
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.blocking &&
    !fighter.melodyPerformance &&
    freeWritingMind(fighter)
  )
}

function freeWritingMind(fighter: ArcadeFighter): boolean {
  const effects = fighter.hatsuEffects
  return (
    illumiBodyFree(fighter) &&
    ![
      effects.manipulatedFrames,
      Number(Boolean(fighter.needlePuppet)),
      effects.entrancedFrames,
      effects.possessedFrames,
      effects.momozeFrames,
    ].some((frames) => frames > 0)
  )
}
