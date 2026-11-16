export function tone(
  ctx: AudioContext,
  frequency: number,
  {
    at,
    duration,
    type = 'sine',
    volume = 0.07,
    endFrequency,
  }: {
    at: number
    duration: number
    type?: OscillatorType
    volume?: number
    endFrequency?: number
  },
) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, at)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + Math.min(0.035, duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(at)
  oscillator.stop(at + duration + 0.02)
}
