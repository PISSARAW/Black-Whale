import type { FightStageId } from '../stages'

const MUSIC_ROOT = '/audio/clash'
export const CLASH_MENU_MUSIC = `${MUSIC_ROOT}/menu.mp3`

const SCORED_STAGES = new Set<FightStageId>([
  'whale-hold',
  'heavens-arena',
  'vip-casino',
  'banquet-hall',
  'princes-burial-chamber',
])

export function stageMusicUrl(stage: FightStageId): string | undefined {
  return SCORED_STAGES.has(stage) ? `${MUSIC_ROOT}/${stage}.mp3` : undefined
}

const EDGE_FADE = 0.015
// The MP3s carry a quarter-second of wrapped audio at each edge for the codec.
const LOOP_PADDING = 0.25

/** Loop decoded samples and retain the playhead while the listener is paused. */
export function createClashMusic(context: AudioContext, url: string) {
  const request = new AbortController()
  let loading = false
  let buffer: AudioBuffer | undefined
  let target: AudioNode | null = null
  let playing: { source: AudioBufferSourceNode; gain: GainNode; start: number } | undefined
  let offset = 0

  function start(): void {
    if (!buffer || !target || playing) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    const now = context.currentTime
    source.buffer = buffer
    source.loop = true
    source.loopStart = LOOP_PADDING
    source.loopEnd = buffer.duration - LOOP_PADDING
    source.connect(gain).connect(target)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + EDGE_FADE)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
    source.start(now, LOOP_PADDING + offset)
    playing = { source, gain, start: now }
  }

  function stop(): void {
    if (!playing || !buffer) return
    const { source, gain, start } = playing
    const now = context.currentTime
    offset = (offset + now - start) % (buffer.duration - 2 * LOOP_PADDING)
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(Math.min(1, (now - start) / EDGE_FADE), now)
    gain.gain.linearRampToValueAtTime(0, now + EDGE_FADE)
    source.stop(now + EDGE_FADE)
    playing = undefined
  }

  async function load(): Promise<void> {
    loading = true
    try {
      const response = await fetch(url, { signal: request.signal })
      if (!response.ok) return
      const decoded = await context.decodeAudioData(await response.arrayBuffer())
      if (request.signal.aborted || decoded.duration <= 2 * LOOP_PADDING) return
      buffer = decoded
      start()
    } catch {
      // Music is optional. The stage director keeps its synthesized fallback.
    }
  }

  return {
    get playing() {
      return Boolean(playing)
    },
    setTarget(next: AudioNode | null) {
      if (next === target || request.signal.aborted) return
      stop()
      target = next
      if (!target) return
      if (buffer) start()
      else if (!loading) void load()
    },
    dispose() {
      request.abort()
      stop()
      target = null
      buffer = undefined
    },
  }
}
