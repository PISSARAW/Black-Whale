export const TSERRIEDNICH_VICTORY_DURATION = 11
export const FUTURE_VISION_START = 0.55
export const FUTURE_EYES_OPEN = 2.2
export const FUTURE_ZETSU_END = 6.8
export const FUTURE_VERDICT = 9.5
export const FUTURE_SHOT = 8.25
export const FUTURE_FALL = 8.38
export const FUTURE_LANDING = 9.18
export const FUTURE_VISION_HIT = FUTURE_VISION_START + 1.58 / 1.38
export const FUTURE_FORECAST_SECONDS = 10
export const FUTURE_CLOSING_EYES = 0.22
export const FUTURE_RECOGNITION = 7.18
export const FUTURE_RECOGNITION_END = 7.66

export function tserriednichSplit(elapsed: number) {
  return elapsed >= FUTURE_EYES_OPEN && elapsed < FUTURE_ZETSU_END
}

export function tserriednichPortrait(elapsed: number) {
  if (elapsed >= FUTURE_CLOSING_EYES && elapsed < FUTURE_VISION_START) return 'hero'
  if (elapsed >= FUTURE_RECOGNITION && elapsed < FUTURE_RECOGNITION_END) return 'victim'
}
