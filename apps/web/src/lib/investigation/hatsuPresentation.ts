import { hootAnOwl, hissLikeASnake, landAPunch, startFly, stopFly } from '$lib/audio/hatsuSounds'
import { playNenObjectSound } from '$lib/audio/nenSounds'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { InvestigationHatsuUse } from './hatsu'

export type InvestigationHatsuAnimation =
  | 'dowsing-chain'
  | 'scarlet-eyes'
  | 'little-eye'
  | 'secret-window'
  | 'truth-punch'
  | 'silent-majority'
  | 'nen-pulse'

export interface InvestigationHatsuPresentation {
  animation: InvestigationHatsuAnimation
  durationMs: number
  colour: string
  glyph: string
}

const PRESENTATIONS: Partial<Record<HatsuInteractionKind, InvestigationHatsuPresentation>> = {
  dowsing: { animation: 'dowsing-chain', durationMs: 1500, colour: '#d8e5ef', glyph: '◇' },
  scarlet: { animation: 'scarlet-eyes', durationMs: 1800, colour: '#ef3340', glyph: '◉' },
  scout: { animation: 'little-eye', durationMs: 1800, colour: '#d86cff', glyph: '◉' },
  surveillance: { animation: 'secret-window', durationMs: 1800, colour: '#9fd8ff', glyph: '♧' },
  'truth-punch': { animation: 'truth-punch', durationMs: 900, colour: '#f1a06d', glyph: '◉!' },
  snakes: { animation: 'silent-majority', durationMs: 2200, colour: '#aa8bd1', glyph: '∿∿' },
}

const FALLBACK: InvestigationHatsuPresentation = {
  animation: 'nen-pulse',
  durationMs: 1100,
  colour: '#8fe3f0',
  glyph: '念',
}

export function investigationHatsuPresentation(
  kind: HatsuInteractionKind,
): InvestigationHatsuPresentation {
  return PRESENTATIONS[kind] ?? FALLBACK
}

export function playInvestigationHatsuSound(
  kind: HatsuInteractionKind,
  result: Pick<InvestigationHatsuUse, 'tone'>,
) {
  if (result.tone === 'forbidden') {
    landAPunch()
    return
  }
  if (kind === 'dowsing') return playNenObjectSound('sense')
  if (kind === 'scarlet') return playNenObjectSound('pressure')
  if (kind === 'scout') {
    startFly()
    setTimeout(stopFly, 1350)
    return
  }
  if (kind === 'surveillance') return hootAnOwl()
  if (kind === 'truth-punch') return landAPunch()
  if (kind === 'snakes') return hissLikeASnake()
  playNenObjectSound('channel')
}
