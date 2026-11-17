import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-bill-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['bill-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('room', 'aevalsrc=0.012*(sin(2*PI*48*t)+0.3*sin(2*PI*72*t))*sin(PI*t/8)^2:s=48000:d=8')
const report = JSON.parse(readFileSync(path.join(folder, 'cinematic-report.json'), 'utf8'))
assert.equal(report.nativeCombos.length, 3)
assert.equal(report.nativeHits.length, 12)
for (const [i, hit] of report.nativeHits.entries()) {
  const at = hit.age / 60
  const kick = ['lowLight', 'lowHeavy'].includes(hit.slot)
  add(
    `strike${i}`,
    `aevalsrc=${hit.slot === 'forwardHeavy' ? 0.42 : 0.23}*sin(2*PI*(${kick ? 66 : 92}*t-25*t*t))*exp(-23*t):s=48000:d=0.3,${delay(at)}`,
  )
  add(
    `impact${i}`,
    `anoisesrc=c=brown:a=0.16:d=0.14:r=48000:seed=${42 + i},highpass=f=280,afade=t=out:d=0.14,${delay(at)}`,
  )
  add(
    `whoosh${i}`,
    `anoisesrc=c=pink:a=0.06:d=0.13:r=48000:seed=${62 + i},highpass=f=${kick ? 650 : 1100},afade=t=in:d=0.06,afade=t=out:st=0.06:d=0.07,${delay(Math.max(0, at - 0.13))}`,
  )
}
for (const [i, at] of [1.05, 3.25].entries())
  add(`landing${i}`, `aevalsrc=0.12*sin(2*PI*62*t)*exp(-18*t):s=48000:d=0.3,${delay(at)}`)
add('fall', `aevalsrc=0.3*sin(2*PI*66*t)*exp(-20*t):s=48000:d=0.4,${delay(6.13)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.12:d=0.35:r=48000:seed=92,highpass=f=400,afade=t=out:d=0.35,${delay(6.13)}`,
)
add('glass', `aevalsrc=0.035*sin(2*PI*1900*t)*exp(-13*t):s=48000:d=0.4,${delay(7.25)}`)
add(
  'growth',
  `anoisesrc=c=pink:a=0.04:d=0.9:r=48000:seed=35,highpass=f=1100,lowpass=f=3800,afade=t=in:d=0.2,afade=t=out:st=0.4:d=0.5,${delay(7.6)}`,
)
add(
  'bloom',
  `aevalsrc=0.025*(sin(2*PI*880*t)+0.4*sin(2*PI*1320*t))*exp(-4*t):s=48000:d=0.7,${delay(8)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.25)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Bill-Dernier-Rempart-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/bill.m4a')
const picture = path.join(folder, 'Bill-Dernier-Rempart-picture.mp4')
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
    path.join(folder, 'Bill-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      nativeCombos: report.nativeCombos,
      strikeSeconds: report.nativeHits.map((hit) => hit.age / 60),
      impactSecond: 5.7,
      fallSecond: 343 / 60,
      growthSecond: 7.6,
      bloomSecond: 8,
      announcementSecond: 8.25,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Bill soundtrack: ${audio}\n`)
