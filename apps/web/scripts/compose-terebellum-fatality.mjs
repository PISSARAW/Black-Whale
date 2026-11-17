import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-terebellum-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['terebellum-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.021*(sin(2*PI*43*t)+0.3*sin(2*PI*71*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [1.45, 3.65, 5.45].entries())
  add(
    `swing${i}`,
    `anoisesrc=c=pink:a=0.08:d=0.5:r=48000:seed=${33 + i},highpass=f=850,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.2,${delay(at)}`,
  )
for (const [i, at] of [2, 4, 6].entries()) {
  add(`hit${i}`, `aevalsrc=0.19*sin(2*PI*${85 - i * 15}*t)*exp(-22*t):s=48000:d=0.35,${delay(at)}`)
  add(
    `cut${i}`,
    `anoisesrc=c=brown:a=0.16:d=0.14:r=48000:seed=${62 + i},highpass=f=650,afade=t=out:d=0.14,${delay(at)}`,
  )
}
add(
  'tin',
  `aevalsrc=0.12*(sin(2*PI*1267*t)+0.5*sin(2*PI*2063*t))*exp(-12*t):s=48000:d=0.8,${delay(2)}`,
)
add(
  'crumple',
  `anoisesrc=c=white:a=0.08:d=0.4:r=48000:seed=98,highpass=f=2200,lowpass=f=5500,afade=t=out:d=0.4,${delay(2)}`,
)
add(
  'withdraw',
  `anoisesrc=c=pink:a=0.065:d=0.35:r=48000:seed=71,highpass=f=600,afade=t=in:d=0.08,afade=t=out:st=0.08:d=0.27,${delay(3.2)}`,
)
add(
  'grip',
  `anoisesrc=c=brown:a=0.07:d=0.25:r=48000:seed=87,highpass=f=700,afade=t=out:d=0.25,${delay(3.9)}`,
)
add('land', `aevalsrc=0.2*sin(2*PI*68*t)*exp(-16*t):s=48000:d=0.4,${delay(6.95)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.07:d=0.4:r=48000:seed=93,highpass=f=250,afade=t=out:d=0.4,${delay(6.95)}`,
)
add(
  'sip',
  `anoisesrc=c=pink:a=0.025:d=0.55:r=48000:seed=45,highpass=f=800,lowpass=f=1900,afade=t=in:d=0.2,afade=t=out:st=0.35:d=0.2,${delay(7.95)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Terebellum-Retour-a-l-Envoyeur-audio.m4a')
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  ...speeches.flatMap(([name]) => ['-i', path.join(folder, `${name}.aiff`)]),
  '-filter_complex',
  filter,
  '-map',
  '[audio]',
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
  audio,
])
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', audio],
    { encoding: 'utf8' },
  ),
)
assert.equal(Number(probe.format.duration), 10)
await copyFile(audio, 'apps/web/static/clash-victories/terebellum.m4a')
const picture = path.join(folder, 'Terebellum-Retour-a-l-Envoyeur-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only')) {
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    picture,
    '-i',
    audio,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c',
    'copy',
    '-t',
    '10',
    '-movflags',
    '+faststart',
    path.join(folder, 'Terebellum-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      canTransferSecond: 2,
      chestTransferSecond: 4,
      finalTransferSecond: 6,
      fallSecond: 6.95,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Terebellum soundtrack: ${audio}\n`)
