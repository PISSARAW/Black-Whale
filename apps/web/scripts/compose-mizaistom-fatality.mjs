import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-mizaistom-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['mizaistom-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [0.7, 4.3].entries()) {
  add(
    `warning${i}`,
    `aevalsrc=0.1*(sin(2*PI*880*t)+0.4*sin(2*PI*1320*t))*exp(-9*t):s=48000:d=0.5,${delay(at)}`,
  )
}
for (const [i, at] of [2.4, 5].entries()) {
  add(
    `flip${i}`,
    `anoisesrc=c=white:a=0.15:d=0.09:r=48000:seed=${39 + i},highpass=f=2000,afade=t=out:d=0.09,${delay(at)}`,
  )
  add(
    `restraint${i}`,
    `aevalsrc=0.08*(sin(2*PI*53*t)+0.3*sin(2*PI*107*t))*sin(PI*t/1.5):s=48000:d=1.5,${delay(at)}`,
  )
}
for (const [i, at] of [3.933333, 6.533333].entries()) {
  add(
    `hit${i}`,
    `anoisesrc=c=brown:a=0.6:d=0.16:r=48000:seed=${74 + i},highpass=f=90,lowpass=f=2800,afade=t=out:d=0.16,${delay(at)}`,
  )
  add(`bass${i}`, `aevalsrc=0.4*sin(2*PI*62*t)*exp(-23*t):s=48000:d=0.4,${delay(at)}`)
}
add(
  'break',
  `anoisesrc=c=white:a=0.44:d=0.5:r=48000:seed=112,highpass=f=280,lowpass=f=7400,afade=t=out:d=0.5,aecho=0.8:0.6:73|153:0.25|0.12,${delay(6.9)}`,
)
add(
  'impact',
  `aevalsrc=0.38*(sin(2*PI*47*t)+0.3*sin(2*PI*113*t))*exp(-20*t):s=48000:d=0.5,${delay(6.9)}`,
)
for (const [i, at] of [7.05, 7.17, 7.38, 7.52].entries()) {
  add(
    `debris${i}`,
    `anoisesrc=c=brown:a=0.1:d=0.12:r=48000:seed=${25 + i},highpass=f=600,afade=t=out:d=0.12,${delay(at)}`,
  )
}
add('land', `aevalsrc=0.2*sin(2*PI*76*t)*exp(-22*t):s=48000:d=0.4,${delay(7.45)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Mizaistom-Dernier-Avertissement-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/mizaistom.m4a')
const picture = path.join(folder, 'Mizaistom-Dernier-Avertissement-picture.mp4')
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
    path.join(folder, 'Mizaistom-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      warningSeconds: [0.7, 4.3],
      confinementSeconds: [2.4, 5],
      confinementDuration: 1.5,
      physicalHitSeconds: [236 / 60, 392 / 60],
      breakSecond: 6.9,
      redCardExecution: false,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Mizaistom soundtrack: ${audio}\n`)
