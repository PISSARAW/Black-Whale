import { chrolloAbilityActive } from './chrolloAbilityActive'
import { clearOwnedGum } from './bungeeNetwork'
import { releaseLuiniAnchor } from './luiniSpatial'
import { releaseIllumiPage } from './illumiFrame'
import { releaseMachiPageThread } from './machiThread'
import { chrolloHasActivePage, type ChrolloPage } from './chrolloBook'
import type { ArcadeFighter, FighterHatsuEffects, FightSide, FightState } from './types'

type EffectKey = {
  [K in keyof FighterHatsuEffects]-?: FighterHatsuEffects[K] extends number ? K : never
}[keyof FighterHatsuEffects]

/** Optional copied states keep the book independent of native fighters' module lifecycles. */
type CopiedFighter = ArcadeFighter & {
  hanzoProjection?: { bodyX: number; bodyFacing: -1 | 1; bodyNen: ArcadeFighter['nen'] }
  hatsuEffects: ArcadeFighter['hatsuEffects'] & {
    painPacker?: { armour: boolean; packedDamage: number; sun: unknown } | null
  }
}

const OWN_EFFECTS: Partial<Record<ChrolloPage, readonly EffectKey[]>> = {
  phinks: ['cyclotronTurns'],
  shizuku: ['blinkyFrames'],
  luini: ['teleportDodges'],
  marayam: ['isolationFrames'],
  fugetsu: ['wormDodges'],
  kacho: ['kachoGuards'],
  zhanglei: ['coinCharges'],
  tubeppa: ['synthesisFrames'],
}
const TARGET_EFFECTS: Partial<Record<ChrolloPage, readonly EffectKey[]>> = {
  'black-voice': ['manipulatedFrames'],
  kurapika: ['forcedZetsuFrames'],
  machi: ['stitchedFrames'],
  saiyu: ['senseSeals'],
  mizaistom: ['restrainedFrames'],
  melody: ['entrancedFrames'],
  morena: ['contagionFrames', 'contagionStacks'],
  halkenburg: ['possessedFrames'],
}

/** Closing a non-bookmarked page ends its Nen. Wounds and post-mortem Sun/Moon marks stay. */
export function reconcileChrolloPages(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const pages = before[side].chrolloBook?.pages ?? []
  const book = before[side].chrolloBook
  const lost = pages.filter(
    (page) =>
      (book?.bookmark === page || (book?.open && book.pages[book.page] === page)) &&
      !chrolloHasActivePage(after[side], page),
  )
  return lost.reduce((state, page) => clearPageEffects({ state, side, page }), after)
}

function clearPageEffects(options: {
  state: FightState
  side: FightSide
  page: ChrolloPage
}): FightState {
  const { state, side } = options
  const page = options.page.split(':')[0] as ChrolloPage
  const targetSide = side === 'player' ? 'opponent' : 'player'
  let owner = clearHisokaPage(clearEffects(state[side], OWN_EFFECTS[page] ?? []), page)
  owner = endCopiedObservation(owner, page)
  if (page === 'padaille') owner = { ...owner, padailleTool: undefined }
  if (page === 'hanzo') owner = endCopiedProjection(owner)
  owner = endCopiedPainPacker(owner, page)
  const cleared = {
    ...state,
    [side]: owner,
    [targetSide]: clearEffects(state[targetSide], TARGET_EFFECTS[page] ?? []),
    bungeeGum: page === 'hisoka' && state.bungeeGum?.owner === side ? null : state.bungeeGum,
  }
  const spatial = releaseSpatialPage(cleared, side, page)
  return releaseMachiPageThread(releaseIllumiPage(spatial, side, page), side, page)
}
function releaseSpatialPage(state: FightState, side: FightSide, page: ChrolloPage): FightState {
  if (page === 'luini') return releaseLuiniAnchor(state, side)
  return page === 'hisoka' ? clearOwnedGum(state, side) : state
}

function endCopiedObservation(fighter: CopiedFighter, page: ChrolloPage): CopiedFighter {
  if (
    page === 'kalluto' &&
    fighter.kallutoPaper &&
    !chrolloAbilityActive(fighter, 'kalluto:backSpecial')
  )
    return { ...fighter, kallutoPaper: { ...fighter.kallutoPaper, doll: undefined } }
  return page === 'musse' ? { ...fighter, secretWindow: undefined } : fighter
}

function clearEffects(fighter: CopiedFighter, keys: readonly EffectKey[]): CopiedFighter {
  const hatsuEffects = { ...fighter.hatsuEffects }
  for (const key of keys) hatsuEffects[key] = 0
  return { ...fighter, hatsuEffects }
}

function endCopiedProjection(fighter: CopiedFighter): CopiedFighter {
  const body = fighter.hanzoProjection
  if (!body) return fighter
  return {
    ...fighter,
    hanzoProjection: undefined,
    x: body.bodyX,
    y: 0,
    facing: body.bodyFacing,
    nen: fighter.nen.mode === 'zetsu' ? fighter.nen : body.bodyNen,
    velocityY: 0,
    motion: undefined,
    pose: 'idle',
    crouching: false,
    blocking: false,
    guardFrames: 0,
    attack: null,
    bufferedAttack: null,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    ryuWindow: 0,
  }
}

function endCopiedPainPacker(fighter: CopiedFighter, page: ChrolloPage): CopiedFighter {
  if (page === 'feitan' && fighter.hatsuEffects.painPacker) {
    return {
      ...fighter,
      hatsuEffects: {
        ...fighter.hatsuEffects,
        painPacker: {
          ...fighter.hatsuEffects.painPacker,
          armour: false,
          packedDamage: 0,
          sun: null,
        },
      },
    }
  }
  return fighter
}

function clearHisokaPage(fighter: ArcadeFighter, page: ChrolloPage): ArcadeFighter {
  if (page !== 'hisoka') return fighter
  return {
    ...fighter,
    textureSurprise: chrolloAbilityActive(fighter, 'hisoka:downSpecial')
      ? fighter.textureSurprise
      : undefined,
    gumWoundSeals: chrolloAbilityActive(fighter, 'hisoka:neutralSpecial')
      ? fighter.gumWoundSeals
      : undefined,
  }
}
