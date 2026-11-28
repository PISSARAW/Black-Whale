import { FREEZE, type Cut } from './shots'

/** Everything the page draws over the scene at one video frame. */
export interface Look {
  /** Punch-in scale on the whole picture. */
  zoom: number
  /** Screen shake in px of a 720 px wide page. */
  shakeX: number
  shakeY: number
  /** Anime impact frame: 2 = inverted, 1 = harsh black and white, 0 = normal. */
  impact: 0 | 1 | 2
  /** White flash opacity. */
  flash: number
  /** Radial speed-line opacity. */
  lines: number
  gray: boolean
}

const CALM: Look = {
  zoom: 1,
  shakeX: 0,
  shakeY: 0,
  impact: 0,
  flash: 0,
  lines: 0,
  gray: false,
}

/** Deterministic jitter: the same frame always shakes the same way. */
const jitter = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const decay = (since: number, length: number) =>
  since < 0 || since >= length ? 0 : 1 - since / length

function chainLook(cut: Cut, local: number, hits: readonly number[]): Look {
  const rush = cut.section === 'rush'
  const sinceHit = Math.min(...hits.map((h) => local - h).filter((d) => d >= 0), 99)
  const shake = decay(sinceHit, 5) * (rush ? 9 : 6)
  return {
    ...CALM,
    zoom: 1 + decay(local, rush ? 3 : 5) * (rush ? 0.1 : 0.06),
    shakeX: jitter(cut.start + local) * shake,
    shakeY: jitter(cut.start + local + 7) * shake,
    lines: rush ? 0.22 : 0,
    flash: rush && local === 0 ? 0.18 : 0,
  }
}

function finisherLook(cut: Cut, local: number): Look {
  const since = local - (cut.freeze ?? 0)
  const frozen = since >= 0 && since < FREEZE
  const after = decay(since - FREEZE, 10)
  const shake = frozen ? 16 : after * 12
  const approach = Math.max(0, Math.min(1, (local - (cut.freeze ?? 0) + 10) / 10))
  return {
    ...CALM,
    zoom: frozen ? 1.2 - since * 0.015 : 1 + approach * 0.08 + after * 0.1,
    shakeX: jitter(cut.start + local) * shake,
    shakeY: jitter(cut.start + local + 3) * shake,
    impact: since === 0 ? 2 : since === 1 ? 1 : 0,
    flash: cut.section === 'drop' ? ([0.85, 0.25][local] ?? 0) : 0,
    lines: frozen ? 0.75 : after * 0.5,
  }
}

export function lookAt(cut: Cut, local: number, hits: readonly number[]): Look {
  if (cut.section === 'brake') return { ...CALM, gray: true, zoom: 1.04 + local * 0.004 }
  if (cut.section === 'end') return { ...CALM, gray: local > 1, flash: [0.6, 0.15][local] ?? 0 }
  if (cut.section === 'hook' || cut.section === 'drop') return finisherLook(cut, local)
  return chainLook(cut, local, hits)
}
