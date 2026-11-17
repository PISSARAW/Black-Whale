import assert from 'node:assert/strict'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-franklin-fatality')
const report = JSON.parse(await readFile(path.join(folder, 'cinematic-report.json'), 'utf8'))
assert.equal(report.frameCount, 600)
assert.ok(report.nativeShotCount >= 20)
assert.ok(report.nativeBulletImpacts >= 15)
await copyFile(
  'output/fighting-kurapika-fatality/fatality-announcer.wav',
  path.join(folder, 'fatality-announcer.wav'),
)
const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
const guns = report.shots.map((shot, i) => {
  const pan = i % 2 ? [0.65, 1] : [1, 0.65]
  return `aevalsrc=0.05*(sin(2*PI*${1717 + (i % 5) * 73}*t)+0.6*sin(2*PI*3143*t)+0.4*sin(2*PI*5147*t))*exp(-60*t)+0.13*sin(2*PI*(120*t-40*t*t))*exp(-35*t):s=48000:d=0.13,pan=stereo|c0=${pan[0]}*c0|c1=${pan[1]}*c0,${delay(shot.emission / 60)}[gun${i}]`
})
const impacts = report.shots
  .filter((s) => s.impact !== null)
  .map(
    (shot, i) =>
      `aevalsrc=0.055*(sin(2*PI*${140 + (i % 4) * 13}*t)+0.2*sin(2*PI*830*t))*exp(-35*t):s=48000:d=0.15,${delay(shot.impact / 60)}[hit${i}]`,
  )
const filter = [
  'aevalsrc=0.045*sin(2*PI*(38*t+1.4*t*t))*sin(PI*t/2.6)^2:s=48000:d=2.6[pressure]',
  'aevalsrc=0.025*(sin(2*PI*1700*t)+0.5*sin(2*PI*2840*t))*(exp(-16*abs(t-0.3))+exp(-16*abs(t-0.62))+exp(-16*abs(t-0.94))):s=48000:d=1.3[chain]',
  ...guns,
  ...impacts,
  `anoisesrc=c=brown:a=0.028:d=3.2:r=48000:seed=54,lowpass=f=650,tremolo=f=14:d=0.7,afade=t=out:st=2.9:d=0.3,${delay(2.6)}[mechanism]`,
  `anoisesrc=c=pink:a=0.022:d=1.7:r=48000:seed=42,lowpass=f=1500,afade=t=out:d=1.7,${delay(5.7)}[smoke]`,
  `aevalsrc=0.13*sin(2*PI*(49*t-5*t*t))*exp(-7*t):s=48000:d=0.8,${delay(6.42)}[fall]`,
  `aevalsrc=0.025*(sin(2*PI*39*t)+0.3*sin(2*PI*77*t))*sin(PI*t/3)^2:s=48000:d=3,${delay(7)}[victory]`,
  `[1:a]volume=0.95,${delay(7)}[announcer]`,
  `[pressure][chain]${guns.map((_, i) => `[gun${i}]`).join('')}${impacts.map((_, i) => `[hit${i}]`).join('')}[mechanism][smoke][fall][victory][announcer]amix=inputs=${guns.length + impacts.length + 7}:normalize=0,afade=t=out:st=9.5:d=0.5,loudnorm=I=-17:TP=-1.5:LRA=11,alimiter=limit=0.94:level=0:latency=1[audio]`,
].join(';')
const destination = path.join(folder, 'Franklin-Fatality-10s-Corrigee.mp4')
const job = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(folder, 'Franklin-Double-Machine-Gun-picture.mp4'),
    '-i',
    path.join(folder, 'fatality-announcer.wav'),
    '-filter_complex',
    filter,
    '-map',
    '0:v',
    '-map',
    '[audio]',
    '-c:v',
    'copy',
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
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Franklin / Double Machine Gun',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
assert.equal((await once(job, 'exit'))[0], 0)
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      nativeShotCount: report.nativeShotCount,
      nativeImpacts: report.nativeBulletImpacts,
      shotTimes: report.shots.map((s) => s.emission / 60),
      firstShotSecond: 2.6,
      nativeDeathSecond: 350 / 60,
      fallSecond: 385 / 60,
      announcementSecond: 7,
      soundDesign:
        'Original fingertip-chain clicks, stereo alternating gunshots and separate body impacts, low firing rumble, fall and smoke tail.',
      announcement: 'Local Daniel system voice, lowered pitch and short echo.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
