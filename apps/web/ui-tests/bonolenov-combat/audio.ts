import { createBonolenovVoices } from '$lib/fighting/audio/bonolenov'
import type { FightMix } from '$lib/fighting/audio/mixer'
import type { FightState } from '$lib/fighting/types'
import type { Shot } from './main'

/** The production synth rendered offline, with the same states as the film. */
export async function renderBodyMusic(
  sample: (shot: Shot) => FightState,
  shots: Shot[],
  fps: number,
) {
  const context = new OfflineAudioContext(2, Math.ceil((shots.length / fps) * 44100), 44100)
  const effects = context.createGain()
  effects.connect(context.destination)
  const music = createBonolenovVoices({ context, effects } as unknown as FightMix)
  const states = shots.map(sample)
  music.update(states[0], true)
  const updates = states.slice(1).map((state, index) =>
    context.suspend((index + 1) / fps).then(async () => {
      music.update(state, true)
      await context.resume()
    }),
  )
  const buffer = await context.startRendering()
  await Promise.all(updates)
  music.stop()
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)]
  const peak = channels.reduce(
    (max, channel) => channel.reduce((m, n) => Math.max(m, Math.abs(n)), max),
    0,
  )
  function rms(from: number, to: number) {
    const values = channels[0].subarray(
      Math.floor((from / fps) * 44100),
      Math.floor((to / fps) * 44100),
    )
    return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length)
  }
  return {
    wav: wavBase64(buffer),
    peak,
    danceRms: rms(5, 55),
    restRms: rms(68, 76),
    strikeRms: rms(79, 110),
    pivotRms: rms(116, 129),
  }
}

function wavBase64(buffer: AudioBuffer) {
  const bytes = new Uint8Array(44 + buffer.length * 4)
  const view = new DataView(bytes.buffer)
  const tag = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  tag(0, 'RIFF')
  view.setUint32(4, bytes.length - 8, true)
  tag(8, 'WAVE')
  tag(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 2, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 4, true)
  view.setUint16(32, 4, true)
  view.setUint16(34, 16, true)
  tag(36, 'data')
  view.setUint32(40, bytes.length - 44, true)
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel)
    for (let frame = 0; frame < samples.length; frame++)
      view.setInt16(
        44 + frame * 4 + channel * 2,
        Math.max(-1, Math.min(1, samples[frame])) * 32767,
        true,
      )
  }
  let encoded = ''
  for (let i = 0; i < bytes.length; i += 32768)
    encoded += String.fromCharCode(...bytes.subarray(i, i + 32768))
  return btoa(encoded)
}
