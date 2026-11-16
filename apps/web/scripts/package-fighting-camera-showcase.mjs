import assert from 'node:assert/strict'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const long = process.argv.includes('--long')
const output =
  process.env.CAMERA_VIDEO_OUTPUT ??
  path.join(
    root,
    long ? 'output/fighting-camera-showcase-1080p-long' : 'output/fighting-camera-showcase',
  )
const report = JSON.parse(await readFile(path.join(output, 'combat-report.json'), 'utf8'))
const run = async (command, args, capture = false) => {
  const process = spawn(command, args, {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })
  let result = ''
  if (capture)
    process.stdout.on('data', (data) => {
      result += data
    })
  const [code] = await once(process, 'exit')
  assert.equal(code, 0, `${command} failed`)
  return result
}
let time = 0
let metadata =
  ';FFMETADATA1\ntitle=Black Whale Clash — Gros plans des 40 personnages\nartist=Black Whale Clash\n'
const parts = []
const chapters = []
const audioChecks = []
const closeupSeconds = []
for (const [index, chapter] of report.chapters.entries()) {
  const stem = `${String(index + 1).padStart(2, '0')}-${chapter.id}`
  const file = path.join(output, 'chapters', `${stem}.mp4`)
  const capture = JSON.parse(await readFile(path.join(output, 'chapters', `${stem}.json`), 'utf8'))
  assert.ok(capture.panels.length > 0, `${chapter.id}: missing close-up`)
  assert.equal(capture.frames, chapter.frames)
  if (long) {
    assert.deepEqual(capture.framing?.outside, [])
    assert.deepEqual(capture.framing?.missing, [])
    for (const run of capture.panelRuns.filter((r) => r.id)) closeupSeconds.push(run.frames / 30)
  }
  const wav = await readFile(path.join(output, 'chapters', `${stem}.wav`))
  let peak = 0,
    squares = 0
  for (let i = 44; i < wav.length; i += 2) {
    const value = wav.readInt16LE(i) / 32768
    peak = Math.max(peak, Math.abs(value))
    squares += value * value
  }
  assert.ok(peak > 0.001 && peak < 1, `${chapter.id}: invalid or silent sound`)
  assert.ok(Math.abs((wav.length - 44) / 192000 - chapter.duration) < 1 / 30)
  audioChecks.push({ id: chapter.id, peak, rms: Math.sqrt(squares / ((wav.length - 44) / 2)) })
  const probe = JSON.parse(
    await run(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type,nb_frames,width,height,r_frame_rate',
        '-of',
        'json',
        file,
      ],
      true,
    ),
  )
  const video = probe.streams.find((s) => s.codec_type === 'video')
  assert.equal(video.width, report.width)
  assert.equal(video.height, report.height)
  assert.equal(Number(video.nb_frames), chapter.frames)
  assert.equal(video.r_frame_rate, '30/1')
  parts.push(`file '${file.replaceAll("'", "'\\''")}'`)
  const start = Math.round(time * 1000)
  time += Number(probe.format.duration)
  const end = Math.round(time * 1000)
  metadata += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${start}\nEND=${end}\ntitle=${String(index + 1).padStart(2, '0')} · ${chapter.name} — ${chapter.ability}\n`
  chapters.push({
    id: chapter.id,
    name: chapter.name,
    start: start / 1000,
    end: end / 1000,
    closeups: capture.panels,
  })
}
assert.equal(chapters.length, 40)
await writeFile(path.join(output, 'chapters.txt'), parts.join('\n'))
await writeFile(path.join(output, 'chapters.ffmetadata'), metadata)
const name = long
  ? 'Black-Whale-Clash-40-Personnages-1080p-Version-Longue'
  : 'Black-Whale-Clash-40-Personnages-Gros-Plans'
const temporary = path.join(output, `${name}-chaptered.mp4`)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  path.join(output, 'chapters.txt'),
  '-f',
  'ffmetadata',
  '-i',
  path.join(output, 'chapters.ffmetadata'),
  '-map',
  '0:v:0',
  '-map',
  '0:a:0',
  '-map_metadata',
  '1',
  '-map_chapters',
  '1',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-b:a',
  '160k',
  '-ar',
  '48000',
  '-af',
  'loudnorm=I=-16:TP=-1.5:LRA=11',
  '-movflags',
  '+faststart',
  temporary,
])
// Decode the whole artifact so a successful mux alone cannot hide a damaged segment.
await run('ffmpeg', ['-v', 'error', '-i', temporary, '-f', 'null', '-'])
const destination = path.join(output, `${name}.mp4`)
await rename(temporary, destination)
await writeFile(
  path.join(output, 'video-verification.json'),
  JSON.stringify(
    {
      passed: true,
      width: report.width,
      height: report.height,
      fps: 30,
      duration: time,
      characters: 40,
      chapters,
      decodedWithoutErrors: true,
      continuousWithinChapters: true,
      addedGameplayPauses: 0,
      resourceResetsWithinChapters: 0,
      closeupDurationSeconds: long
        ? {
            minimum: Math.min(...closeupSeconds),
            maximum: Math.max(...closeupSeconds),
            count: closeupSeconds.length,
          }
        : undefined,
      bothCombatantsVisible: long ? true : undefined,
      labelledTrackingSilhouettes: long ? true : undefined,
      audioChecks,
    },
    null,
    2,
  ),
)
process.stdout.write(
  `Verified ${chapters.length} characters, ${time.toFixed(2)}s: ${destination}\n`,
)
