import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-hinrigh-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['hinrigh-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [0.5, 0.9, 1.3, 7.9].entries()) {
  add(
    `record${i}`,
    `aevalsrc=0.045*sin(2*PI*${i === 3 ? 1200 : 900}*t)*exp(-30*t):s=48000:d=0.12,${delay(at)}`,
  )
}
for (const [i, at] of [1.25, 1.55, 1.85, 2.15, 2.45, 2.75, 3.15, 3.45].entries()) {
  add(
    `wing${i}`,
    `anoisesrc=c=pink:a=0.07:d=0.14:r=48000:seed=${30 + i},highpass=f=900,lowpass=f=5000,afade=t=in:d=0.02,afade=t=out:st=0.04:d=0.1,${delay(at)}`,
  )
}
for (const [i, at] of [2.9, 3.7].entries()) {
  add(
    `lock${i}`,
    `aevalsrc=0.12*(sin(2*PI*1433*t)+0.6*sin(2*PI*2147*t))*exp(-35*t):s=48000:d=0.3,${delay(at)}`,
  )
  add(
    `latch${i}`,
    `anoisesrc=c=white:a=0.1:d=0.06:r=48000:seed=${45 + i},highpass=f=2300,afade=t=out:d=0.06,${delay(at)}`,
  )
}
add(
  'slither',
  `anoisesrc=c=brown:a=0.075:d=3.8:r=48000:seed=73,highpass=f=600,lowpass=f=2500,afade=t=in:d=0.8,afade=t=out:st=3.2:d=0.6,${delay(1.8)}`,
)
add(
  'tension',
  `aevalsrc=0.032*(sin(2*PI*(160*t+28*t*t))+0.2*sin(2*PI*490*t))*sin(PI*t/1.4):s=48000:d=1.4,${delay(4.3)}`,
)
add(
  'shot',
  `anoisesrc=c=white:a=0.7:d=0.16:r=48000:seed=112,highpass=f=180,lowpass=f=10500,afade=t=out:d=0.12,aecho=0.8:0.6:83|171:0.25|0.12,${delay(6)}`,
)
add(
  'impact',
  `aevalsrc=0.35*(sin(2*PI*62*t)+0.3*sin(2*PI*113*t))*exp(-23*t):s=48000:d=0.4,${delay(6)}`,
)
add(
  'case',
  `aevalsrc=0.065*(sin(2*PI*2140*t)+0.6*sin(2*PI*3521*t))*exp(-30*t):s=48000:d=0.35,${delay(6.3)}`,
)
add('fall', `aevalsrc=0.18*sin(2*PI*78*t)*exp(-18*t):s=48000:d=0.4,${delay(6.93)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.09:d=0.45:r=48000:seed=82,highpass=f=350,afade=t=out:d=0.45,${delay(6.93)}`,
)
add(
  'cat',
  `aevalsrc=0.025*(sin(2*PI*(340*t-110*t*t))+0.2*sin(2*PI*670*t))*sin(PI*t/0.6):s=48000:d=0.6,${delay(7.8)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Hinrigh-Piece-a-Conviction-audio.m4a')
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  ...speeches.flatMap(([name]) => ['-i', path.join(folder, `${name}.aiff`)]),
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
await copyFile(audio, 'apps/web/static/clash-victories/hinrigh.m4a')
const picture = path.join(folder, 'Hinrigh-Piece-a-Conviction-picture.mp4')
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
    path.join(folder, 'Hinrigh-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      cameraSecond: 0.5,
      wristLockSecond: 2.9,
      ankleLockSecond: 3.7,
      shotSecond: 6,
      fallSecond: 6.93,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Hinrigh soundtrack: ${audio}\n`)
