import { loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import { writingMaterialsReady, writingPaperExists } from './bashoMaterials'
import { illumiBodyFree } from './illumiState'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
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

export const BASHO_ATTESTED_POEMS = {
  'ignite-punched-target': BASHO_POEMS,
  'ignite-liar': {
    fr: 'À ma question\nLe mensonge appelle\nUn feu mortel',
    en: 'When I ask\nA knowing lie calls\nA deadly fire',
  },
  'ward-weak-spirits': {
    fr: 'Lumière d’hiver\nSur le chemin gelé\nLes ombres reculent',
    en: 'Winter light\nAcross the frozen path\nShadows draw away',
  },
} as const
export type BashoEffect = keyof typeof BASHO_ATTESTED_POEMS

export interface BashoPoem {
  loan?: boolean
  text: string
  effect: BashoEffect
  paperId?: string
  paperCopyId?: string
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
  return Object.values(BASHO_ATTESTED_POEMS).some((pair) =>
    Object.values(pair).some((poem) => normalizePoem(poem) === normalized),
  )
}

export function recognizedBashoEffect(text: string): BashoEffect | undefined {
  const normalized = normalizePoem(text)
  return (Object.keys(BASHO_ATTESTED_POEMS) as BashoEffect[]).find((effect) =>
    Object.values(BASHO_ATTESTED_POEMS[effect]).some((poem) => normalizePoem(poem) === normalized),
  )
}
export function bashoEffectPoem(
  fighter: ArcadeFighter,
  effect: BashoEffect,
): BashoPoem | undefined {
  return [fighter.bashoPoem, ...(fighter.bashoArchive ?? [])].find(
    (poem) =>
      poem?.ready && poem.effect === effect && hasBashoPoem(fighter, poem.sourceMoveId, poem.loan),
  )
}
export function availableBashoPoem(
  state: FightState,
  side: 'player' | 'opponent',
  effect: BashoEffect,
): BashoPoem | undefined {
  const actor = state[side]
  return [actor.bashoPoem, ...(actor.bashoArchive ?? [])].find(
    (poem) =>
      poem?.ready &&
      poem.effect === effect &&
      hasBashoPoem(actor, poem.sourceMoveId, poem.loan) &&
      writingPaperExists(state, poem.paperCopyId),
  )
}
declare module './types' {
  interface ArcadeFighter {
    bashoArchive?: readonly BashoPoem[]
  }
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

export function hasBashoPoem(fighter: ArcadeFighter, _moveId?: string, loan = false): boolean {
  const supplied = bashoSuppliedActor(fighter, loan)
  if (!supplied) return false
  fighter = supplied
  if (!bashoNenAvailable(fighter) || chainAbilitySealed(fighter, BASHO_POEM_MOVE)) return false
  if (fighter.id === 'basho') return fighter.hatsuEffects.hatsuStolen === 0
  if (borrowedBashoAvailable(fighter)) return true
  return fighter.id === 'chrollo' && chrolloHasActivePage(fighter, 'basho')
}

function bashoSuppliedActor(fighter: ArcadeFighter, loan: boolean): ArcadeFighter | undefined {
  if (loan) {
    if (fighter.dolphinLoan?.held.source !== 'basho') return undefined
    return stolenAuraActor(loanCarrier(fighter))
  }
  return fighter.kurapika?.held?.source === 'basho' ? stolenAuraActor(fighter) : fighter
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
    !borrowedPoemAlreadyUsed(fighter) &&
    writingMaterialsReady(state, side) &&
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
    !fighter.deviceTouchId &&
    ![
      effects.manipulatedFrames,
      Number(Boolean(fighter.needlePuppet)),
      effects.entrancedFrames,
      effects.possessedFrames,
      effects.momozeFrames,
    ].some((frames) => frames > 0)
  )
}

function borrowedBashoAvailable(fighter: ArcadeFighter): boolean {
  const chain = fighter.kurapika,
    held = chain?.held
  return Boolean(held?.source === 'basho' && held.loaded && chain?.emperorTime)
}
function borrowedPoemAlreadyUsed(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return held?.source === 'basho' && held.used
}
