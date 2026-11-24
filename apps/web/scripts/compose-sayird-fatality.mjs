import assert from 'node:assert/strict'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
for (const hero of ['sayird']) {
  const label = 'Sayird'
  const folder = path.resolve('output/fighting-sayird')
  await mkdir(folder, { recursive: true })
  const report = JSON.parse(await readFile(path.join(folder, 'cinematic-report.json'), 'utf8'))
  assert.equal(report.hero, hero)
  assert.equal(report.physicalKnockout, true)
  assert.equal(report.impactFrames.length, 6)
  const speech = path.join(folder, 'announcer.aiff')
  if (!existsSync(speech))
    await run('say', ['-v', 'Daniel', '-r', '118', '-o', speech, 'Fatality.'])
  const layers = []
  const delay = (at) => `adelay=${Math.round(at * 1000)}:all=1`
  const add = (label, chain) => layers.push({ label, chain })
  add('room', 'aevalsrc=0.015*(sin(2*PI*47*t)+0.3*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
  add(
    'capture',
    `aevalsrc=0.035*(sin(2*PI*440*t)+0.3*sin(2*PI*880*t))*exp(-6*t):s=48000:d=0.8,${delay(0.5)}`,
  )
  for (let i = 0; i < 12; i++)
    add(
      `insect${i}`,
      `anoisesrc=c=brown:a=0.012:d=0.025:r=48000:seed=${20 + i},highpass=f=1900,afade=t=out:d=0.025,${delay(1.5 + i * 0.11)}`,
    )
  add(
    'sight',
    `anoisesrc=c=pink:a=0.025:d=0.8:r=48000:seed=66,bandpass=f=1200:w=600,afade=t=in:d=0.1,afade=t=out:st=0.55:d=0.25,${delay(2.3)}`,
  )
  add(
    'dodge',
    `anoisesrc=c=pink:a=0.06:d=0.25:r=48000:seed=51,highpass=f=650,afade=t=out:d=0.25,${delay(3.15)}`,
  )
  for (const [i, frame] of report.impactFrames.entries()) {
    const at = frame / 60
    add(
      `swing${i}`,
      `anoisesrc=c=pink:a=0.05:d=0.14:r=48000:seed=${40 + i},highpass=f=950,afade=t=in:d=0.07,afade=t=out:st=0.07:d=0.07,${delay(at - 0.14)}`,
    )
    add(
      `hit${i}`,
      `aevalsrc=${i === report.impactFrames.length - 1 ? 0.3 : 0.2}*sin(2*PI*${90 - i * 9}*t)*exp(-20*t):s=48000:d=0.35,${delay(at)}`,
    )
    add(
      `snap${i}`,
      `anoisesrc=c=brown:a=0.11:d=0.13:r=48000:seed=${70 + i},highpass=f=350,afade=t=out:d=0.13,${delay(at)}`,
    )
  }
  add('land', `aevalsrc=0.16*sin(2*PI*58*t)*exp(-16*t):s=48000:d=0.45,${delay(7.3)}`)
  add(
    'cloth',
    `anoisesrc=c=brown:a=0.035:d=0.35:r=48000:seed=90,highpass=f=300,afade=t=out:d=0.35,${delay(7.3)}`,
  )
  add(
    'announcer',
    `[0:a]asetrate=22050*0.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
  )
  const filter = [
    ...layers.map(({ label, chain }) => `${chain}[${label}]`),
    `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
  ].join(';')
  await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
  const audio = path.join(folder, `${label}-Ton-Angle-Mort-audio.m4a`)
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    speech,
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
  await copyFile(audio, `apps/web/static/clash-victories/${hero}.m4a`)
  const picture = path.join(folder, `${label}-Ton-Angle-Mort-picture.mp4`)
  if (existsSync(picture) && !process.argv.includes('--audio-only'))
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
      path.join(folder, `${label}-Ton-Angle-Mort-10s.mp4`),
    ])
  await writeFile(
    path.join(folder, 'composition.json'),
    JSON.stringify(
      {
        hero,
        duration: 10,
        impactFrames: report.impactFrames,
        announcementSecond: 8.15,
        frenchDialogue: false,
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Saved ${hero} soundtrack: ${audio}\n`)
}
