import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-leorio-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'leorio-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('tension', 'aevalsrc=0.035*(sin(2*PI*41*t)+.3*sin(2*PI*61.5*t))*sin(PI*t/5.8)^2:s=48000:d=5.8')
for (const [i, frame] of [114, 150, 186, 222, 258, 294, 348].entries()) {
  const last = i === 6,
    gain = last ? 0.3 : 0.14
  add(
    `floor${i}`,
    `aevalsrc=0.08*sin(2*PI*150*t)*exp(-45*t):s=48000:d=0.18,${delay((frame - (last ? 18 : 12)) / 60)}`,
  )
  add(
    `sweep${i}`,
    `anoisesrc=c=pink:a=0.055:d=0.18:r=48000:seed=${55 + i},highpass=f=400,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.06,${delay(frame / 60 - 0.18)}`,
  )
  add(
    `punch${i}`,
    `aevalsrc=${gain}*(sin(2*PI*(105*t-32*t*t))+.3*sin(2*PI*1280*t))*exp(-30*t):s=48000:d=0.32,${delay(frame / 60)}`,
  )
}
add(
  'launch',
  `aevalsrc=0.075*sin(2*PI*(160*t+280*t*t))*sin(PI*t/1.2)^2:s=48000:d=1.2,${delay(5.8)}`,
)
add('ceiling', `aevalsrc=0.4*sin(2*PI*(63*t-9*t*t))*exp(-4.5*t):s=48000:d=1.6,${delay(7)}`)
add(
  'crack',
  `anoisesrc=c=white:a=0.12:d=0.3:r=48000:seed=19,highpass=f=1200,afade=t=out:d=0.3,${delay(7)}`,
)
add(
  'rubble',
  `anoisesrc=c=brown:a=0.12:d=1.5:r=48000:seed=31,lowpass=f=1200,afade=t=out:d=1.5,${delay(7.08)}`,
)
add('glasses', `aevalsrc=0.035*sin(2*PI*1450*t)*exp(-35*t):s=48000:d=0.18,${delay(8.5)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Leorio-L-Etage-Superieur-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/leorio.m4a')
const picture = path.join(folder, 'Leorio-L-Etage-Superieur-picture.mp4')
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
    path.join(folder, 'Leorio-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      punchFrames: [114, 150, 186, 222, 258, 294, 348],
      launchSecond: 5.8,
      ceilingSecond: 7,
      announcementSecond: 8.05,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Leorio soundtrack: ${audio}\n`)
