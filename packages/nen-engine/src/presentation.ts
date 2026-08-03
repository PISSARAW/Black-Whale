import type { NenTechnique } from './techniques.js'

export interface NenPresentation {
  colours: readonly [number, number]
  pulseHz: number
  intensity: number
  envelope: { attack: number; sustain: number; release: number }
  sound: { lowHz: number; highHz: number; noise: number; volume: number }
}

/** Shared audiovisual grammar. Modes may scale it, but never redefine it. */
export const NEN_PRESENTATION: Readonly<Record<NenTechnique, NenPresentation>> = {
  ten: {
    colours: [0xbcecff, 0x6cbfe2],
    pulseHz: 0.28,
    intensity: 0.28,
    envelope: { attack: 0.34, sustain: 1, release: 0.42 },
    sound: { lowHz: 210, highHz: 520, noise: 0.02, volume: 0.22 },
  },
  zetsu: {
    colours: [0x20303a, 0x071017],
    pulseHz: 0.08,
    intensity: 0.015,
    envelope: { attack: 0.08, sustain: 1, release: 0.55 },
    sound: { lowHz: 48, highHz: 480, noise: 0.08, volume: 0.16 },
  },
  ren: {
    colours: [0xe0f7ff, 0x72ccea],
    pulseHz: 1.15,
    intensity: 0.86,
    envelope: { attack: 0.18, sustain: 1, release: 0.65 },
    sound: { lowHz: 62, highHz: 230, noise: 0.42, volume: 0.72 },
  },
  gyo: {
    colours: [0xf3fdff, 0x73d7ff],
    pulseHz: 2.4,
    intensity: 0.62,
    envelope: { attack: 0.09, sustain: 1, release: 0.18 },
    sound: { lowHz: 720, highHz: 1680, noise: 0.02, volume: 0.32 },
  },
  in: {
    colours: [0x7da5b5, 0x263e49],
    pulseHz: 0.18,
    intensity: 0.06,
    envelope: { attack: 0.12, sustain: 1, release: 0.38 },
    sound: { lowHz: 120, highHz: 640, noise: 0.04, volume: 0.12 },
  },
  en: {
    colours: [0xc9f4ff, 0x4cb9dc],
    pulseHz: 0.42,
    intensity: 0.48,
    envelope: { attack: 0.48, sustain: 1, release: 0.5 },
    sound: { lowHz: 190, highHz: 980, noise: 0.1, volume: 0.42 },
  },
  shu: {
    colours: [0xd9f7ff, 0x65c6e8],
    pulseHz: 0.72,
    intensity: 0.5,
    envelope: { attack: 0.22, sustain: 1, release: 0.34 },
    sound: { lowHz: 260, highHz: 780, noise: 0.04, volume: 0.3 },
  },
  ken: {
    colours: [0xe5faff, 0x65bad8],
    pulseHz: 0.52,
    intensity: 0.76,
    envelope: { attack: 0.26, sustain: 1, release: 0.48 },
    sound: { lowHz: 74, highHz: 184, noise: 0.28, volume: 0.62 },
  },
  ko: {
    colours: [0xffffff, 0x82ddff],
    pulseHz: 2.8,
    intensity: 1,
    envelope: { attack: 0.42, sustain: 1, release: 0.16 },
    sound: { lowHz: 44, highHz: 310, noise: 0.58, volume: 0.9 },
  },
  ryu: {
    colours: [0xd8f6ff, 0x57bddd],
    pulseHz: 1.35,
    intensity: 0.68,
    envelope: { attack: 0.16, sustain: 1, release: 0.22 },
    sound: { lowHz: 290, highHz: 520, noise: 0.08, volume: 0.38 },
  },
  on: {
    colours: [0x01040c, 0x123b7a],
    pulseHz: 1.8,
    intensity: 1,
    envelope: { attack: 0.2, sustain: 1, release: 0.72 },
    sound: { lowHz: 42, highHz: 176, noise: 0.62, volume: 0.92 },
  },
}
