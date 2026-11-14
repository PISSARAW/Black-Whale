import { hatsuAudioGraph } from './mixer'

const RECORDING = '/audio/melody-concert.mp3'
const RELEASE_MS = 180

/**
 * Melody's original concert recording on the shared effects bus.
 *
 * The media element streams the three-minute recording instead of decoding a
 * roughly 70 MB stereo AudioBuffer. Its source still belongs to the shared Web
 * Audio graph, so the ship's output level and sealed-hearing filter apply to it.
 */
export interface MelodyConcertEvents {
  onStarted?: () => void
  onEnded?: () => void
  onError?: () => void
}

export function startMelodyConcert(events: MelodyConcertEvents = {}): () => void {
  const graph = hatsuAudioGraph()
  if (!graph) {
    queueMicrotask(() => events.onError?.())
    return () => {}
  }

  const { context } = graph
  const recording = new Audio(RECORDING)
  recording.preload = 'auto'

  const source = context.createMediaElementSource(recording)
  const output = context.createGain()
  output.gain.value = 1
  source.connect(output)
  // The recording already carries its own room and stereo field; adding the
  // synthetic delay send here would smear the mastered flute and its ending.
  output.connect(graph.muffle)

  let stopped = false
  let released = false
  function release(): void {
    if (released) return
    released = true
    recording.pause()
    recording.currentTime = 0
    source.disconnect()
    output.disconnect()
  }

  recording.addEventListener(
    'ended',
    () => {
      if (stopped) return
      stopped = true
      events.onEnded?.()
      release()
    },
    { once: true },
  )
  void recording
    .play()
    .then(() => {
      if (!stopped) events.onStarted?.()
    })
    .catch(() => {
      events.onError?.()
      release()
    })

  return () => {
    if (stopped) return
    stopped = true
    output.gain.setTargetAtTime(0, context.currentTime, 0.025)
    setTimeout(release, RELEASE_MS)
  }
}
