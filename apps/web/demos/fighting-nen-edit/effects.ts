import { BEAT, PIVOT_FREEZE, type Cut } from './shots'

/** Everything the page draws over the scene at one video frame. */
export interface Look {
  zoom: number
  shakeX: number
  shakeY: number
  /** Anime impact frame: 2 = inverted, 1 = harsh black and white. */
  impact: 0 | 1 | 2
  /** Flash in the category's aura colour. */
  flash: number
  lines: number
  gray: boolean
  /** Scarlet vignette while Kurapika's Emperor Time holds the frame. */
  scarlet: number
}

const CALM: Look = {
  zoom: 1,
  shakeX: 0,
  shakeY: 0,
  impact: 0,
  flash: 0,
  lines: 0,
  gray: false,
  scarlet: 0,
}

const jitter = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const decay = (since: number, length: number) =>
  since < 0 || since >= length ? 0 : 1 - since / length

function strike(cut: Cut, local: number): Look {
  const since = local - cut.impact
  const hook = cut.kind === 'hook'
  const hit = decay(since, hook ? 5 : 9)
  const shake = hit * (hook ? 10 : 14)
  return {
    ...CALM,
    zoom: 1 + hit * 0.14 + (since < 0 ? Math.max(0, 1 + since / 6) * 0.04 : 0),
    shakeX: jitter(cut.start + local) * shake,
    shakeY: jitter(cut.start + local + 5) * shake,
    impact: since === 0 ? 2 : since === 1 ? 1 : 0,
    flash: cut.opens ? ([0.75, 0.4, 0.15][local] ?? 0) : hook && since === 0 ? 0.3 : 0,
    lines: decay(since, 10) * 0.65,
    // The unknowns stay grey until their finisher shows their colour.
    gray: cut.category === 'unknown' && since < 0,
  }
}

function pivot(cut: Cut, local: number): Look {
  const held = local - PIVOT_FREEZE
  if (held < 0) return strike(cut, local)
  if (held < BEAT)
    return {
      ...CALM,
      scarlet: Math.min(1, held / 3),
      flash: held === BEAT / 2 ? 0.55 : held === BEAT / 2 + 1 ? 0.2 : 0,
      lines: held >= BEAT / 2 ? 0.5 : 0,
      // The scene keeps Kurapika's whole body in frame, so the push-in is on the picture.
      zoom: 1 + Math.min(1, held / 8) * 0.3,
    }
  return { ...strike(cut, local), scarlet: decay(held - BEAT, 6) * 0.6 }
}

export function lookAt(cut: Cut, local: number): Look {
  if (cut.kind === 'end') return { ...CALM, gray: local > 1, flash: [0.5, 0.15][local] ?? 0 }
  if (cut.kind === 'pivot') return pivot(cut, local)
  return strike(cut, local)
}

/** The pivot's title flips halfway through the Emperor Time freeze. */
export function shownCategory(cut: Cut, local: number) {
  if (cut.kind === 'pivot' && local >= PIVOT_FREEZE + BEAT / 2) return 'specialist' as const
  return cut.category
}
