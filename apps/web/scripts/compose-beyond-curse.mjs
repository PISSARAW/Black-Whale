import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-beyond-curse')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speech = path.join(folder, 'announcer.aiff')
if (!existsSync(speech)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', speech, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
const thud = (label, at, power) =>
  add(
    label,
    `aevalsrc=${power}*(sin(2*PI*62*t)+0.3*sin(2*PI*103*t))*exp(-22*t):s=48000:d=0.35,${delay(at)}`,
  )
add(
  'air',
  `anoisesrc=c=pink:a=0.055:d=0.3:r=48000:seed=71,highpass=f=800,afade=t=in:d=0.1,afade=t=out:st=0.16:d=0.14,${delay(0.7)}`,
)
thud('blow', 1, 0.22)
thud('carrierFall', 1.78, 0.15)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.05:d=0.23:r=48000:seed=12,highpass=f=300,afade=t=out:d=0.23,${delay(1.78)}`,
)
add(
  'seal',
  `aevalsrc=0.045*(sin(2*PI*490*t)+sin(2*PI*517*t))*sin(PI*t/1.25):s=48000:d=1.25,${delay(2.6)}`,
)
add(
  'unseal',
  `anoisesrc=c=brown:a=0.09:d=1.2:r=48000:seed=25,lowpass=f=450,afade=t=in:d=0.4,afade=t=out:st=0.8:d=0.4,${delay(3.9)}`,
)
add(
  'inheritance',
  `aevalsrc=0.065*(sin(2*PI*39*t)+0.4*sin(2*PI*81*t))*(0.25+0.75*t/3.3):s=48000:d=3.3,afade=t=in:d=0.3,afade=t=out:st=3.1:d=0.2,${delay(3.9)}`,
)
thud('arrival', 5.1, 0.13)
for (const [i, at] of [5.15, 5.7, 6.12, 6.5, 6.82, 7.04].entries()) {
  thud(`heart${i}`, at, 0.1)
  add(
    `breath${i}`,
    `anoisesrc=c=pink:a=0.04:d=0.16:r=48000:seed=${41 + i},highpass=f=800,lowpass=f=2700,afade=t=in:d=0.03,afade=t=out:st=0.07:d=0.09,${delay(at)}`,
  )
}
add(
  'break',
  `aevalsrc=0.065*(sin(2*PI*760*t)+sin(2*PI*813*t))*exp(-13*t):s=48000:d=0.2,${delay(7.2)}`,
)
thud('princeFall', 7.78, 0.19)
add('aftermath', `aevalsrc=0.028*sin(2*PI*43*t)*sin(PI*t/2.1):s=48000:d=2.1,${delay(7.9)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.6)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.5:d=0.5,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Beyond-Curse-audio.m4a')
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  speech,
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
for (const carrier of ['furykov', 'longhi']) {
  const label = carrier === 'furykov' ? 'Furykov' : 'Longhi'
  await copyFile(audio, `apps/web/static/clash-victories/beyond-curse-${carrier}.m4a`)
  const picture = path.join(folder, carrier, `${label}-Heritage-de-Beyond-picture.mp4`)
  if (!existsSync(picture) || process.argv.includes('--audio-only')) continue
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
    path.join(folder, carrier, `${label}-Heritage-de-Beyond-10s.mp4`),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      frenchDialogue: false,
      impactSecond: 1,
      carrierDeathSecond: 1.2,
      sealSecond: 2.6,
      releaseSecond: 3.9,
      contactSecond: 5.1,
      princeDeathSecond: 7.2,
      announcementSecond: 8.6,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved post-mortem soundtrack: ${audio}\n`)
