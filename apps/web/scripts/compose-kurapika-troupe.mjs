import assert from 'node:assert/strict'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
const folder = path.resolve('output/fighting-kurapika-troupe')
await mkdir(folder, { recursive: true })
const run = async (args) => {
  const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const layers = [],
  delay = (t) => `adelay=${Math.round(t * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
// No speech, TTS, sampled dialogue or announcer: only metallic chains, impacts and music.
add('rage', 'aevalsrc=0.05*(sin(2*PI*42*t)+0.2*sin(2*PI*63*t))*sin(PI*t/5.5)^2:s=48000:d=5.5')
add(
  'air',
  'anoisesrc=c=brown:a=0.025:d=10:r=48000:seed=34,highpass=f=150,lowpass=f=1700,afade=t=in:d=0.2,afade=t=out:st=9.3:d=0.7',
)
add(
  'cast',
  `anoisesrc=c=pink:a=0.18:d=0.5:r=48000:seed=75,highpass=f=1700,afade=t=in:d=0.08,afade=t=out:st=0.2:d=0.3,${delay(0.55)}`,
)
add(
  'lock',
  `aevalsrc=0.19*(sin(2*PI*1400*t)+0.5*sin(2*PI*2900*t))*exp(-21*t):s=48000:d=0.4,${delay(1.05)}`,
)
const punches = [84, 114, 144, 174, 204, 234, 300]
for (const [i, frame] of punches.entries()) {
  const at = frame / 60,
    heavy = i === punches.length - 1
  add(
    `wind${i}`,
    `anoisesrc=c=pink:a=${heavy ? 0.14 : 0.09}:d=0.14:r=48000:seed=${50 + i},highpass=f=900,afade=t=in:d=0.1,afade=t=out:st=0.1:d=0.04,${delay(at - 0.14)}`,
  )
  add(
    `blow${i}`,
    `aevalsrc=${heavy ? 0.62 : 0.29}*(sin(2*PI*(110*t-42*t*t))+0.3*sin(2*PI*220*t))*exp(-${heavy ? 9 : 22}*t):s=48000:d=${heavy ? 0.65 : 0.28},${delay(at)}`,
  )
  add(
    `hit${i}`,
    `anoisesrc=c=brown:a=${heavy ? 0.35 : 0.17}:d=0.16:r=48000:seed=${15 + i},highpass=f=300,lowpass=f=4200,afade=t=out:d=0.16,${delay(at)}`,
  )
  add(
    `links${i}`,
    `aevalsrc=0.085*(sin(2*PI*1850*t)+0.4*sin(2*PI*3400*t))*exp(-24*t):s=48000:d=0.26,${delay(at + 0.04)}`,
  )
}
add(
  'landing',
  `anoisesrc=c=brown:a=0.27:d=0.4:r=48000:seed=89,highpass=f=100,lowpass=f=1400,afade=t=out:d=0.4,${delay(5.5)}`,
)
add(
  'withdraw',
  `anoisesrc=c=pink:a=0.08:d=0.7:r=48000:seed=49,highpass=f=2200,afade=t=in:d=0.1,afade=t=out:st=0.35:d=0.35,${delay(368 / 60)}`,
)
add('last-link', `aevalsrc=0.09*sin(2*PI*1700*t)*exp(-30*t):s=48000:d=0.3,${delay(410 / 60)}`)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.4:d=0.6,loudnorm=I=-17:TP=-1.5:LRA=12,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Kurapika-La-Colere-Ecarlate-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run([
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
await copyFile(audio, 'apps/web/static/clash-victories/kurapika-troupe.m4a')
const picture = path.join(folder, 'Kurapika-La-Colere-Ecarlate-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only'))
  await run([
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
    path.join(folder, 'Kurapika-Brigade-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      voices: [],
      jailSecond: 1.05,
      punchFrames: punches,
      impactSecond: 5,
      releaseSecond: 368 / 60,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved voice-free Kurapika Troupe soundtrack: ${audio}\n`)
