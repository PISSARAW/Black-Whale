import type { DeathMatchBeat } from './acts'
import type { DeathMatchState } from './scenario'

/** Hisoka's successive deductions, shown as short visual fragments rather than long text. */
export type HisokaDeduction =
  | 'book-and-bookmark'
  | 'copies-are-puppets'
  | 'copy-count-corrected'
  | 'marked-copies-persist'
  | 'fake-chrollo'
  | 'head-body-link'
  | 'final-plan'

const DEDUCTION_TRIGGERS: Record<HisokaDeduction, DeathMatchBeat> = {
  'book-and-bookmark': 'abilities-presented',
  'copies-are-puppets': 'puppets-decapitated',
  'copy-count-corrected': 'crowd-launched',
  'marked-copies-persist': 'true-face-revealed',
  'fake-chrollo': 'true-face-revealed',
  'head-body-link': 'hand-destroyed',
  'final-plan': 'net-closes',
}

/** Facts Chrollo holds and the Hisoka player must not read before Hisoka understands them. */
export type DeathMatchSecret =
  | 'puppet-identities'
  | 'reserve-copies'
  | 'fake-chrollo-identity'
  | 'head-owners'
  | 'charged-bomb'
  | 'final-plan'

const SECRET_REVEALED_BY: Record<DeathMatchSecret, HisokaDeduction> = {
  'puppet-identities': 'copies-are-puppets',
  'reserve-copies': 'copy-count-corrected',
  'fake-chrollo-identity': 'fake-chrollo',
  'head-owners': 'head-body-link',
  'charged-bomb': 'head-body-link',
  'final-plan': 'final-plan',
}

export type DeathMatchViewer = 'hisoka' | 'chrollo' | 'spectator'

export interface DeathMatchView {
  /** Deduction fragments to show; empty when the assists are off or the viewer is not Hisoka. */
  deductions: HisokaDeduction[]
  secrets: DeathMatchSecret[]
}

export function hisokaDeductions(state: DeathMatchState): HisokaDeduction[] {
  return (Object.keys(DEDUCTION_TRIGGERS) as HisokaDeduction[]).filter((deduction) =>
    state.done.includes(DEDUCTION_TRIGGERS[deduction]),
  )
}

/** What a viewer may know: Chrollo and the replay audience see everything, Hisoka what he deduced. */
export function deathMatchView(state: DeathMatchState, viewer: DeathMatchViewer): DeathMatchView {
  const allSecrets = Object.keys(SECRET_REVEALED_BY) as DeathMatchSecret[]
  if (viewer !== 'hisoka') return { deductions: [], secrets: allSecrets }
  const known = hisokaDeductions(state)
  return {
    deductions: state.options.deductionAssists ? known : [],
    secrets: allSecrets.filter((secret) => known.includes(SECRET_REVEALED_BY[secret])),
  }
}

/** Hisoka counts only what he has seen until he learns that marked copies stay behind. */
export function hisokaCopyEstimate(state: DeathMatchState, census: CopyCensus): number {
  const known = hisokaDeductions(state)
  if (!known.includes('copies-are-puppets')) return 0
  if (!known.includes('copy-count-corrected')) return census.visible
  return census.visible + census.reserve
}

export interface CopyCensus {
  visible: number
  reserve: number
}
