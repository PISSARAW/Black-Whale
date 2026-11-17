import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-machi-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'machi-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('tension', 'aevalsrc=0.035*(sin(2*PI*42*t)+0.3*sin(2*PI*63*t))*sin(PI*t/7)^2:s=48000:d=7')
for (const [i, at] of [0.15, 1.2, 2.1, 3.2, 4.45, 6.6].entries()) {
  add(
    `string${i}`,
    `aevalsrc=0.09*(sin(2*PI*${196 - i * 9}*t)+0.2*sin(2*PI*${392 - i * 18}*t))*exp(-7*t):s=48000:d=0.65,${delay(at)}`,
  )
}
add(
  'web',
  `anoisesrc=c=pink:a=0.06:d=0.7:r=48000:seed=83,highpass=f=1200,afade=t=in:d=0.4,afade=t=out:st=0.4:d=0.3,${delay(1.2)}`,
)
for (const [i, at] of [2.2, 2.55, 2.95].entries()) {
  add(`puppet${i}`, `aevalsrc=0.08*sin(2*PI*340*t)*exp(-55*t):s=48000:d=0.15,${delay(at)}`)
}
add('tight', `aevalsrc=0.045*sin(2*PI*(180*t+210*t*t))*sin(PI*t/0.9):s=48000:d=0.9,${delay(3.8)}`)
add(
  'cut',
  `anoisesrc=c=white:a=0.18:d=0.16:r=48000:seed=19,highpass=f=2500,afade=t=out:d=0.16,${delay(4.7)}`,
)
add('shock', `aevalsrc=0.23*sin(2*PI*63*t)*exp(-12*t):s=48000:d=0.7,${delay(4.7)}`)
for (let i = 0; i < 15; i++) {
  add(
    `stitch${i}`,
    `aevalsrc=0.055*sin(2*PI*${1100 + i * 35}*t)*exp(-95*t):s=48000:d=0.07,${delay(5.1 + i * 0.07)}`,
  )
}
add(
  'suture',
  `anoisesrc=c=pink:a=0.07:d=1.2:r=48000:seed=73,highpass=f=1500,afade=t=in:d=0.15,afade=t=out:st=0.6:d=0.6,${delay(5.15)}`,
)
add(
  'unpick',
  `anoisesrc=c=white:a=0.17:d=0.13:r=48000:seed=29,highpass=f=3200,afade=t=out:d=0.13,${delay(7)}`,
)
for (let i = 0; i < 4; i++) {
  add(
    `drop${i}`,
    `aevalsrc=0.14*sin(2*PI*${85 + i * 19}*t)*exp(-23*t):s=48000:d=0.24,${delay(7.6 + i * 0.07)}`,
  )
}
add(
  'tail',
  `anoisesrc=c=pink:a=0.035:d=1:r=48000:seed=41,highpass=f=2100,afade=t=out:d=1,${delay(7.2)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Machi-Le-Dernier-Point-audio.m4a')
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
assert.equal(Number(probe.format.duration), 10)
await copyFile(audio, 'apps/web/static/clash-victories/machi.m4a')
const picture = path.join(folder, 'Machi-Le-Dernier-Point-picture.mp4')
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
    path.join(folder, 'Machi-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      captureSecond: 1.2,
      cutSecond: 4.7,
      stitchSecond: 5.1,
      rejoinSecond: 6.3,
      unpickSecond: 7,
      announcementSecond: 8.05,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Machi soundtrack: ${audio}\n`)
