import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-kalluto-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'kalluto-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
const laugh = path.join(folder, 'target-laugh.aiff')
if (!existsSync(laugh)) await run('say', ['-v', 'Daniel', '-r', '180', '-o', laugh, 'Ha ha ha !'])
add('tension', 'aevalsrc=0.045*(sin(2*PI*38*t)+.25*sin(2*PI*57*t))*sin(PI*t/7.5)^2:s=48000:d=7.5')
add(
  'first',
  `anoisesrc=c=pink:a=0.065:d=0.23:r=48000:seed=17,highpass=f=2300,afade=t=out:d=0.23,${delay(0.5)}`,
)
add('attach', `aevalsrc=0.07*sin(2*PI*930*t)*exp(-65*t):s=48000:d=0.12,${delay(1.4)}`)
add(
  'laugh',
  `[1:a]aresample=48000,atrim=end=1.05,afade=t=out:st=0.9:d=0.15,volume=1.45,${delay(1.7)}`,
)
add(
  'unfold',
  `anoisesrc=c=white:a=0.12:d=1.9:r=48000:seed=24,highpass=f=1500,lowpass=f=6500,tremolo=f=19:d=0.8,afade=t=in:d=1.5,afade=t=out:st=1.7:d=0.2,${delay(2.7)}`,
)
add(
  'ocean',
  `anoisesrc=c=pink:a=0.25:d=3.6:r=48000:seed=42,highpass=f=500,tremolo=f=27:d=0.9,afade=t=in:d=0.35,afade=t=out:st=3.2:d=0.4,${delay(4.3)}`,
)
for (let i = 0; i < 20; i++) {
  const at = 5.3 + i * 0.105
  add(
    `cut${i}`,
    `anoisesrc=c=white:a=0.13:d=0.1:r=48000:seed=${100 + i},highpass=f=${2200 + i * 60},afade=t=out:d=0.1,${delay(at)}`,
  )
}
add('choke', `aevalsrc=0.28*sin(2*PI*(82*t-20*t*t))*exp(-8*t):s=48000:d=0.7,${delay(7.3)}`)
add(
  'fall',
  `anoisesrc=c=pink:a=0.06:d=2.3:r=48000:seed=79,highpass=f=1200,tremolo=f=8:d=0.8,afade=t=out:d=2.3,${delay(7.5)}`,
)
add(
  'fan',
  `anoisesrc=c=white:a=0.085:d=0.1:r=48000:seed=29,highpass=f=3000,afade=t=out:d=0.1,${delay(8.8)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Kalluto-Derniere-Danse-Papier-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  voice,
  '-i',
  laugh,
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
await copyFile(audio, 'apps/web/static/clash-victories/kalluto.m4a')
const picture = path.join(folder, 'Kalluto-Derniere-Danse-Papier-picture.mp4')
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
    path.join(folder, 'Kalluto-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      attachmentSecond: 1.4,
      laughSecond: 1.7,
      paperRevealSecond: 2.7,
      stormSecond: 4.7,
      shreddingSecond: 5.3,
      announcementSecond: 8.05,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Kalluto soundtrack: ${audio}\n`)
