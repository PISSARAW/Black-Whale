import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-benjamin-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0, `${command} failed`)
}
const voice = path.join(folder, 'benjamin-announcer.aiff')
if (!existsSync(voice))
  await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality. Benjamin.'])
const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
const tone = (hz, level, duration) =>
  `aevalsrc=${level}*sin(2*PI*${hz}*t)*exp(-9*t):s=48000:d=${duration}`
const clicks = [0.28, 0.58, 1.05, 6.55].map(
  (time, i) => `${tone(2400 + i * 137, 0.05, 0.23)},${delay(time)}[tag${i}]`,
)
const steps = [3.22, 3.72, 4.1].map(
  (time, i) => `${tone(74 - i * 7, 0.14, 0.42)},${delay(time)}[step${i}]`,
)
const filter = [
  ...clicks,
  ...steps,
  'aevalsrc=0.04*(sin(2*PI*49*t)+0.45*sin(2*PI*73.4*t))*sin(PI*t/4.3)^2:s=48000:d=4.3[inheritance]',
  `anoisesrc=c=pink:a=0.045:d=2.6:r=48000:seed=37,highpass=f=160,lowpass=f=1350,afade=t=in:d=0.7,afade=t=out:st=2:d=0.6,${delay(1.1)}[echo]`,
  `aevalsrc=0.055*sin(2*PI*(52*t+18*t*t))*sin(PI*t/1.1)^2:s=48000:d=1.1,${delay(3.15)}[pressure]`,
  `anoisesrc=c=pink:a=0.07:d=0.18:r=48000:seed=42,afade=t=in:d=0.16,${delay(4.28)}[inhale]`,
  `aevalsrc=0.32*sin(2*PI*(57*t-14*t*t))*exp(-6*t):s=48000:d=1.2,${delay(4.5)}[impact]`,
  `anoisesrc=c=brown:a=0.45:d=1.3:r=48000:seed=18,lowpass=f=1800,afade=t=out:d=1.3,${delay(4.5)}[blast]`,
  `anoisesrc=c=white:a=0.12:d=0.7:r=48000:seed=12,highpass=f=1600,afade=t=out:d=0.7,${delay(4.53)}[air]`,
  `anoisesrc=c=pink:a=0.05:d=1.8:r=48000:seed=29,highpass=f=600,lowpass=f=3300,tremolo=f=21:d=0.8,afade=t=out:st=0.3:d=1.5,${delay(4.85)}[debris]`,
  `aevalsrc=0.04*(sin(2*PI*49*t)+.38*sin(2*PI*98*t)+.23*sin(2*PI*147*t))*sin(PI*t/3)^2:s=48000:d=3,${delay(7)}[verdict]`,
  `[0:a]asetrate=22050*.78,aresample=48000,atempo=1.13,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:62:0.15,volume=0.9,${delay(7.08)}[announcer]`,
  `${clicks.map((_, i) => `[tag${i}]`).join('')}${steps.map((_, i) => `[step${i}]`).join('')}[inheritance][echo][pressure][inhale][impact][blast][air][debris][verdict][announcer]amix=inputs=17:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Benjamin-Le-Dernier-Ordre-audio.m4a')
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
assert.equal(Number(probe.format.duration), 10, 'Benjamin soundtrack must last ten full seconds')
await copyFile(audio, 'apps/web/static/clash-victories/benjamin.m4a')
const picture = path.join(folder, 'Benjamin-Le-Dernier-Ordre-picture.mp4')
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
    '-metadata',
    'title=Black Whale Clash — Benjamin / Le dernier ordre',
    path.join(folder, 'Benjamin-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      inheritanceSecond: 62 / 60,
      palmHand: 'left',
      impactSecond: 4.5,
      targetGoneSecond: 5.6,
      saluteSecond: 6.45,
      announcementSecond: 7.08,
      soundDesign:
        'Dog-tag clicks, spectral breath, three military steps, pressure vacuum, single Air Blow explosion, debris and low military cadence. Local Daniel system announcer.',
    },
    null,
    2,
  ),
)
console.log(
  `Saved Benjamin soundtrack${existsSync(picture) ? ' and ten-second film' : ''}: ${folder}`,
)
