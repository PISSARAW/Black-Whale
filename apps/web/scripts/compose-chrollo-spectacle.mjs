import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const original = path.resolve('output/fighting-chrollo-victory/Chrollo-La-Derniere-Page.mp4')
const folder = path.resolve('output/fighting-chrollo-spectacle')
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const before = JSON.parse(
  await readFile('output/fighting-chrollo-victory/combat-report.json', 'utf8'),
)
assert.deepEqual(report.audit, before.audit)
assert.deepEqual(report.finalHealth, before.finalHealth)
assert.equal(report.winner, before.winner)
const start = report.victory.startSecond,
  shock = start + 3
const delay = (second) => `adelay=${Math.round(second * 1000)}:all=1`
const filter = [
  `[0:v]trim=end_frame=${report.victory.startFrame},setpts=PTS-STARTPTS[opening]`,
  '[1:v]setpts=PTS-STARTPTS[ending]',
  '[opening][ending]concat=n=2:v=1:a=0[video]',
  `[0:a]volume='if(lt(t,${start}),1,if(lt(t,${shock - 0.25}),.16,if(lt(t,${shock}),.025,.13)))':eval=frame[game]`,
  `aevalsrc=0.055*sin(2*PI*(48*t+10*t*t))*sin(PI*t/2.2)^2:s=48000:d=2.2,${delay(start + 0.55)}[tension]`,
  `anoisesrc=c=brown:a=0.032:d=1.6:r=48000:seed=77,highpass=f=650,afade=t=out:st=1.2:d=0.4,${delay(start + 1.25)}[pages]`,
  `aevalsrc=0.19*(sin(2*PI*930*t)+0.4*sin(2*PI*1830*t))*exp(-85*t):s=48000:d=0.14,${delay(shock)}[clack]`,
  `aevalsrc=0.36*sin(2*PI*(63*t-9*t*t))*exp(-4.5*t):s=48000:d=1.6,${delay(shock)}[thud]`,
  `anoisesrc=c=pink:a=0.15:d=1.8:r=48000:seed=18,lowpass=f=1600,afade=t=out:st=0.2:d=1.6,${delay(shock)}[fire]`,
  `anoisesrc=c=white:a=0.025:d=1.2:r=48000:seed=38,highpass=f=2400,afade=t=out:st=0.05:d=1.15,${delay(shock + 0.15)}[debris]`,
  ...[5.25, 5.75, 6.25, 6.75].map(
    (t, i) =>
      `aevalsrc=0.065*sin(2*PI*125*t)*exp(-45*t):s=48000:d=0.18,${delay(start + t)}[step${i}]`,
  ),
  `[game][tension][pages][clack][thud][fire][debris][step0][step1][step2][step3]amix=inputs=11:normalize=0,afade=t=out:st=${report.duration - 0.6}:d=0.6,loudnorm=I=-17:TP=-1.5:LRA=10,alimiter=limit=0.94:level=0:latency=1[audio]`,
].join(';')
async function run(args) {
  const task = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(task, 'exit'))[0], 0)
}
const destination = path.join(folder, 'Chrollo-La-Derniere-Page-Spectaculaire.mp4')
await run([
  '-i',
  original,
  '-i',
  path.join(folder, 'Chrollo-Spectacle-picture.mp4'),
  '-filter_complex',
  filter,
  '-map',
  '[video]',
  '-map',
  '[audio]',
  '-c:v',
  'libx264',
  '-preset',
  'fast',
  '-crf',
  '17',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '60',
  '-frames:v',
  String(report.frameCount),
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-t',
  String(report.duration),
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Black Whale Clash — Chrollo / La dernière page / Mise en scène renforcée',
  destination,
])
await run([
  '-ss',
  String(start),
  '-i',
  destination,
  '-t',
  '10',
  '-frames:v',
  '600',
  '-c:v',
  'libx264',
  '-preset',
  'fast',
  '-crf',
  '17',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-movflags',
  '+faststart',
  path.join(folder, 'Chrollo-Victoire-Spectaculaire-10s.mp4'),
])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      original,
      preservedOpeningFrames: report.victory.startFrame,
      duration: report.duration,
      victoryFrames: 600,
      victorySeconds: 10,
      bookClosureSecond: shock,
      explosionSecond: shock,
      unchangedNativeOutcome: true,
      footstepSeconds: [5.25, 5.75, 6.25, 6.75].map((t) => start + t),
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
