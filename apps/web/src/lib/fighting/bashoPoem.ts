import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloPageForMove, CHROLLO_SECONDARY } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hatsuSealedByOn } from './onTechnique'
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

export interface BashoPoem {
  text: string
  effect: 'ignite-punched-target'
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
  const normalized = normalizePoem(text)
  return Object.values(BASHO_POEMS).some((poem) => normalizePoem(poem) === normalized)
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
  return (
    fighter.aura > 0 &&
    canUseHatsu(fighter.nen) &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    !fighter.moonlightZetsu &&
    !hatsuSealedByOn(fighter)
  )
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
    freeWritingMind(fighter)
  )
}

function freeWritingMind(fighter: ArcadeFighter): boolean {
  const effects = fighter.hatsuEffects
  return ![
    effects.manipulatedFrames,
    Number(Boolean(fighter.needlePuppet)),
    effects.entrancedFrames,
    effects.possessedFrames,
    effects.momozeFrames,
  ].some((frames) => frames > 0)
}
