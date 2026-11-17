import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-kurapika-victory')
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const start = report.victory.startSecond
const recall = start + 0.75
const impact = start + 3
const card = start + 1.5
const filter = [
  `[1:a]volume='if(lt(t,${start}),0.85,if(lt(t,${impact}),0.42,if(lt(t,${impact + 0.3}),0.95,0.22)))':eval=frame[game]`,
  `aevalsrc=0.025*sin(2*PI*(800*t+1300*t*t))*sin(PI*t/0.65)^2:s=48000:d=0.65,adelay=${Math.round(recall * 1000)}:all=1[pull]`,
  `aevalsrc=0.30*sin(2*PI*(65*t-12*t*t))*exp(-7*t):s=48000:d=0.8,adelay=${Math.round(impact * 1000)}:all=1[hit]`,
  `aevalsrc=0.09*(sin(2*PI*1800*t)+0.4*sin(2*PI*3250*t))*exp(-28*t):s=48000:d=0.55,adelay=${Math.round(card * 1000)}:all=1[card]`,
  `aevalsrc=0.04*(sin(2*PI*1400*t)+0.35*sin(2*PI*2700*t))*exp(-14*t):s=48000:d=1.0,adelay=${Math.round((start + 4.3) * 1000)}:all=1[settle]`,
  `[game][pull][hit][card][settle]amix=inputs=5:normalize=0,afade=t=in:d=0.3,afade=t=out:st=${report.duration - 0.7}:d=0.7,loudnorm=I=-17:TP=-1.5:LRA=10,alimiter=limit=0.94:level=0:latency=1[audio]`,
].join(';')
const destination = path.join(folder, 'Kurapika-Le-Jugement-Ecarlate.mp4')
const ffmpeg = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(folder, 'Kurapika-Le-Jugement-Ecarlate-picture.mp4'),
    '-i',
    path.join(folder, 'game-audio.wav'),
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
    '-t',
    String(report.duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Kurapika / Le jugement écarlate',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
assert.equal((await once(ffmpeg, 'exit'))[0], 0)
const cinema = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(start),
    '-i',
    destination,
    '-t',
    '10',
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
    path.join(folder, 'Kurapika-Victoire-10s.mp4'),
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
assert.equal((await once(cinema, 'exit'))[0], 0)
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: report.duration,
      victoryStartSecond: start,
      victorySeconds: 10,
      victoryFrames: 600,
      gameAudio: true,
      soundAccents: {
        chainFlight: recall,
        finalStrike: impact,
        chainLock: card,
        chainSettle: start + 4.3,
      },
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
