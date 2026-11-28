import assert from 'node:assert/strict'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-bonolenov-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const timing = JSON.parse(
  await readFile(
    new URL('../src/lib/fighting/victory/bonolenovTiming.json', import.meta.url),
    'utf8',
  ),
)
const layers = []
const at = (frame) => `adelay=${Math.round((frame * 1000) / 60)}:all=1`
const stereo = (pan) => `pan=stereo|c0=${1 - pan}*c0|c1=${1 + pan}*c0`
const add = (label, chain) => layers.push({ label, chain })
add(
  'step',
  `aevalsrc=0.23*sin(2*PI*88*t)*exp(-26*t):s=48000:d=0.24,${stereo(-0.32)},${at(timing.phrases[0].frame)}`,
)
for (const [i, { frame, pan, pitch }] of timing.phrases.entries()) {
  const breath = i === timing.phrases.length - 1 ? 0.64 : i === 4 ? 0.38 : 0.46
  add(
    `air${i}`,
    `anoisesrc=c=pink:a=0.29:d=${breath}:r=48000:seed=${11 + i},highpass=f=${pitch * 2},lowpass=f=${pitch * 8},afade=t=in:d=0.065,afade=t=out:st=0.10:d=${breath - 0.1},${stereo(pan)},${at(frame)}`,
  )
  add(
    `tone${i}`,
    `aevalsrc=0.105*(sin(2*PI*${pitch}*t)+0.28*sin(2*PI*${pitch * 2.01}*t)+0.14*sin(2*PI*${pitch * 3.02}*t))*sin(PI*t/${breath})^2:s=48000:d=${breath},${stereo(pan)},${at(frame)}`,
  )
}
add(
  'formation',
  `aevalsrc=0.18*(sin(2*PI*47*t)+0.31*sin(2*PI*73*t))*sin(PI*t/2.96)^2:s=48000:d=2.96,${stereo(-0.28)},${at(timing.form)}`,
)
add(
  'pursuit',
  `anoisesrc=c=brown:a=0.21:d=1.96:r=48000:seed=26,highpass=f=65,lowpass=f=940,afade=t=in:d=1.25,afade=t=out:st=1.72:d=0.24,${stereo(0.12)},${at(timing.chase + 5)}`,
)
for (const [i, frame] of [279, 301, 323, 345, 365, timing.lastStep].entries())
  add(
    `foot${i}`,
    `aevalsrc=0.14*sin(2*PI*126*t)*exp(-38*t):s=48000:d=0.17,${stereo(0.38)},${at(frame)}`,
  )
add(
  'contactEdge',
  `anoisesrc=c=pink:a=0.42:d=0.16:r=48000:seed=29,highpass=f=145,lowpass=f=1750,afade=t=out:d=0.15,${stereo(0.16)},${at(timing.impact)}`,
)
add(
  'contact',
  `aevalsrc=0.55*(sin(2*PI*(69*t-24*t*t))+0.17*sin(2*PI*138*t))*exp(-10*t):s=48000:d=0.71,${stereo(0.34)},${at(timing.impact)}`,
)
add(
  'slabs',
  `anoisesrc=c=brown:a=0.37:d=0.68:r=48000:seed=50,highpass=f=135,lowpass=f=1150,afade=t=out:d=0.68,${stereo(0.39)},${at(timing.sink)}`,
)
add(
  'dust',
  `anoisesrc=c=pink:a=0.14:d=1.16:r=48000:seed=71,highpass=f=450,lowpass=f=2050,afade=t=in:d=0.18,afade=t=out:st=0.18:d=0.98,${stereo(0.28)},${at(timing.dust)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Bonolenov-Le-Dernier-Mouvement-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/bonolenov.m4a')
const picture = path.join(folder, 'Bonolenov-Le-Dernier-Mouvement-picture.mp4')
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
    path.join(folder, 'Bonolenov-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      formationSecond: timing.form / 60,
      impactSecond: timing.impact / 60,
      dissolveSecond: timing.dissolve / 60,
      bodyNotes: timing.phrases.map(({ frame, source, pan }) => ({
        second: frame / 60,
        source,
        pan,
      })),
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Bonolenov soundtrack: ${audio}\n`)
