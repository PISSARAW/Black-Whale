import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-hisoka-victory')
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const preserved = report.victory.startFrame + 270
const original = path.join(folder, 'Hisoka-Le-Dernier-Fil.mp4')
const destination = path.join(folder, 'Hisoka-Le-Dernier-Fil-Corrige.mp4')
async function encode(args) {
  const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(process, 'exit'))[0], 0)
}
await encode([
  '-i',
  original,
  '-i',
  path.join(folder, 'Hisoka-Portrait-Corrige-picture.mp4'),
  '-filter_complex',
  `[0:v]trim=end_frame=${preserved},setpts=PTS-STARTPTS[opening];[1:v]setpts=PTS-STARTPTS[portrait];[opening][portrait]concat=n=2:v=1:a=0[video]`,
  '-map',
  '[video]',
  '-map',
  '0:a',
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
  'copy',
  '-t',
  String(report.duration),
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Black Whale Clash — Hisoka / Le dernier fil / Portrait corrigé',
  destination,
])
await encode([
  '-ss',
  String(report.victory.startSecond),
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
  '-frames:v',
  '600',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-movflags',
  '+faststart',
  path.join(folder, 'Hisoka-Victoire-10s-Corrigee.mp4'),
])
await writeFile(
  path.join(folder, 'portrait-correction.json'),
  JSON.stringify(
    {
      original,
      preservedOpeningFrames: preserved,
      preservedOpeningSeconds: preserved / 60,
      correctedPortraitFrames: report.frameCount - preserved,
      victoryFrames: 600,
      victorySeconds: 10,
      duration: report.duration,
      changes: [
        'Neutral head and chest pose',
        'Symmetric closed lips fitted to the actual skin',
        'Frontal camera without a lateral drift',
      ],
      unchangedAudio: true,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
