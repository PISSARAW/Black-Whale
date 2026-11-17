import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-halkenburg-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'halkenburg-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('will', 'aevalsrc=0.035*(sin(2*PI*42*t)+.4*sin(2*PI*63*t))*sin(PI*t/5.4)^2:s=48000:d=5.4')
for (let i = 0; i < 3; i++) {
  add(
    `voice${i}`,
    `aevalsrc=0.022*(sin(2*PI*${110 + i * 55}*t)+.3*sin(2*PI*${220 + i * 110}*t))*sin(PI*t/3.9)^2:s=48000:d=3.9,${delay(1.1 + i * 0.12)}`,
  )
  add(
    `feather${i}`,
    `aevalsrc=0.025*sin(2*PI*${880 + i * 220}*t)*exp(-7*t):s=48000:d=0.6,${delay(1.5 + i * 0.3)}`,
  )
}
add('string', `aevalsrc=0.025*sin(2*PI*(140*t+70*t*t))*sin(PI*t/2.2)^2:s=48000:d=2.2,${delay(2.8)}`)
add(
  'release',
  `aevalsrc=0.11*(sin(2*PI*390*t)+.3*sin(2*PI*780*t))*exp(-25*t):s=48000:d=0.3,${delay(5)}`,
)
add(
  'arrow',
  `anoisesrc=c=pink:a=0.12:d=0.48:r=48000:seed=32,highpass=f=700,afade=t=in:d=0.12,afade=t=out:st=0.15:d=0.33,${delay(5)}`,
)
add('impact', `aevalsrc=0.24*sin(2*PI*(58*t-8*t*t))*exp(-6*t):s=48000:d=1,${delay(5.4)}`)
add(
  'transfer',
  `anoisesrc=c=pink:a=0.045:d=1.4:r=48000:seed=56,lowpass=f=1500,afade=t=in:d=0.4,afade=t=out:st=0.4:d=1,${delay(5.4)}`,
)
add(
  'awakening',
  `aevalsrc=0.045*(sin(2*PI*330*t)+.35*sin(2*PI*495*t))*exp(-5*t):s=48000:d=1,${delay(6.85)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Halkenburg-Une-Seule-Volonte-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/halkenburg.m4a')
const picture = path.join(folder, 'Halkenburg-Une-Seule-Volonte-picture.mp4')
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
    path.join(folder, 'Halkenburg-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      supporters: 3,
      releaseSecond: 5,
      impactSecond: 5.4,
      announcementSecond: 8.05,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Halkenburg soundtrack: ${audio}\n`)
