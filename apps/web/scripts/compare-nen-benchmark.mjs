import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
const [before, after, output] = process.argv.slice(2)
assert.ok(before && after && output, 'Expected before directory, after directory, output directory')
await mkdir(output, { recursive: true })
for (const dir of [before, after]) {
  const report = JSON.parse(await readFile(path.join(dir, 'combat-report.json'), 'utf8'))
  assert.equal(report.fps, 60)
  assert.equal(report.speed, 1)
  assert.deepEqual(report.errors, [])
  assert.equal(report.bouts.length, 3)
  assert.ok(report.bouts.every((bout) => bout.verified && bout.frames === 720))
}
async function encode(args) {
  const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
  const [code] = await once(process, 'exit')
  assert.equal(code, 0)
}
for (let i = 1; i <= 3; i++) {
  await encode([
    '-i',
    path.join(before, `bout-${i}.mp4`),
    '-i',
    path.join(after, `bout-${i}.mp4`),
    '-filter_complex',
    '[0:v][1:v]hstack=inputs=2[v]',
    '-map',
    '[v]',
    '-map',
    '1:a',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    path.join(output, `comparison-${i}.mp4`),
  ])
}
const list = path.join(output, 'concat.txt')
await writeFile(
  list,
  [1, 2, 3].map((i) => `file '${path.resolve(output, `comparison-${i}.mp4`)}'`).join('\n'),
)
await encode([
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  list,
  // AAC padding at a chapter boundary must not introduce a gap in the video clock.
  '-vf',
  'setpts=N/(60*TB)',
  '-r',
  '60',
  '-fps_mode',
  'cfr',
  '-c:v',
  'libx264',
  '-preset',
  'fast',
  '-crf',
  '18',
  '-pix_fmt',
  'yuv420p',
  '-af',
  'atrim=duration=36,asetpts=PTS-STARTPTS',
  '-c:a',
  'aac',
  '-b:a',
  '160k',
  '-movflags',
  '+faststart',
  path.join(output, 'nen-avant-apres-60fps.mp4'),
])
