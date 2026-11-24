import { writeFile } from 'node:fs/promises'

const SAMPLE_RATE = 44100
const TAU = Math.PI * 2

/** Original 150 BPM backing track with an accent on each recorded contact. */
export async function writePursuitAudio(path, duration, impacts) {
  const mix = new Float32Array(Math.ceil(duration * SAMPLE_RATE))
  const beat = (SAMPLE_RATE * 60) / 150
  for (let index = 0, start = 0; start < mix.length; start += beat, index++) {
    const note = [55, 55, 65.4, 49][Math.floor(index / 4) % 4]
    mixAt(mix, { start, seconds: 0.32 }, (t) => backing(t, { index, note }))
    mixAt(mix, { start: start + beat / 2, seconds: 0.044 }, hat)
  }
  for (const { frame, heavy } of impacts)
    mixAt(mix, { start: Math.round((frame * SAMPLE_RATE) / 30), seconds: 0.22 }, (t, n) =>
      accent(t, n, heavy),
    )
  await writeFile(path, wav(mix))
}

function mixAt(mix, { start, seconds }, sample) {
  const end = Math.min(mix.length, start + Math.ceil(seconds * SAMPLE_RATE))
  for (let i = start; i < end; i++) mix[i] += sample((i - start) / SAMPLE_RATE, i)
}

function backing(t, { index, note }) {
  const kick = Math.sin(TAU * (47 * t + 3.9 * (1 - Math.exp(-t * 37)))) * Math.exp(-17 * t) * 0.2
  const bass =
    (Math.sin(TAU * note * t) + 0.2 * Math.sin(TAU * note * 2 * t)) *
    Math.exp(-9 * t) *
    Math.min(1, t * 210) *
    0.13
  const snare =
    index % 2 ? Math.sin(TAU * 157 * t) * Math.cos(8510 * t * t) * Math.exp(-29 * t) * 0.085 : 0
  return kick + bass + snare
}

function hat(t) {
  return Math.sin(39000 * t) * Math.cos(33730 * t) * Math.exp(-83 * t) * 0.035
}

function accent(t, sample, heavy) {
  const noise = (Math.imul(sample + 17, 2654435761) >>> 0) / 2147483648 - 1
  return (
    (noise * Math.exp(-34 * t) * 0.11 + Math.sin(420 * t) * Math.exp(-23 * t) * 0.18) *
    (heavy ? 1.45 : 0.83)
  )
}

function wav(mix) {
  const out = Buffer.alloc(44 + mix.length * 2)
  out.write('RIFF', 0)
  out.writeUInt32LE(out.length - 8, 4)
  out.write('WAVEfmt ', 8)
  out.writeUInt32LE(16, 16)
  out.writeUInt16LE(1, 20)
  out.writeUInt16LE(1, 22)
  out.writeUInt32LE(SAMPLE_RATE, 24)
  out.writeUInt32LE(2 * SAMPLE_RATE, 28)
  out.writeUInt16LE(2, 32)
  out.writeUInt16LE(16, 34)
  out.write('data', 36)
  out.writeUInt32LE(out.length - 44, 40)
  for (let i = 0; i < mix.length; i++) {
    const fade = Math.min(1, (mix.length - i) / (SAMPLE_RATE * 0.18))
    out.writeInt16LE(Math.round(32767 * Math.tanh(mix[i]) * fade), 44 + i * 2)
  }
  return out
}
