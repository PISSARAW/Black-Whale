import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const original = path.resolve('output/fighting-kurapika-victory/Kurapika-Le-Jugement-Ecarlate.mp4')
const folder = path.resolve('output/fighting-kurapika-fatality')
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const before = JSON.parse(
  await readFile('output/fighting-kurapika-victory/combat-report.json', 'utf8'),
)
assert.deepEqual(report.audit, before.audit)
assert.deepEqual(report.finalHealth, before.finalHealth)
assert.equal(report.winner, before.winner)
const start = report.victory.startSecond
const delay = (second) => `adelay=${Math.round(second * 1000)}:all=1`
const filter = [
  `[0:v]trim=end_frame=${report.victory.startFrame},setpts=PTS-STARTPTS[opening]`,
  '[1:v]setpts=PTS-STARTPTS[ending]',
  '[opening][ending]concat=n=2:v=1:a=0[video]',
  `[0:a]volume='if(lt(t,${start}),1,0)':eval=frame[game]`,
  `aevalsrc=0.04*sin(2*PI*(43*t+4*t*t))*sin(PI*t/4.1)^2:s=48000:d=4.1,${delay(start)}[tension]`,
  `anoisesrc=c=brown:a=0.018:d=4.0:r=48000:seed=22,lowpass=f=480,afade=t=out:st=3.6:d=0.4,${delay(start)}[air]`,
  `aevalsrc=0.06*(sin(2*PI*1700*t)+0.5*sin(2*PI*2940*t))*exp(-16*t):s=48000:d=0.8,${delay(start + 1.5)}[lock]`,
  `aevalsrc=0.035*sin(2*PI*(640*t+25*sin(14*t)))*(0.6+0.4*sin(23*t)):s=48000:d=1.6,afade=t=out:st=1.3:d=0.3,${delay(start + 2.5)}[strain]`,
  `anoisesrc=c=white:a=0.14:d=0.12:r=48000:seed=75,lowpass=f=2500,afade=t=out:d=0.12,${delay(start + 4.25)}[crack]`,
  `aevalsrc=0.32*sin(2*PI*(58*t-6*t*t))*exp(-6*t):s=48000:d=1.1,${delay(start + 5.5)}[slam]`,
  `anoisesrc=c=pink:a=0.08:d=0.7:r=48000:seed=90,lowpass=f=1800,afade=t=out:d=0.7,${delay(start + 5.5)}[dust]`,
  `aevalsrc=0.065*(sin(2*PI*1850*t)+0.3*sin(2*PI*3500*t))*exp(-12*t):s=48000:d=0.8,${delay(start + 5.8)}[steel]`,
  `[2:a]volume=0.9,${delay(start + 6.65)}[announcer]`,
  `[game][tension][air][lock][strain][crack][slam][dust][steel][announcer]amix=inputs=10:normalize=0,afade=t=out:st=${report.duration - 0.45}:d=0.45,loudnorm=I=-17:TP=-1.5:LRA=10,alimiter=limit=0.94:level=0:latency=1[audio]`,
].join(';')
async function encode(args) {
  const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const destination = path.join(folder, 'Kurapika-Le-Jugement-Fatal.mp4')
await encode([
  '-i',
  original,
  '-i',
  path.join(folder, 'Kurapika-Fatality-picture.mp4'),
  '-i',
  path.join(folder, 'fatality-announcer.wav'),
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
  'title=Black Whale Clash — Kurapika / Le jugement fatal',
  destination,
])
await encode([
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
  path.join(folder, 'Kurapika-Fatality-10s.mp4'),
])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      original,
      preservedOpeningFrames: report.victory.startFrame,
      duration: report.duration,
      victorySeconds: 10,
      victoryFrames: 600,
      unchangedNativeOutcome: true,
      soundCues: {
        lock: start + 1.5,
        tensionSnap: start + 4.25,
        floorSlam: start + 5.5,
        announcer: start + 6.65,
      },
      announcement:
        'Local synthesized Daniel voice, lowered pitch and short echo; original sound design.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
