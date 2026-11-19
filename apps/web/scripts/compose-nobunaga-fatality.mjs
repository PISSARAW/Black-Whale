import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-nobunaga-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const delay = (at) => `adelay=${Math.round(at * 1000)}:all=1`
const layers = []
const add = (label, chain) => layers.push({ label, chain })
// Entirely instrumental: no speech, TTS, sampled dialogue or announcer.
add(
  'room',
  'anoisesrc=c=brown:a=0.025:d=10:r=48000:seed=43,highpass=f=140,lowpass=f=1100,afade=t=in:d=0.4,afade=t=out:st=9:d=1',
)
add(
  'en',
  `aevalsrc=0.035*(sin(2*PI*54*t)+0.2*sin(2*PI*81*t))*sin(PI*t/4)^2:s=48000:d=4,${delay(1)}`,
)
for (const [i, at] of [0.4, 2.2, 3.65].entries())
  add(`beat${i}`, `aevalsrc=0.11*sin(2*PI*(64*t-18*t*t))*exp(-7*t):s=48000:d=0.6,${delay(at)}`)
for (const [i, at] of [2.6, 3.1, 3.6, 4.1, 4.55, 4.85, 5].entries())
  add(
    `step${i}`,
    `anoisesrc=c=brown:a=0.12:d=0.14:r=48000:seed=${27 + i},highpass=f=110,lowpass=f=1800,afade=t=out:d=0.14,${delay(at)}`,
  )
add(
  'draw',
  `anoisesrc=c=pink:a=0.17:d=0.2:r=48000:seed=92,highpass=f=2500,lowpass=f=7500,afade=t=out:d=0.2,${delay(5)}`,
)
add(
  'blade',
  `aevalsrc=0.23*(sin(2*PI*2100*t)+0.3*sin(2*PI*3150*t))*exp(-14*t):s=48000:d=0.55,aecho=0.8:0.45:80:0.2,${delay(5.13)}`,
)
add('impact', `aevalsrc=0.32*sin(2*PI*(105*t-55*t*t))*exp(-15*t):s=48000:d=0.35,${delay(5.133)}`)
add(
  'cut',
  `anoisesrc=c=pink:a=0.15:d=0.14:r=48000:seed=11,highpass=f=500,afade=t=out:d=0.14,${delay(5.133)}`,
)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.1:d=0.7:r=48000:seed=39,highpass=f=700,afade=t=in:d=0.1,afade=t=out:st=0.3:d=0.4,${delay(6.5)}`,
)
add(
  'fall',
  `aevalsrc=0.22*(sin(2*PI*80*t)+0.3*sin(2*PI*180*t))*exp(-10*t):s=48000:d=0.55,${delay(7.4)}`,
)
add(
  'return',
  `anoisesrc=c=pink:a=0.07:d=0.9:r=48000:seed=57,highpass=f=2100,lowpass=f=5500,afade=t=in:d=0.2,afade=t=out:st=0.65:d=0.25,${delay(7.6)}`,
)
add(
  'click',
  `aevalsrc=0.25*(sin(2*PI*1500*t)+0.25*sin(2*PI*3100*t))*exp(-70*t):s=48000:d=0.14,${delay(8.5)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.5:d=0.5,loudnorm=I=-18:TP=-1.5:LRA=12,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Nobunaga-Le-Dernier-Pas-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
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
assert.equal(Number(probe.format.duration), 10)
await copyFile(audio, 'apps/web/static/clash-victories/nobunaga.m4a')
const picture = path.join(folder, 'Nobunaga-Le-Dernier-Pas-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only'))
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
    path.join(folder, 'Nobunaga-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      voices: [],
      enEntrySecond: 5,
      drawSecond: 5,
      contactSecond: 308 / 60,
      sheathSecond: 8.5,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved instrumental Nobunaga soundtrack: ${audio}\n`)
