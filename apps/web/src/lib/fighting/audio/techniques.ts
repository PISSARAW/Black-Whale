import { hatsuAudioGraph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'

/** Combat-specific gestures complement the site's existing one-shots. */
export function needleCast(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (let i = 0; i < 3; i++) {
    rush(g, at + i * 0.028, {
      peak: 0.035,
      cutoff: 4800,
      sweepTo: 1900,
      duration: 0.012,
      release: 0.035,
    })
    swept(g, at + i * 0.028, {
      type: 'sine',
      from: 2200 + i * 170,
      to: 1700,
      peak: 0.025,
      duration: 0.01,
      release: 0.08,
      attack: 0.001,
    })
  }
}

export function healingChain(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (const [index, hz] of [294, 440, 587].entries())
    swept(g, at + index * 0.08, {
      type: 'sine',
      from: hz,
      peak: 0.035,
      duration: 0.17,
      attack: 0.055,
      release: 0.4,
    })
  rush(g, at, {
    peak: 0.035,
    cutoff: 700,
    sweepTo: 1800,
    duration: 0.35,
    attack: 0.08,
    release: 0.25,
  })
}

export function bodyDance(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (const [index, hz] of [110, 165, 147, 220].entries()) {
    swept(g, at + index * 0.095, {
      type: 'triangle',
      from: hz,
      peak: 0.065,
      duration: 0.065,
      attack: 0.018,
      release: 0.16,
    })
    rush(g, at + index * 0.095, { peak: 0.035, cutoff: hz * 3, duration: 0.055, release: 0.1 })
  }
}

export function growingFibres(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  rush(g, at, {
    peak: 0.08,
    cutoff: 160,
    sweepTo: 1600,
    duration: 0.4,
    attack: 0.12,
    release: 0.25,
  })
  for (let i = 0; i < 6; i++)
    rush(g, at + i * 0.055, {
      peak: 0.027,
      cutoff: 1400 + i * 100,
      q: 3,
      duration: 0.01,
      release: 0.045,
    })
}

export function readAura(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  rush(g, at, {
    peak: 0.045,
    cutoff: 1300,
    sweepTo: 320,
    duration: 0.19,
    attack: 0.045,
    release: 0.15,
  })
  swept(g, at, {
    type: 'sine',
    from: 174,
    to: 195,
    peak: 0.025,
    duration: 0.18,
    attack: 0.06,
    release: 0.14,
  })
}

export function vacuumIntake(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  swept(g, at, {
    type: 'triangle',
    from: 42,
    to: 96,
    peak: 0.085,
    duration: 0.36,
    attack: 0.09,
    release: 0.25,
  })
  rush(g, at, {
    peak: 0.12,
    cutoff: 320,
    sweepTo: 1800,
    duration: 0.36,
    attack: 0.12,
    release: 0.18,
  })
}

export function radioOrder(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (let i = 0; i < 3; i++)
    rush(g, at + i * 0.06, {
      peak: 0.07,
      cutoff: 1800,
      q: 5,
      duration: 0.025,
      release: 0.035,
    })
  swept(g, at, { type: 'sine', from: 430, to: 290, peak: 0.03, duration: 0.14, release: 0.09 })
}

export function sunMoonMarks(): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (const [offset, hz] of [
    [0, 146.83],
    [0.12, 155.56],
  ]) {
    swept(g, at + offset, {
      type: 'triangle',
      from: hz,
      to: hz * 0.5,
      peak: 0.08,
      duration: 0.12,
      release: 0.18,
    })
    rush(g, at + offset, {
      peak: 0.055,
      cutoff: 2400,
      sweepTo: 380,
      duration: 0.035,
      release: 0.08,
    })
  }
}
