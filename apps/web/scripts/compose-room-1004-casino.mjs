import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const diary = path.join(root, 'output/room-1004')
const destination = path.join(diary, 'room-1004-ep-04-swamp-ball-tour-tiktok-en.mp4')
const splice = 15
const visionSeconds = 17
const duration = 46

const filter = [
  `[0:v]split[before][after];[before]trim=end=${splice},setpts=PTS-STARTPTS[intro]`,
  `[after]trim=start=${splice},setpts=PTS-STARTPTS[outro]`,
  `[1:v]trim=end=${visionSeconds},setpts=PTS-STARTPTS[laplace]`,
  '[intro][laplace][outro]concat=n=3:v=1:a=0[picture]',
  `[2:a]volume='if(between(t,17,27),0.32,0.75)':eval=frame,afade=t=in:d=0.25,afade=t=out:st=${duration - 1.3}:d=1.3[score]`,
  '[3:a]highpass=f=500,lowpass=f=2200,afade=t=out:d=0.12,adelay=28200:all=1[effect]',
  '[score][effect]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.93:level=0:latency=1[sound]',
].join(';')

const encoder = spawn('ffmpeg', [
  '-hide_banner', '-v', 'error', '-y',
  '-i', path.join(diary, 'room-1004-ep-04-tour-scenes-tiktok-en.mp4'),
  '-i', path.join(diary, 'room-1004-ep-04-laplace-tour-tiktok-en.mp4'),
  '-i', path.join(root, 'Musique/Le dernier jeton.mp3'),
  '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.14:d=0.12:r=48000:seed=420',
  '-filter_complex', filter, '-map', '[picture]', '-map', '[sound]',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k', '-t', String(duration), '-movflags', '+faststart',
  destination,
], { stdio: 'inherit' })
assert.equal((await once(encoder, 'close'))[0], 0, 'Could not compose the casino episode')
process.stdout.write(`${destination}\n`)
