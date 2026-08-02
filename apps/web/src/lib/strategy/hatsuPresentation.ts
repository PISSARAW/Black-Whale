import type { ApparitionKind } from '$lib/tour/apparitions'
import {
  blowAGust,
  chirpTheFlock,
  crackAWhip,
  crushLikeACat,
  hissLikeASnake,
  hootAnOwl,
  playATune,
  selectACard,
  strikeAGong,
  unspoolWire,
  wakeTheMachine,
} from '$lib/audio/hatsuSounds'

export interface StrategyHatsuCue {
  seq: number
  abilityId: string
  sourceCharacterId: string
  sourceLocationId: string
  targetLocationId: string
  report: string
}

export interface StrategyHatsuPresentation {
  kind: ApparitionKind
  colour: number
  size: number
  durationMs: number
  sound: () => void
}

const PRESENTATIONS: Record<string, StrategyHatsuPresentation> = {
  'dowsing-chain': { kind: 'chain', colour: 0x8ecae6, size: 1.25, durationMs: 2400, sound: unspoolWire },
  'little-eye': { kind: 'insect', colour: 0x55c2ff, size: 0.45, durationMs: 4200, sound: chirpTheFlock },
  'secret-window': { kind: 'owl', colour: 0xa8b7d8, size: 0.8, durationMs: 5000, sound: hootAnOwl },
  'emperor-time': { kind: 'mark', colour: 0xef3340, size: 0.75, durationMs: 3200, sound: () => strikeAGong(2) },
  'steal-chain': { kind: 'chain', colour: 0xd7dce2, size: 1.35, durationMs: 2800, sound: unspoolWire },
  'chain-jail': { kind: 'chain', colour: 0xc9ced6, size: 1.6, durationMs: 3600, sound: hissLikeASnake },
  erigeron: { kind: 'bloom', colour: 0x7fd35b, size: 0.8, durationMs: 4200, sound: () => playATune('bloom') },
  'benjamin-aura': { kind: 'star', colour: 0xf0b429, size: 1, durationMs: 3000, sound: () => strikeAGong(2) },
  'benjamin-baton': { kind: 'star', colour: 0xffd166, size: 0.9, durationMs: 5000, sound: () => selectACard(3) },
  'air-blow': { kind: 'note', colour: 0xc6f1ff, size: 0.7, durationMs: 1600, sound: blowAGust },
  culdcept: { kind: 'card', colour: 0x8c7ae6, size: 0.75, durationMs: 4200, sound: () => selectACard(1) },
  'cats-name': { kind: 'cat', colour: 0xff8fab, size: 1.8, durationMs: 5200, sound: crushLikeACat },
  'biohazard-hinrigh': { kind: 'sprite', colour: 0x77c887, size: 1, durationMs: 4800, sound: wakeTheMachine },
  contagion: { kind: 'mark', colour: 0xd94f68, size: 0.9, durationMs: 4800, sound: crackAWhip },
}

export function strategyHatsuPresentation(abilityId: string): StrategyHatsuPresentation | null {
  return PRESENTATIONS[abilityId] ?? null
}
