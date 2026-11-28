import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-shizuku-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const announcer = path.join(folder, 'shizuku-announcer.aiff')
const announcerSecond = 8
if (!existsSync(announcer))
  await run('say', ['-v', 'Daniel', '-r', '118', '-o', announcer, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('manifestation', 'aevalsrc=0.04*sin(2*PI*(220*t+380*t*t))*sin(PI*t/0.52)^2:s=48000:d=0.52')
add('button-drop', `aevalsrc=0.07*sin(2*PI*1660*t)*exp(-42*t):s=48000:d=0.19,${delay(1.91)}`)
for (const [i, at, duration] of [
  [0, 2, 2.75],
  [1, 5.65, 1.85],
]) {
  add(
    `motor${i}`,
    `aevalsrc=0.065*(sin(2*PI*91*t)+0.3*sin(2*PI*127*t)):s=48000:d=${duration},afade=t=in:d=0.1,afade=t=out:st=${duration - 0.12}:d=0.12,${delay(at)}`,
  )
  add(
    `air${i}`,
    `anoisesrc=c=brown:a=0.16:d=${duration}:r=48000:seed=${41 + i},highpass=f=250,lowpass=f=1800,tremolo=f=17:d=0.3,afade=t=in:d=0.14,afade=t=out:st=${duration - 0.12}:d=0.12,${delay(at)}`,
  )
}
add(
  'stumble',
  `anoisesrc=c=brown:a=0.12:d=0.18:r=48000:seed=77,highpass=f=350,lowpass=f=2200,afade=t=out:st=0.05:d=0.13,${delay(4.08)}`,
)
add(
  'collapse',
  `aevalsrc=(0.31*sin(2*PI*(93*t-85*t*t))+0.1*sin(2*PI*171*t))*exp(-18*t):s=48000:d=0.29,${delay(291 / 60)}`,
)
add(
  'roll',
  `anoisesrc=c=brown:a=0.18:d=0.27:r=48000:seed=79,highpass=f=180,lowpass=f=2700,afade=t=out:st=0.07:d=0.2,${delay(4.91)}`,
)
add(
  'drag',
  `anoisesrc=c=pink:a=0.10:d=0.61:r=48000:seed=83,highpass=f=360,lowpass=f=1900,tremolo=f=19:d=0.5,afade=t=in:d=0.08,afade=t=out:st=0.51:d=0.1,${delay(5.72)}`,
)
add(
  'catch-nozzle',
  `aevalsrc=(0.16*sin(2*PI*(170*t-220*t*t))+0.07*sin(2*PI*510*t))*exp(-34*t):s=48000:d=0.17,${delay(380 / 60)}`,
)
add(
  'gulp',
  `aevalsrc=0.16*sin(2*PI*(146*t-132*t*t))*exp(-8*t)*min(1\\,14*t):s=48000:d=0.38,${delay(388 / 60)}`,
)
add('button-in', `aevalsrc=0.065*sin(2*PI*1100*t)*exp(-65*t):s=48000:d=0.15,${delay(7.5)}`)
add('burp', `aevalsrc=0.16*sin(2*PI*(180*t-280*t*t))*exp(-11*t):s=48000:d=0.28,${delay(7.7)}`)
add('catch', `aevalsrc=0.065*sin(2*PI*1800*t)*exp(-70*t):s=48000:d=0.13,${delay(8.05)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*0.86,aresample=48000,atempo=1.55,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:70:0.16,volume=0.75,${delay(announcerSecond)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=432000,atrim=end_sample=432000,afade=t=out:st=8.82:d=0.18,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=432000[audio]`,
].join(';')
const audio = path.join(folder, 'Shizuku-Rien-A-Signaler-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  announcer,
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
  '9',
  audio,
])
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', audio],
    { encoding: 'utf8' },
  ),
)
assert.equal(Number(probe.format.duration), 9)
await copyFile(audio, 'apps/web/static/clash-victories/shizuku.m4a')
const picture = path.join(folder, 'Shizuku-Rien-A-Signaler-picture-9s.mp4')
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
    '9',
    '-movflags',
    '+faststart',
    path.join(folder, 'Shizuku-Fatality-9s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 9,
      frameCount: 540,
      dropSecond: 82 / 60,
      bloodSecond: 2,
      stopSecond: 4.75,
      shoulderSecond: 291 / 60,
      cleanupSecond: 5.4,
      nozzleContactSecond: 380 / 60,
      lastObjectSecond: 7.5,
      returnSecond: 7.7,
      announcer: { words: 'Fatality.', second: announcerSecond },
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Shizuku soundtrack: ${audio}\n`)
