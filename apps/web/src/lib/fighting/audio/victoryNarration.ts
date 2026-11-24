import { FIGHT_FPS } from '../fightClock'
import type { VictoryFrame } from '../victory/playback'
import type { VoiceLocale } from './speechSamples'
import atlas from './descriptionAtlas.json'
import scenes from './victoryDescriptions.json'

const shots: Record<string, ReadonlyArray<readonly (number | string)[]>> = scenes
const spans: Record<VoiceLocale, Record<string, readonly number[]>> = atlas.locales

export function victoryNarrationCue(frame: VictoryFrame, locale: VoiceLocale) {
  const scene = frame.variant ?? frame.fighter
  return shots[scene]
    ?.flatMap(([frameNumber], index) => {
      const label = `description-${scene}-${index}`
      const [offset, samples] = spans[locale][label] ?? []
      if (!samples || typeof frameNumber !== 'number') return []
      const start = frameNumber / FIGHT_FPS
      const length = samples / atlas.sampleRate
      return [{ label, start, offset: offset / atlas.sampleRate, length }]
    })
    .find(({ start, length }) => frame.elapsed >= start && frame.elapsed < start + length)
}

export function createVictoryNarration(context: AudioContext, output: AudioNode) {
  const gain = context.createGain()
  gain.gain.value = 0
  gain.connect(output)
  let current:
    { source: AudioBufferSourceNode; key: string; audioTime: number; filmTime: number } | undefined

  function stop() {
    current?.source.stop()
    current = undefined
  }

  return {
    update(
      frame: VictoryFrame,
      options: { locale: VoiceLocale; volume: number; buffer?: AudioBuffer },
    ) {
      const { locale, volume, buffer } = options
      const cue = victoryNarrationCue(frame, locale)
      if (!cue || !buffer) {
        stop()
        return false
      }
      const key = `${frame.token}:${locale}:${cue.label}`
      const now = context.currentTime
      gain.gain.setTargetAtTime(volume * 0.7, now, 0.025)
      const drift = current
        ? now - current.audioTime - (frame.elapsed - current.filmTime)
        : Infinity
      if (current?.key === key && Math.abs(drift) < 0.22) return true
      stop()
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      const elapsed = frame.elapsed - cue.start
      source.addEventListener('ended', () => source.disconnect(), { once: true })
      source.start(now, cue.offset + elapsed, cue.length - elapsed)
      current = { source, key, audioTime: now, filmTime: frame.elapsed }
      return true
    },
    stop,
    dispose() {
      stop()
      gain.disconnect()
    },
  }
}
