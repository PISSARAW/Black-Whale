import assert from 'node:assert/strict'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-melody-fatality')
await mkdir(folder, { recursive: true })
const announcer = path.join(folder, 'melody-friendship-announcer.aiff')
if (!existsSync(announcer))
  execFileSync('say', ['-v', 'Daniel', '-r', '118', '-o', announcer, 'Friendship.'])
const run = async (args) => {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(p, 'exit'))[0], 0)
}
const layers = [],
  delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
// An original flute phrase, rather than an excerpt from the anime's recording.
const notes = [
  523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25,
  587.33, 523.25, 440, 523.25,
]
for (const [i, hz] of notes.entries()) {
  const at = 0.78 + i * 0.49,
    duration = i === notes.length - 1 ? 1.75 : 0.57
  add(
    `flute${i}`,
    `aevalsrc=0.12*(sin(2*PI*${hz}*t+0.55*sin(2*PI*5*t))+0.13*sin(4*PI*${hz}*t)+0.025*sin(6*PI*${hz}*t)):s=48000:d=${duration},afade=t=in:d=0.06,afade=t=out:st=${duration - 0.12}:d=0.12,${delay(at)}`,
  )
  add(
    `breath${i}`,
    `anoisesrc=c=pink:a=0.006:d=${duration}:r=48000:seed=${50 + i},highpass=f=1600,lowpass=f=6000,afade=t=in:d=0.06,afade=t=out:st=${duration - 0.12}:d=0.12,${delay(at)}`,
  )
}
add(
  'room',
  'anoisesrc=c=brown:a=0.017:d=3.5:r=48000:seed=42,highpass=f=150,lowpass=f=1800,afade=t=out:st=1.7:d=1.8',
)
add(
  'spring',
  'anoisesrc=c=pink:a=0.015:d=6.5:r=48000:seed=84,highpass=f=1800,lowpass=f=4200,afade=t=in:d=1.2,afade=t=out:st=5.6:d=0.9,' +
    delay(3.5),
)
add(
  'warmth',
  'aevalsrc=0.022*(sin(2*PI*130.81*t)+0.4*sin(2*PI*196*t)+0.25*sin(2*PI*261.63*t)):s=48000:d=7.2,afade=t=in:d=1.3,afade=t=out:st=6.4:d=0.8,' +
    delay(2.8),
)
for (const [i, at] of [3.5, 4.1, 4.7, 5.5, 6.3].entries())
  add(
    `petal${i}`,
    `aevalsrc=0.025*sin(2*PI*${1318.5 + i * 74}*t)*exp(-5*t):s=48000:d=0.8,${delay(at)}`,
  )
add(
  'announcer',
  `[0:a]aresample=48000,asetrate=48000*0.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.1)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,apad=whole_len=480000,atrim=end_sample=480000,loudnorm=I=-17:TP=-1.5:LRA=12,aresample=48000,alimiter=limit=0.94:level=0:latency=1,afade=t=out:st=9.6:d=0.4,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Melody-Un-Champ-Au-Printemps-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/melody.m4a')
const picture = path.join(folder, 'Melody-Un-Champ-Au-Printemps-picture.mp4')
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
    path.join(folder, 'Melody-Friendship-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      announcementSecond: 8.1,
      announcementWord: 'Friendship',
      verdict: 'friendship',
      frenchDialogue: false,
      originalFlutePhrase: true,
      nonlethal: true,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Melody soundtrack with English Friendship announcement: ${audio}\n`)
