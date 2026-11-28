import assert from 'node:assert/strict'
import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-tserriednich-fatality')
await mkdir(folder, { recursive: true })
const run = async (args) => {
  const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(job, 'exit'))[0], 0, 'ffmpeg failed')
}
const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
const tone = (frequency, power, duration) =>
  `aevalsrc=${power}*sin(2*PI*${frequency}*t)*sin(PI*t/${duration})^2:s=48000:d=${duration}`
const duration = 11
const thump = (frequency, power, { decay, span }) =>
  `aevalsrc=${power}*sin(2*PI*(${frequency}*t-30*t*t))*exp(-${decay}*t):s=48000:d=${span}`
const grit = (amplitude, span, { seed, band }) =>
  `anoisesrc=c=brown:a=${amplitude}:d=${span}:r=48000:seed=${seed},${band},afade=t=out:st=0:d=${span}`
const common = [
  `${tone(53, 0.063, 0.52)}[ten-in]`,
  `${thump(72, 0.085, { decay: 18, span: 0.16 })},${delay(0.3)}[approach]`,
  `anoisesrc=c=pink:a=0.041:d=1.15:r=48000:seed=45,lowpass=f=1150,afade=t=in:d=0.38,afade=t=out:st=0.88:d=0.27,${delay(0.55)}[vision]`,
  `${thump(96, 0.13, { decay: 28, span: 0.24 })},${delay(1.69)}[forecast-contact]`,
  `${grit(0.12, 0.14, { seed: 26, band: 'bandpass=f=730:width_type=h:width=950' })},${delay(1.69)}[forecast-cloth]`,
  `${thump(68, 0.075, { decay: 23, span: 0.2 })},${delay(2.12)}[forecast-floor]`,
  `${tone(105, 0.032, 0.46)},${delay(2.2)}[diverge]`,
  `${grit(0.09, 0.19, { seed: 41, band: 'bandpass=f=900:width_type=h:width=1100' })},${delay(3.35)}[side-step]`,
  `${thump(96, 0.11, { decay: 28, span: 0.24 })},${delay(3.78)}[perceived-contact]`,
  `${thump(68, 0.075, { decay: 23, span: 0.2 })},${delay(4.2)}[perceived-floor]`,
  `${tone(58, 0.035, 0.68)},${delay(6.8)}[ten-out]`,
  `anoisesrc=c=pink:a=0.045:d=0.37:r=48000:seed=88,bandpass=f=980:width_type=h:width=900,afade=t=in:d=0.08,afade=t=out:st=0.11:d=0.26,${delay(7.23)}[recognition]`,
  `${tone(107, 0.023, 1.45)},${delay(9.53)}[verdict]`,
]

async function createTrack(shot) {
  const cues = [...common]
  if (shot) {
    cues.push(
      `aevalsrc=(0.36*sin(2*PI*(127*t-42*t*t))+.16*sin(2*PI*2170*t))*exp(-39*t):s=48000:d=0.21,${delay(8.25)}[shot]`,
      `${grit(0.33, 0.18, { seed: 73, band: 'bandpass=f=1550:width_type=h:width=2200' })},${delay(8.25)}[shot-crack]`,
      `${thump(76, 0.21, { decay: 16, span: 0.41 })},${delay(9.18)}[floor]`,
      `${grit(0.15, 0.22, { seed: 21, band: 'lowpass=f=780' })},${delay(9.18)}[fall-cloth]`,
    )
  }
  const sources = cues.map((cue) => cue.match(/\[[a-z-]+\]$/)[0]).join('')
  const filter = [
    ...cues,
    `${sources}amix=inputs=${cues.length}:normalize=0,apad=whole_dur=${duration},atrim=duration=${duration},afade=t=out:st=10.5:d=0.5[audio]`,
  ].join(';')
  const name = shot ? 'tserriednich-shot.m4a' : 'tserriednich.m4a'
  const audio = path.join(folder, name)
  await run([
    '-filter_complex',
    filter,
    '-map',
    '[audio]',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-ac',
    '2',
    audio,
  ])
  const actual = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', audio],
    { encoding: 'utf8' },
  )
  assert.equal(Number(actual), duration)
  await copyFile(audio, path.join('apps/web/static/clash-victories', name))
  return audio
}

await createTrack(false)
const audio = await createTrack(true)
const picture = path.join(folder, 'Tserriednich-Deux-Verites-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only')) {
  await run([
    '-i',
    picture,
    '-i',
    audio,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c',
    'copy',
    '-t',
    String(duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Tserriednich / Deux vérités',
    path.join(folder, 'Tserriednich-Deux-Verites-Cinematique.mp4'),
  ])
}
process.stdout.write(`Deux vérités · ${duration} s · ${folder}\n`)
