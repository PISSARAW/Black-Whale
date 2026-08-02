import { hatsuAudioGraph } from '$lib/audio/ambient'

export type HuntCue = 'en' | 'nen' | 'hatsu' | 'trap' | 'contact' | 'outcome'

let muted = true
let volume = 0.35

export function huntAudioState() {
  return { muted, volume }
}

export function configureHuntAudio(next: { muted?: boolean; volume?: number }) {
  if (next.muted !== undefined) muted = next.muted
  if (next.volume !== undefined) volume = Math.max(0, Math.min(1, next.volume))
}

export async function enableHuntAudio(): Promise<void> {
  const graph = hatsuAudioGraph()
  if (!graph) return
  await graph.context.resume()
  muted = false
}

export function closeHuntAudio(): void {}

export function playHuntCue(cue: HuntCue): void {
  const graph = hatsuAudioGraph()
  if (!graph || muted || graph.context.state !== 'running') return
  const now = graph.context.currentTime
  const oscillator = graph.context.createOscillator()
  const gain = graph.context.createGain()
  const [frequency, duration, wave] = signature(cue)
  oscillator.type = wave
  oscillator.frequency.setValueAtTime(frequency, now)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.72), now + duration)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.12), now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain).connect(graph.muffle)
  oscillator.start(now)
  oscillator.stop(now + duration)
}

function signature(cue: HuntCue): [number, number, OscillatorType] {
  switch (cue) {
    case 'en': return [180, 0.7, 'sine']
    case 'nen': return [320, 0.18, 'triangle']
    case 'hatsu': return [520, 0.45, 'sine']
    case 'trap': return [110, 0.28, 'square']
    case 'contact': return [75, 0.8, 'sawtooth']
    case 'outcome': return [240, 1.1, 'triangle']
  }
}
