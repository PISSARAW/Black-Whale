import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-camilla-fatality')
await mkdir(folder, { recursive: true })
const source = path.resolve('output/fighting-cats-still/Chrollo-vs-Camilla-Le-Souffle.mp4')
const original = existsSync(source)
const cat = original
  ? '[0:a]aresample=48000,asplit=2[crush-source][portrait-source];[crush-source]atrim=start=30.283333333:end=37.75,asetpts=PTS-STARTPTS,atempo=0.878431372549,apad=whole_len=408000,atrim=end_sample=408000[crush];[portrait-source]atrim=start=37.75:end=39.25,asetpts=PTS-STARTPTS,apad=whole_len=72000,atrim=end_sample=72000[portrait];[crush][portrait]concat=n=2:v=0:a=1,atrim=end_sample=480000[audio]'
  : 'aevalsrc=0.04*sin(2*PI*44*t)*sin(PI*t/8.5)^2:s=48000:d=8.5,afade=t=out:st=8.2:d=0.3[before];anoisesrc=color=pink:amplitude=0.65:sample_rate=48000:duration=0.65:seed=741,highpass=f=330,lowpass=f=3200,afade=t=in:d=0.055,afade=t=out:st=0.38:d=0.27,volume=1.7,adelay=9300:all=1[inhale];[before][inhale]amix=inputs=2:normalize=0,apad=whole_len=480000,atrim=end_sample=480000,alimiter=limit=0.94:level=0:latency=1[audio]'
const run = async (args) => {
  const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(child, 'exit'))[0], 0)
}
const audio = path.join(folder, 'Camilla-Le-Souffle-audio.m4a')
await run([
  ...(original ? ['-i', source] : []),
  '-filter_complex',
  cat,
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
const picture = path.join(folder, 'Camilla-Le-Souffle-picture.mp4')
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
      source: original ? source : 'Reference inhale synthesis',
      portraitSecond: 8.5,
      eyeOpeningSecond: 554 / 60,
      inhaleSecond: 9.3,
      portraitBodyFrozen: true,
      portraitCameraFrozen: true,
      ending: 'One inhalation, no music or announcer after the eye opening.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Camilla soundtrack: ${audio}\n`)
