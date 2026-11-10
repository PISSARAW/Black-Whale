import { hatsuAudioGraph, midiToHz } from './mixer'
import { MELODY_CONCERT_AIR } from './concertAir'

/** An original flute interpretation on the shared effects bus, with an owned,
 * cancellable output. No recording or score from the manga/anime is used. */
export function startMelodyConcert(): () => void {
  const graph = hatsuAudioGraph()
  if (!graph) return () => {}
  const { context } = graph
  const output = context.createGain()
  output.gain.value = 0.7
  output.connect(graph.muffle)
  output.connect(graph.reverbSend)
  const voices = new Set<OscillatorNode>()
  const air = MELODY_CONCERT_AIR
  const phrase = air.length * air.beat
  let bar = context.currentTime + 0.04
  let index = 0
  let stopped = false

  function note(at: number, pitch: number, duration: number): void {
    for (const [harmonic, peak] of [
      [1, 0.075],
      [2, 0.012],
    ]) {
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = midiToHz(74 + pitch) * harmonic
      oscillator.detune.value = harmonic === 1 ? -1.2 : 1.2
      envelope.gain.setValueAtTime(0, at)
      envelope.gain.linearRampToValueAtTime(peak, at + 0.045)
      envelope.gain.setValueAtTime(peak * 0.85, at + duration * 0.7)
      envelope.gain.linearRampToValueAtTime(0, at + duration + 0.13)
      oscillator.connect(envelope)
      envelope.connect(output)
      voices.add(oscillator)
      if (duration >= air.beat) vibrato(oscillator, at, duration)
      oscillator.onended = () => {
        voices.delete(oscillator)
        oscillator.disconnect()
        envelope.disconnect()
      }
      oscillator.start(at)
      oscillator.stop(at + duration + 0.15)
    }
  }

  // A light waver, about five cents, on the notes held long enough to have one.
  function vibrato(target: OscillatorNode, at: number, duration: number): void {
    const lfo = context.createOscillator()
    const depth = context.createGain()
    lfo.frequency.value = 5
    depth.gain.value = target.frequency.value * 0.003
    lfo.connect(depth)
    depth.connect(target.frequency)
    voices.add(lfo)
    lfo.onended = () => {
      voices.delete(lfo)
      lfo.disconnect()
      depth.disconnect()
    }
    lfo.start(at + 0.2)
    lfo.stop(at + duration + 0.15)
  }

  function schedule(): void {
    while (bar + air.notes[index][1] * air.beat < context.currentTime + 0.35) {
      const [pitch, beat, held] = air.notes[index]
      const at = bar + beat * air.beat
      if (at >= context.currentTime - 0.02)
        note(Math.max(at, context.currentTime), pitch, held * air.beat)
      index++
      if (index === air.notes.length) {
        index = 0
        bar += phrase
      }
    }
  }
  schedule()
  const timer = setInterval(schedule, 120)
  return () => {
    if (stopped) return
    stopped = true
    clearInterval(timer)
    output.gain.setTargetAtTime(0, context.currentTime, 0.025)
    for (const oscillator of voices) oscillator.stop(context.currentTime + 0.1)
    setTimeout(() => output.disconnect(), 180)
  }
}
