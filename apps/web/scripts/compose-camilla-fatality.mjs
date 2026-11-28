import assert from 'node:assert/strict'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const timing = JSON.parse(
  await readFile(
    new URL('../src/lib/fighting/victory/camillaSoundTiming.json', import.meta.url),
    'utf8',
  ),
)
const delay = (frame) => Math.round((frame * 1000) / 60)

const folder = path.resolve('output/fighting-camilla-fatality')
await mkdir(folder, { recursive: true })
const voice = path.join(folder, 'camilla-announcer.aiff')
if (!existsSync(voice)) execFileSync('say', ['-v', 'Daniel', '-r', '138', '-o', voice, 'Fatality.'])
const run = async (args) => {
  const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(child, 'exit'))[0], 0)
}
const cues = [
  { name: 'contact', frame: 16, duration: 0.24, waveform: '0.45*sin(2*PI*(73-65*t)*t)*exp(-23*t)' },
  {
    name: 'fall',
    frame: 53,
    duration: 0.43,
    waveform: '(0.49*sin(2*PI*(77-45*t)*t)+0.13*sin(2*PI*171*t)*exp(-12*t))*exp(-14*t)',
  },
  {
    name: 'paw',
    frame: 102,
    duration: 0.62,
    waveform: '(0.43*sin(2*PI*(54-18*t)*t)+0.08*sin(2*PI*135*t)*exp(-18*t))*exp(-9*t)',
  },
  {
    name: 'grip',
    frame: 166,
    duration: 1.53,
    waveform: '0.075*(sin(2*PI*48*t)+0.25*sin(2*PI*119*t))*sin(PI*t/1.53)^2',
  },
  {
    name: 'clench',
    frame: 259,
    duration: 0.36,
    waveform: '(0.25*sin(2*PI*(102-108*t)*t)+0.13*sin(2*PI*279*t)*exp(-23*t))*exp(-19*t)',
  },
  {
    name: 'tail',
    frame: 282,
    duration: 2.12,
    waveform: '0.09*(sin(2*PI*(144+89*t)*t)+0.3*sin(2*PI*(288+178*t)*t))*sin(PI*t/2.12)^2',
  },
  {
    name: 'drop',
    frame: timing.dropContactFrame,
    duration: 0.21,
    waveform: '0.22*(sin(2*PI*(670-170*t)*t)+0.3*sin(2*PI*1043*t))*exp(-16*t)',
  },
]
const bed =
  'aevalsrc=0.046*(sin(2*PI*41*t)+0.31*sin(2*PI*63*t))*sin(PI*t/7.38)^2:s=48000:d=7.38[bed]'
const notes = cues.map(
  ({ name, frame, duration, waveform }) =>
    `aevalsrc=${waveform}:s=48000:d=${duration},afade=t=in:d=0.008,adelay=${delay(frame)}[${name}]`,
)
const breath = `anoisesrc=color=pink:amplitude=0.9:sample_rate=48000:duration=0.74:seed=741,highpass=f=225,lowpass=f=3100,equalizer=f=980:t=q:w=1.1:g=7,afade=t=in:d=0.065,afade=t=out:st=0.34:d=0.40,volume=2.65,adelay=${delay(timing.inhaleFrame)}[inhale]`
const breathCatch = `anoisesrc=color=white:amplitude=0.25:sample_rate=48000:duration=0.32:seed=176,highpass=f=720,lowpass=f=1850,afade=t=in:d=0.032,afade=t=out:st=0.08:d=0.24,volume=1.6,adelay=${delay(timing.inhaleFrame)}[catch]`
const announcer = `[0:a]atrim=end=0.95,asetrate=18522,aresample=48000,atempo=1.45,highpass=f=60,lowpass=f=5200,acompressor=threshold=0.10:ratio=2.8:attack=8:release=48:makeup=1.9,aecho=0.88:0.68:48:0.17,volume=2.6,adelay=${delay(timing.verdictFrame)}[announcer]`
const mix = `[bed]${cues.map(({ name }) => `[${name}]`).join('')}[inhale][catch][announcer]amix=inputs=${cues.length + 4}:normalize=0,apad=whole_len=480000,atrim=end_sample=480000,alimiter=limit=0.94:level=0:latency=1[audio]`
const audio = path.join(folder, 'Camilla-Le-Chat-Qui-Revient-audio.m4a')
await run([
  '-i',
  voice,
  '-filter_complex',
  [bed, ...notes, breath, breathCatch, announcer, mix].join(';'),
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
await copyFile(audio, 'apps/web/static/clash-victories/camilla.m4a')
const picture = path.join(folder, 'Camilla-Le-Chat-Qui-Revient-picture.mp4')
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
    path.join(folder, 'Camilla-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      cues: [
        ...cues.map(({ name, frame }) => ({ name, frame })),
        { name: 'inhale', frame: timing.inhaleFrame },
        { name: 'announcer', frame: timing.verdictFrame },
      ],
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Camilla soundtrack: ${audio}\n`)
