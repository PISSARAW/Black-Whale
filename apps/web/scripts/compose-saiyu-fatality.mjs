import assert from 'node:assert/strict'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-saiyu-fatality')
await mkdir(folder, { recursive: true })
const announcer = path.join(folder, 'saiyu-announcer.aiff')
if (!existsSync(announcer))
  execFileSync('say', ['-v', 'Daniel', '-r', '118', '-o', announcer, 'Fatality.'])
const run = async (args) => {
  const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const layers = [],
  delay = (at) => `adelay=${Math.round(at * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
// The sensory loss is audible: brightness falls away, then breath and voices are absent.
add('dread', 'aevalsrc=0.055*(sin(2*PI*38*t)+0.2*sin(2*PI*57*t))*sin(PI*t/6)^2:s=48000:d=6')
add(
  'air',
  'anoisesrc=c=pink:a=0.018:d=2.7:r=48000:seed=64,highpass=f=400,lowpass=f=8000,afade=t=out:st=2.45:d=0.25',
)
for (const [i, at] of [0.7, 0.9, 1.1].entries())
  add(
    `seal${i}`,
    `aevalsrc=0.045*(sin(2*PI*${880 + i * 220}*t)+0.3*sin(2*PI*${1760 + i * 440}*t))*exp(-8*t):s=48000:d=0.7,${delay(at)}`,
  )
for (const [i, at] of [1.5, 2.7, 3.9].entries()) {
  add(
    `rush${i}`,
    `anoisesrc=c=pink:a=0.13:d=0.25:r=48000:seed=${30 + i},lowpass=f=${i === 0 ? 6500 : 450},afade=t=in:d=0.18,afade=t=out:st=0.18:d=0.07,${delay(at - 0.25)}`,
  )
  add(
    `touch${i}`,
    `aevalsrc=0.13*sin(2*PI*${i === 0 ? 1200 : 220}*t)*exp(-26*t):s=48000:d=0.4,${delay(at)}`,
  )
}
add(
  'deaf',
  'aevalsrc=0.022*sin(2*PI*2300*t)*exp(-3*t):s=48000:d=1,afade=t=out:st=0.7:d=0.3,' + delay(2.7),
)
add(
  'pulse',
  'aevalsrc=0.07*sin(2*PI*46*t)*(0.5+0.5*sin(2*PI*1.6*t))^12:s=48000:d=2.1,afade=t=out:st=1.8:d=0.3,' +
    delay(3.9),
)
add(
  'extension',
  'anoisesrc=c=brown:a=0.12:d=0.7:r=48000:seed=93,lowpass=f=900,afade=t=in:d=0.6,afade=t=out:st=0.6:d=0.1,' +
    delay(4.7),
)
add(
  'swing',
  'anoisesrc=c=pink:a=0.3:d=0.2:r=48000:seed=27,highpass=f=300,lowpass=f=9000,afade=t=in:d=0.17,afade=t=out:st=0.17:d=0.03,' +
    delay(5.8),
)
add(
  'impact',
  'aevalsrc=0.62*(sin(2*PI*(95*t-30*t*t))+0.3*sin(2*PI*170*t))*exp(-6*t):s=48000:d=1.1,' + delay(6),
)
add(
  'crack',
  'anoisesrc=c=brown:a=0.32:d=0.3:r=48000:seed=82,highpass=f=150,lowpass=f=6000,afade=t=out:d=0.3,' +
    delay(6),
)
add(
  'landing',
  'anoisesrc=c=brown:a=0.22:d=0.5:r=48000:seed=21,lowpass=f=1200,afade=t=out:d=0.5,' + delay(6.4),
)
add(
  'last-ring',
  'aevalsrc=0.07*(sin(2*PI*660*t)+0.4*sin(2*PI*1320*t))*exp(-2*t):s=48000:d=2.5,' + delay(7.2),
)
add(
  'announcer',
  `[0:a]aresample=48000,asetrate=48000*0.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.1)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,apad=whole_len=480000,atrim=end_sample=480000,loudnorm=I=-17:TP=-1.5:LRA=12,aresample=48000,alimiter=limit=0.94:level=0:latency=1,afade=t=out:st=9.4:d=0.6,volume=0:enable='between(t,2.9,4.7)',atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Saiyu-Les-Trois-Silences-audio.m4a')
await run([
  '-i',
  announcer,
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
const silence = spawnSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-nostats',
    '-i',
    audio,
    '-af',
    'atrim=start=3.05:end=4.55,astats=metadata=1:reset=0',
    '-f',
    'null',
    '-',
  ],
  { encoding: 'utf8' },
)
assert.equal(silence.status, 0)
const levels = [...silence.stderr.matchAll(/RMS level dB: (-inf|-?[\d.]+)/g)].map((match) =>
  Number(match[1].replace('-inf', '-Infinity')),
)
assert.ok(
  levels.length > 0 && levels.every((level) => level < -85),
  'The hearing-loss and silent-cry interval must be silent',
)
await copyFile(audio, 'apps/web/static/clash-victories/saiyu.m4a')
const picture = path.join(folder, 'Saiyu-Les-Trois-Silences-picture.mp4')
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
    path.join(folder, 'Saiyu-Fatality-Sens-Annonce-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      voices: [{ role: 'announcer', language: 'en', line: 'Fatality.', at: 8.1 }],
      announcementSecond: 8.1,
      frenchDialogue: false,
      sensorySilence: [2.9, 4.7],
      senseFrames: [90, 162, 234],
      impactFrame: 360,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Saiyu soundtrack with English Fatality announcement: ${audio}\n`)
