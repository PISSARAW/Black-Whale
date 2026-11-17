import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-voconte-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['voconte-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*43*t)+0.3*sin(2*PI*71*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [0.05, 7.0].entries())
  add(
    `hinge${i}`,
    `aevalsrc=0.04*(sin(2*PI*(210*t+180*t*t))+0.3*sin(2*PI*977*t))*sin(PI*t/0.6)^2:s=48000:d=0.6,${delay(at)}`,
  )
for (const [i, at] of [1.5, 2.6, 4.1].entries()) {
  add(
    `passage${i}`,
    `anoisesrc=c=pink:a=0.15:d=0.3:r=48000:seed=${101 + i},highpass=f=350,lowpass=f=3500,afade=t=in:d=0.06,afade=t=out:st=0.08:d=0.22,${delay(at)}`,
  )
  add(`warp${i}`, `aevalsrc=0.08*sin(2*PI*(440*t-450*t*t))*exp(-12*t):s=48000:d=0.4,${delay(at)}`)
}
for (const [i, at] of [0.85, 1.1, 2.05, 2.35, 3.55, 3.8].entries())
  add(
    `step${i}`,
    `anoisesrc=c=brown:a=0.045:d=0.1:r=48000:seed=${21 + i},lowpass=f=1100,afade=t=out:d=0.1,${delay(at)}`,
  )
add(
  'fall',
  `anoisesrc=c=pink:a=0.12:d=2.45:r=48000:seed=93,highpass=f=550,lowpass=f=5000,afade=t=in:d=1.9,afade=t=out:st=2.27:d=0.18,${delay(3.1)}`,
)
for (const [i, at] of [2.85, 3.3, 3.7, 4.0].entries())
  add(`dread${i}`, `aevalsrc=0.07*sin(2*PI*${67 - i * 7}*t)*exp(-14*t):s=48000:d=0.25,${delay(at)}`)
add(
  'impact',
  `aevalsrc=0.3*(sin(2*PI*38*t)+0.35*sin(2*PI*81*t))*exp(-10*t):s=48000:d=0.8,${delay(5.7)}`,
)
add(
  'crack',
  `anoisesrc=c=brown:a=0.23:d=0.45:r=48000:seed=98,highpass=f=600,afade=t=out:d=0.45,${delay(5.7)}`,
)
add(
  'debris',
  `anoisesrc=c=white:a=0.05:d=0.7:r=48000:seed=79,highpass=f=2500,lowpass=f=5000,afade=t=out:d=0.7,${delay(5.8)}`,
)
add(
  'lock',
  `aevalsrc=0.09*(sin(2*PI*1213*t)+0.3*sin(2*PI*2063*t))*exp(-36*t):s=48000:d=0.2,${delay(7.8)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*0.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Voconte-Aller-Simple-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/voconte.m4a')
const picture = path.join(folder, 'Voconte-Aller-Simple-picture.mp4')
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
    path.join(folder, 'Voconte-Aller-Simple-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      passageSeconds: [1.5, 2.6, 4.1],
      impactSecond: 5.7,
      fallSecond: 3.1,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Voconte soundtrack: ${audio}\n`)
