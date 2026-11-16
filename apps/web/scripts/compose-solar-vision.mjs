import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execute = promisify(execFile)
const directory = fileURLToPath(new URL('../../../output/fighting-solar/', import.meta.url))
const report = JSON.parse(await readFile(path.join(directory, 'combat-report.json'), 'utf8'))
const vision = report.solarVision
assert.equal(vision.insetBodyOverlaps, 0, 'The vision inset must leave the real bodies visible')
assert.equal(vision.framingViolations, 0)
assert.equal(vision.realDamage, 0)
assert.ok(vision.predictedDamage > 0)
const enabled = `gte(t,${vision.startSecond})*lt(t,${vision.endSecond})`
const rect = vision.inset
const filter = [
  `[1:v]crop=1920:858:0:76,scale=${rect.width - 4}:${rect.height - 4},pad=${rect.width}:${rect.height}:2:2:color=0x080d15`,
  `drawbox=x=0:y=0:w=iw:h=ih:color=0xff9d75:t=2`,
  `setpts=PTS-STARTPTS+${vision.startSecond}/TB[vision];`,
  `[0:v][vision]overlay=x=${rect.x}:y=${rect.y}:eof_action=pass:repeatlast=0:enable='${enabled}'[output]`,
]
  .join(',')
  .replaceAll(';,', ';')
await writeFile(path.join(directory, 'vision-composition.filter'), filter)
const destination = path.join(directory, 'Feitan-vs-Tserriednich-Vision-de-Laplace.mp4')
await execute(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(directory, 'Feitan-vs-Tserriednich-Rising-Sun.mp4'),
    '-i',
    path.join(directory, 'Feitan-vs-Tserriednich-Rising-Sun-prediction.mp4'),
    '-filter_complex',
    filter,
    '-map',
    '[output]',
    '-map',
    '0:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-t',
    String(report.duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale — Feitan × Tserriednich / La vision de Laplace',
    destination,
  ],
  { maxBuffer: 1024 * 1024 },
)
process.stdout.write(`Saved: ${destination}\n`)
