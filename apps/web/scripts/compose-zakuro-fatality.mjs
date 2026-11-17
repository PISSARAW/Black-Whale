import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-zakuro-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['zakuro-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [0.9, 1.1, 1.3, 9.2].entries()) {
  add(`drop${i}`, `aevalsrc=0.13*sin(2*PI*(380*t-140*t*t))*exp(-22*t):s=48000:d=0.25,${delay(at)}`)
}
for (const [i, at] of [3.1, 4.4, 5.8, 7.15].entries()) {
  add(
    `whip${i}`,
    `anoisesrc=c=pink:a=0.17:d=0.6:r=48000:seed=${39 + i},highpass=f=350,lowpass=f=3500,afade=t=in:d=0.12,afade=t=out:st=0.2:d=0.4,${delay(at)}`,
  )
}
for (const [i, at] of [5.4, 6.6].entries()) {
  add(
    `crash${i}`,
    `anoisesrc=c=brown:a=0.9:d=0.8:r=48000:seed=${112 + i},highpass=f=60,lowpass=f=7000,afade=t=out:d=0.8,aecho=0.8:0.6:83|171:0.25|0.12,${delay(at)}`,
  )
  add(
    `body${i}`,
    `aevalsrc=0.5*(sin(2*PI*48*t)+0.3*sin(2*PI*103*t))*exp(-12*t):s=48000:d=0.7,${delay(at)}`,
  )
  add(
    `grit${i}`,
    `anoisesrc=c=white:a=0.15:d=0.8:r=48000:seed=${71 + i},highpass=f=2400,afade=t=out:d=0.8,${delay(at + 0.08)}`,
  )
}
add('recall', `aevalsrc=0.07*sin(2*PI*(180*t+390*t*t))*sin(PI*t/0.8):s=48000:d=0.8,${delay(7)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Zakuro-La-Derniere-Goutte-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/zakuro.m4a')
const picture = path.join(folder, 'Zakuro-La-Derniere-Goutte-picture.mp4')
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
    path.join(folder, 'Zakuro-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      firstImpactSecond: 5.4,
      finalImpactSecond: 6.6,
      bloodRecallSecond: 7,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Zakuro soundtrack: ${audio}\n`)
