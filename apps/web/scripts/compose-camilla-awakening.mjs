import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const original = path.resolve(
  'output/fighting-cats-grip/Chrollo-vs-Camilla-Prise-et-Resurrection.mp4',
)
const output = path.resolve('output/fighting-cats-awakening')
const report = JSON.parse(await readFile(path.join(output, 'combat-report.json'), 'utf8'))
const earlier = JSON.parse(await readFile('output/fighting-cats-grip/combat-report.json', 'utf8'))
const track = report.spectacle
assert.deepEqual(report.storyEvents, earlier.storyEvents)
assert.deepEqual(report.contactsBySide, earlier.contactsBySide)
assert.equal(report.confirmedCombos, earlier.confirmedCombos)
const victory = track.shots.find((shot) => shot.kind === 'victory').frame
const startFrame = victory - 32
const eyeFrame = victory + 12
assert.equal(startFrame, 2265)
const shock = eyeFrame / 60
const filter = [
  `[0:v]trim=end_frame=${startFrame},setpts=PTS-STARTPTS[opening]`,
  '[1:v]setpts=PTS-STARTPTS[portrait]',
  '[opening][portrait]concat=n=2:v=1:a=0[video]',
  `[0:a]volume='if(lt(t,37.55),1,if(lt(t,37.75),1-(t-37.55)*4.6,if(lt(t,${shock}),0.08,if(lt(t,${shock + 0.18}),0.65+(t-${shock})*1.944444,1))))':eval=frame[quiet]`,
  `aevalsrc=0.2*sin(2*PI*(58*t-9*t*t))*exp(-6*t):s=48000:d=1.1,adelay=${Math.round(shock * 1000)}:all=1[heartbeat]`,
  '[quiet][heartbeat]amix=inputs=2:normalize=0,alimiter=limit=0.94:level=0:latency=1[audio]',
].join(';')
const destination = path.join(output, 'Chrollo-vs-Camilla-Reveil-Dramatique.mp4')
const process = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    original,
    '-i',
    path.join(output, 'Chrollo-vs-Camilla-Reveil-Dramatique-picture.mp4'),
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
    String(track.frameCount),
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-t',
    String(track.duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale — Camilla / Le réveil',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
const [code] = await once(process, 'exit')
assert.equal(code, 0)
await writeFile(
  path.join(output, 'composition.json'),
  JSON.stringify(
    {
      original,
      preservedOpeningFrames: startFrame,
      preservedOpeningSeconds: startFrame / 60,
      frameCount: track.frameCount,
      duration: track.duration,
      eyeOpeningFrame: eyeFrame,
      eyeOpeningSecond: shock,
      faceAuraMultiplier: 0.08,
      facialAuraRemoved: true,
      audio:
        'Existing soundtrack preserved through the combos and capture; a short hush and low heartbeat accompany the sudden opening of the eyes.',
    },
    null,
    2,
  ),
)
globalThis.process.stdout.write(`Saved: ${destination}\n`)
