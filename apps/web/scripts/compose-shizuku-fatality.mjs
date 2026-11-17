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
const voice = path.join(folder, 'shizuku-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const phrases = [
  ['call', 'Démé-chan.', 0.15, 200],
  ['blood-order', 'Le sang.', 1.65, 200],
  ['cleanup-order', 'Le corps. Et les traces.', 5, 205],
  ['return-order', 'Rends-le.', 7.45, 205],
  ['question', 'À qui ?', 9.35, 220],
]
const speech = []
for (const [name, words, , rate] of phrases) {
  const file = path.join(folder, `shizuku-${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', 'Amélie', '-r', String(rate), '-o', file, words])
  speech.push(file)
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('tension', 'aevalsrc=0.026*(sin(2*PI*44*t)+0.2*sin(2*PI*66*t))*sin(PI*t/7.4)^2:s=48000:d=7.4')
add(
  'club',
  `aevalsrc=0.32*(sin(2*PI*(110*t-25*t*t))+0.2*sin(2*PI*870*t))*exp(-17*t):s=48000:d=0.42,${delay(1.4)}`,
)
add(
  'swing',
  `anoisesrc=c=pink:a=0.1:d=0.4:r=48000:seed=14,highpass=f=1000,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.1,${delay(1)}`,
)
for (const [i, at, duration] of [
  [0, 2.3, 2.4],
  [1, 5.7, 1.7],
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
add('collapse', `aevalsrc=0.18*sin(2*PI*78*t)*exp(-10*t):s=48000:d=0.5,${delay(5.45)}`)
add('zip', `aevalsrc=0.07*sin(2*PI*(180*t+440*t*t))*sin(PI*t/1):s=48000:d=1,${delay(5.7)}`)
add('button-in', `aevalsrc=0.065*sin(2*PI*1100*t)*exp(-65*t):s=48000:d=0.15,${delay(7.4)}`)
add('burp', `aevalsrc=0.16*sin(2*PI*(180*t-280*t*t))*exp(-11*t):s=48000:d=0.28,${delay(7.9)}`)
add('catch', `aevalsrc=0.065*sin(2*PI*1800*t)*exp(-70*t):s=48000:d=0.13,${delay(8.3)}`)
add('glasses', `aevalsrc=0.03*sin(2*PI*1500*t)*exp(-60*t):s=48000:d=0.12,${delay(9)}`)
phrases.forEach(([name, , at], i) =>
  add(name, `[${i + 1}:a]aresample=48000,highpass=f=130,lowpass=f=5500,volume=1.35,${delay(at)}`),
)
add(
  'announcer',
  `[0:a]asetrate=22050*0.82,aresample=48000,atempo=1.3,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.75,${delay(8.3)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Shizuku-Rien-A-Signaler-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  voice,
  ...speech.flatMap((file) => ['-i', file]),
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
await copyFile(audio, 'apps/web/static/clash-victories/shizuku.m4a')
const picture = path.join(folder, 'Shizuku-Rien-A-Signaler-picture.mp4')
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
    path.join(folder, 'Shizuku-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      impactSecond: 1.4,
      bloodSecond: 2.3,
      deathSecond: 4.7,
      cleanupSecond: 5.7,
      lastObjectSecond: 7.4,
      returnSecond: 7.9,
      commands: phrases.map(([name, words, second]) => ({ name, words, second })),
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Shizuku soundtrack: ${audio}\n`)
