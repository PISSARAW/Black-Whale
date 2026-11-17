import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-hisoka-fear')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['hisoka-fear-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add(
  'ren',
  'aevalsrc=0.065*(sin(2*PI*43*t)+0.4*sin(2*PI*87*t)+0.15*sin(2*PI*131*t))*(0.15+0.85*t/6.5):s=48000:d=6.5,afade=t=in:d=0.8,afade=t=out:st=6.25:d=0.25',
)
add(
  'pressure',
  'anoisesrc=c=brown:a=0.07:d=6.5:r=48000:seed=43,lowpass=f=550,afade=t=in:d=1.5,afade=t=out:st=6.3:d=0.2',
)
for (const [i, at] of [
  1.1, 1.85, 2.55, 3.18, 3.75, 4.25, 4.68, 5.05, 5.38, 5.65, 5.9, 6.12, 6.32,
].entries()) {
  add(
    `heart${i}`,
    `aevalsrc=0.15*(sin(2*PI*64*t)+0.25*sin(2*PI*111*t))*exp(-32*t):s=48000:d=0.16,${delay(at)}`,
  )
  add(
    `echo${i}`,
    `aevalsrc=0.065*sin(2*PI*79*t)*exp(-37*t):s=48000:d=0.08,afade=t=out:st=0.04:d=0.04,${delay(at + 0.1)}`,
  )
}
add(
  'gyo',
  `aevalsrc=0.03*(sin(2*PI*620*t)+0.3*sin(2*PI*1240*t))*exp(-7*t):s=48000:d=0.5,${delay(2)}`,
)
add(
  'reveal',
  `anoisesrc=c=pink:a=0.035:d=0.95:r=48000:seed=37,highpass=f=1800,lowpass=f=5200,afade=t=in:d=0.22,afade=t=out:st=0.6:d=0.35,${delay(3)}`,
)
add(
  'smile',
  `aevalsrc=0.022*(sin(2*PI*740*t)+sin(2*PI*783*t))*sin(PI*t/0.9):s=48000:d=0.9,${delay(4)}`,
)
for (const [i, at] of [4, 4.4, 4.77, 5.12, 5.43, 5.72, 5.99, 6.24].entries()) {
  const length = i < 4 ? 0.34 : 0.23
  add(
    `gasp${i}`,
    `anoisesrc=c=pink:a=${0.035 + i * 0.006}:d=${length}:r=48000:seed=${61 + i},highpass=f=700,lowpass=f=3000,afade=t=in:d=0.04,afade=t=out:st=${length - 0.08}:d=0.08,${delay(at)}`,
  )
}
for (const [i, at] of [4.18, 4.93].entries())
  add(
    `retreat${i}`,
    `anoisesrc=c=brown:a=0.055:d=0.17:r=48000:seed=${81 + i},highpass=f=140,lowpass=f=1700,afade=t=out:d=0.17,${delay(at)}`,
  )
add(
  'terror',
  `aevalsrc=0.028*(sin(2*PI*820*t)+sin(2*PI*861*t))*sin(PI*t/1.05):s=48000:d=1.05,${delay(5.4)}`,
)
add('dread', `aevalsrc=0.11*sin(2*PI*54*t)*exp(-12*t):s=48000:d=0.4,${delay(5.4)}`)
add('fall', `aevalsrc=0.16*sin(2*PI*68*t)*exp(-21*t):s=48000:d=0.32,${delay(7.08)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.05:d=0.3:r=48000:seed=92,highpass=f=450,afade=t=out:d=0.3,${delay(7.08)}`,
)
add('after', `aevalsrc=0.015*sin(2*PI*46*t)*sin(PI*t/2.65):s=48000:d=2.65,${delay(7.35)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.25)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Hisoka-Regarde-Moi-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/hisoka.m4a')
const picture = path.join(folder, 'Hisoka-Regarde-Moi-picture.mp4')
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
    path.join(folder, 'Hisoka-Regarde-Moi-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      renSecond: 0,
      gyoSecond: 2,
      revealSecond: 3,
      expressionSecond: 4,
      deathSecond: 6.5,
      silence: [6.5, 7.08],
      announcementSecond: 8.25,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Hisoka fear soundtrack: ${audio}\n`)
