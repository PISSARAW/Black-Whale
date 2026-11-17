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
for (const hero of process.argv.includes('--furykov-only') ? ['furykov'] : ['longhi', 'furykov']) {
  const label = hero === 'longhi' ? 'Longhi' : 'Furykov'
  const folder = path.resolve('output/fighting-personal-guard', hero)
  await mkdir(folder, { recursive: true })
  const report = JSON.parse(await readFile(path.join(folder, 'cinematic-report.json'), 'utf8'))
  assert.equal(report.hero, hero)
  assert.equal(report.physicalKnockout, true)
  assert.equal(report.impactFrames.length, hero === 'furykov' ? 3 : 5)
  const speech = path.join(folder, 'announcer.aiff')
  if (!existsSync(speech))
    await run('say', ['-v', 'Daniel', '-r', '118', '-o', speech, 'Fatality.'])
  const layers = []
  const delay = (at) => `adelay=${Math.round(at * 1000)}:all=1`
  const add = (label, chain) => layers.push({ label, chain })
  add('room', 'aevalsrc=0.015*(sin(2*PI*47*t)+0.3*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
  if (hero === 'longhi') {
    for (const [i, at] of [0.7, 1.0, 1.8, 2.1].entries())
      add(
        `pen${i}`,
        `anoisesrc=c=white:a=0.022:d=0.18:r=48000:seed=${14 + i},highpass=f=2500,lowpass=f=4500,afade=t=out:d=0.18,${delay(at)}`,
      )
    add(
      'pact',
      `aevalsrc=0.06*(sin(2*PI*660*t)+0.3*sin(2*PI*990*t))*exp(-9*t):s=48000:d=0.6,${delay(2.4)}`,
    )
    add(
      'zetsu',
      `anoisesrc=c=pink:a=0.08:d=0.5:r=48000:seed=61,lowpass=f=1700,afade=t=out:d=0.5,${delay(3.2)}`,
    )
  } else {
    for (const [i, at] of [0.3, 0.6, 1.0].entries())
      add(`key${i}`, `aevalsrc=0.025*sin(2*PI*1100*t)*exp(-90*t):s=48000:d=0.08,${delay(at)}`)
    add(
      'ready',
      `aevalsrc=0.04*(sin(2*PI*660*t)+0.4*sin(2*PI*990*t))*exp(-10*t):s=48000:d=0.4,${delay(1.5)}`,
    )
    add(
      'draw',
      `anoisesrc=c=pink:a=0.05:d=0.6:r=48000:seed=46,highpass=f=1800,afade=t=in:d=0.1,afade=t=out:st=0.35:d=0.25,${delay(2.1)}`,
    )
    add(
      'parry',
      `aevalsrc=0.09*(sin(2*PI*1300*t)+0.5*sin(2*PI*1890*t))*exp(-13*t):s=48000:d=0.3,${delay(3.6)}`,
    )
    add(
      'lid',
      `anoisesrc=c=brown:a=0.04:d=0.1:r=48000:seed=32,highpass=f=900,afade=t=out:d=0.1,${delay(1.9)}`,
    )
  }
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
  const audio = path.join(folder, `${label}-Personal-Victory-audio.m4a`)
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
  const picture = path.join(folder, `${label}-Fatality-Personnelle-picture.mp4`)
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
      path.join(folder, `${label}-Fatality-Personnelle-10s.mp4`),
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
