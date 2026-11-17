import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-tserriednich-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0, `${command} failed`)
}
const voice = path.join(folder, 'tserriednich-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
const tone = (hz, level, duration) =>
  `aevalsrc=${level}*sin(2*PI*${hz}*t)*exp(-9*t):s=48000:d=${duration}`
const ticks = [0.85, 1.6, 1.77, 1.94, 2.11, 2.28, 2.45, 2.62, 2.79, 2.96, 3.13, 3.3].map(
  (time, i) => `${tone(1200 + i * 57, 0.055, 0.09)},${delay(time)}[tick${i}]`,
)
const shots = [364 / 60, 438 / 60].map(
  (time, i) =>
    `aevalsrc=0.23*(sin(2*PI*(110*t-30*t*t))+.35*sin(2*PI*2200*t))*exp(-35*t):s=48000:d=0.22,${delay(time)}[shot${i}]`,
)
const filter = [
  ...ticks,
  ...shots,
  'aevalsrc=0.035*(sin(2*PI*37*t)+.5*sin(2*PI*55.5*t))*sin(PI*t/3.34)^2:s=48000:d=3.34[zetsu]',
  `anoisesrc=c=pink:a=0.045:d=1.74:r=48000:seed=45,lowpass=f=1800,afade=t=in:d=0.5,areverse,${delay(1.6)}[vision]`,
  `aevalsrc=0.12*sin(2*PI*(250*t+220*t*t))*exp(-12*t):s=48000:d=0.4,${delay(286 / 60)}[eyes]`,
  `anoisesrc=c=white:a=0.06:d=0.2:r=48000:seed=15,highpass=f=2000,afade=t=out:d=0.2,${delay(382 / 60)}[glass]`,
  `anoisesrc=c=brown:a=0.09:d=0.45:r=48000:seed=21,lowpass=f=450,afade=t=out:d=0.45,${delay(154 / 60)}[false-impact]`,
  `aevalsrc=0.10*sin(2*PI*65*t)*exp(-8*t):s=48000:d=0.4,${delay(392 / 60)}[step]`,
  `anoisesrc=c=pink:a=0.055:d=0.6:r=48000:seed=22,lowpass=f=1100,afade=t=out:d=0.6,${delay(465 / 60)}[fall]`,
  `aevalsrc=0.035*(sin(2*PI*37*t)+.5*sin(2*PI*74*t))*sin(PI*t/3)^2:s=48000:d=3,${delay(8)}[verdict]`,
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}[announcer]`,
  `${ticks.map((_, i) => `[tick${i}]`).join('')}${shots.map((_, i) => `[shot${i}]`).join('')}[zetsu][vision][eyes][glass][false-impact][step][fall][verdict][announcer]amix=inputs=23:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Tserriednich-Tu-Arrives-Trop-Tard-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  voice,
  '-filter_complex',
  filter,
  '-map',
  '[audio]',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-ac',
  '2',
  '-t',
  '10',
  audio,
])
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', audio],
    { encoding: 'utf8' },
  ),
)
assert.equal(
  Number(probe.format.duration),
  10,
  'Tserriednich soundtrack must last ten full seconds',
)
await copyFile(audio, 'apps/web/static/clash-victories/tserriednich.m4a')
const picture = path.join(folder, 'Tserriednich-Tu-Arrives-Trop-Tard-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only')) {
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
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
    '10',
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Tserriednich / Tu arrives trop tard',
    path.join(folder, 'Tserriednich-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      visionSecond: 1.1,
      forecastSeconds: 10,
      openEyesSecond: 286 / 60,
      napeContactSecond: 154 / 60,
      shotSeconds: [364 / 60, 438 / 60],
      announcementSecond: 8.05,
      soundDesign:
        'Closed-eye silence, ten compressed clock ticks, reverse future breath, nape contact, wrist interception, missed shot and physical counter shot, fall and local Daniel Fatality announcer.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Tserriednich soundtrack${existsSync(picture) ? ' and ten-second film' : ''}: ${folder}\n`)
