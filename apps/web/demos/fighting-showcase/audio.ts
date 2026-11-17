import type { FightState } from '../../src/lib/fighting/types'
import { compactOfflineAutomation } from './offlineAutomation'

/** Schedule the actual game sound director against a virtual offline audio clock. */
export async function renderShowcaseAudio(states: FightState[]) {
  const duration = states.length / 60
  const restoreAutomation = compactOfflineAutomation()
  const offline = new OfflineAudioContext(2, Math.ceil((duration + 1) * 48000), 48000)
  let time = 0
  const proxy = new Proxy(offline, {
    get(target, property) {
      if (property === 'currentTime') return time
      if (property === 'state') return 'running'
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  const original = window.AudioContext
  window.AudioContext = function () {
    return proxy
  } as unknown as typeof AudioContext
  // These modules use the shared AudioContext for all synthesis and output buses.
  const { createFightAudioDirector, DEFAULT_FIGHT_AUDIO } =
    await import('../../src/lib/fighting/audio/director')
  const director = createFightAudioDirector(states[0])!
  for (let index = 0; index < states.length; index++) {
    time = index / 60
    // Keep a single connected graph during offline scheduling; a chapter cut is an edit.
    director.update(
      { ...states[index], frame: index },
      { paused: false, settings: { ...DEFAULT_FIGHT_AUDIO, ambience: 0.45, tension: 0.5 } },
    )
  }
  // A native offline context renders the existing synthesis, stereo and room response.
  const result = await offline.startRendering()
  restoreAutomation()
  window.AudioContext = original
  director.dispose()
  const frames = Math.round(duration * 48000)
  const wav = new ArrayBuffer(44 + frames * 4)
  const view = new DataView(wav)
  const text = (offset: number, value: string) =>
    [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, wav.byteLength - 8, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 2, true)
  view.setUint32(24, 48000, true)
  view.setUint32(28, 192000, true)
  view.setUint16(32, 4, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, frames * 4, true)
  const channels = [result.getChannelData(0), result.getChannelData(1)]
  for (let index = 0; index < frames; index++)
    for (let channel = 0; channel < 2; channel++)
      view.setInt16(
        44 + index * 4 + channel * 2,
        Math.round(Math.max(-1, Math.min(1, channels[channel][index])) * 32767),
        true,
      )
  const bytes = new Uint8Array(wav)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 32768)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
  return btoa(binary)
}
