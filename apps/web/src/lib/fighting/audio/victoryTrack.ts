import type { VictoryFrame } from '../victory/playback'

const TRACK_GAIN: Readonly<Record<string, number>> = {
  feitan: 0.65,
  hisoka: 0.9,
  melody: 0.9,
  terebellum: 1.17,
  kalluto: 1.15,
  theta: 1.14,
}

export function victoryTrack(frame: VictoryFrame, fallback = false) {
  const id =
    !fallback &&
    !frame.variant &&
    frame.fighter === 'tserriednich' &&
    frame.finishingShot !== undefined
      ? 'tserriednich-shot'
      : fallback
        ? frame.fighter
        : (frame.variant ?? frame.fighter)
  return { url: `/clash-victories/${id}.m4a`, gain: TRACK_GAIN[id] ?? 1 }
}
