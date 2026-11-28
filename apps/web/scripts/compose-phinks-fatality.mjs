import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const folder = fileURLToPath(new URL('../../../output/fighting-phinks-fatality/', import.meta.url))
const track = fileURLToPath(new URL('../static/clash-victories/phinks.m4a', import.meta.url))
const duration = 8

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
  assert.equal(result.status, 0)
}

if (process.argv.includes('--track-only')) {
  const timings = JSON.parse(
    await readFile(
      new URL('../src/lib/fighting/victory/phinksFilmTiming.json', import.meta.url),
      'utf8',
    ),
  )
  await mkdir(folder, { recursive: true })
  const historicalVoice = path.join(folder, 'fatality-announcer.wav')
  const fallbackVoice = path.join(folder, 'phinks-announcer.aiff')
  const fromOriginal = existsSync(historicalVoice)
  if (!fromOriginal && !existsSync(fallbackVoice))
    execFileSync('say', ['-v', 'Daniel', '-r', '118', '-o', fallbackVoice, 'Fatality.'])
  const voiceTreatment = fromOriginal
    ? 'aresample=48000,atempo=1.13'
    : 'asetrate=22050*0.86,aresample=48000,atempo=1.55,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:70:0.16'
  const delay = (frame) => `adelay=${Math.round((frame / 60) * 1000)}:all=1`
  const filter = [
    'aevalsrc=0.113*(sin(2*PI*(36*t+2.5*t*t))+0.32*sin(2*PI*(74*t+5*t*t))+0.15*sin(2*PI*147*t))*sin(PI*t/2.65)^1.6:s=48000:d=2.65[pressure]',
    'aevalsrc=0.042*(sin(2*PI*55*t)+0.85*sin(2*PI*82.41*t)+0.53*sin(2*PI*116.54*t)+0.28*sin(2*PI*164.82*t))*(0.74+0.26*sin(2*PI*11*t))*sin(PI*t/2.72)^1.25:s=48000:d=2.72[score]',
    `anoisesrc=c=pink:a=0.28:d=1.09:r=48000:seed=44,bandpass=f=680:w=1000,afade=t=in:d=0.48,afade=t=out:st=0.72:d=0.36,${delay(10)}[first]`,
    `anoisesrc=c=pink:a=0.34:d=0.89:r=48000:seed=47,bandpass=f=1640:w=1440,afade=t=in:d=0.31,afade=t=out:st=0.68:d=0.20,${delay(timings.firstTurn + 3)}[second]`,
    `anoisesrc=c=brown:a=0.17:d=0.21:r=48000:seed=823,bandpass=f=440:w=610,afade=t=in:d=0.022,afade=t=out:st=0.08:d=0.13,${delay(timings.plant)}[stance]`,
    `anoisesrc=c=pink:a=0.29:d=0.2:r=48000:seed=75,highpass=f=640,lowpass=f=5300,afade=t=in:d=0.1,afade=t=out:st=0.14:d=0.06,${delay(timings.strikeShot + 8)}[punchAir]`,
    `aevalsrc=0.78*(sin(2*PI*(68*t-20*t*t))+0.25*sin(2*PI*(139*t-32*t*t)))*exp(-8*t):s=48000:d=0.76,${delay(timings.contact)}[impact]`,
    `anoisesrc=c=white:a=0.35:d=0.095:r=48000:seed=622,bandpass=f=1610:w=2800,afade=t=out:d=0.092,${delay(timings.contact)}[contact]`,
    `anoisesrc=c=white:a=0.54:d=0.29:r=48000:seed=82,bandpass=f=2100:w=2600,afade=t=out:st=0.008:d=0.28,${delay(timings.floorCrack)}[crack]`,
    `anoisesrc=c=brown:a=0.36:d=1.2:r=48000:seed=555,highpass=f=25,lowpass=f=510,afade=t=out:st=0.14:d=1.05,${delay(timings.floorCrack + 4)}[rubble]`,
    `anoisesrc=c=pink:a=0.35:d=1.42:r=48000:seed=54,highpass=f=340,lowpass=f=3600,tremolo=f=27:d=0.67,afade=t=in:d=0.032,afade=t=out:st=0.32:d=1.08,${delay(timings.fragmentBurst)}[fracture]`,
    `anoisesrc=c=brown:a=0.18:d=0.83:r=48000:seed=37,highpass=f=145,lowpass=f=1250,tremolo=f=15:d=0.88,afade=t=out:st=0.09:d=0.74,${delay(timings.debrisHit)}[settle]`,
    `aevalsrc=0.072*(sin(2*PI*55*t)+0.54*sin(2*PI*82.41*t)+0.35*sin(2*PI*110*t))*sin(PI*t/2.55)^1.45:s=48000:d=2.55,${delay(timings.debrisHit + 25)}[tail]`,
    `anoisesrc=c=pink:a=0.56:d=0.17:r=48000:seed=341,bandpass=f=1420:w=1640,afade=t=out:d=0.16,${delay(timings.parry)}[parry]`,
    `aevalsrc=0.37*sin(2*PI*(126*t-145*t*t))*exp(-21*t):s=48000:d=0.23,${delay(timings.plant)}[heel]`,
    `anoisesrc=c=white:a=0.46:d=0.51:r=48000:seed=820,bandpass=f=2330:w=2800,tremolo=f=19:d=0.78,afade=t=out:st=0.08:d=0.41,${delay(timings.debrisHit + 6)}[gravel]`,
    `[0:a]${voiceTreatment},atrim=duration=1.34,afade=t=out:st=1.24:d=0.10,volume=0.95,${delay(timings.verdict)}[announcer]`,
    '[pressure][score][first][second][stance][punchAir][impact][contact][crack][rubble][fracture][settle][tail][parry][heel][gravel][announcer]amix=inputs=17:normalize=0,apad,loudnorm=I=-16:TP=-1.7:LRA=13:linear=false[audio]',
  ].join(';')
  ffmpeg([
    '-i',
    fromOriginal ? historicalVoice : fallbackVoice,
    '-filter_complex',
    filter,
    '-map',
    '[audio]',
    '-t',
    String(duration),
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-movflags',
    '+faststart',
    track,
  ])
} else {
  const report = JSON.parse(await readFile(path.join(folder, 'cinematic-report.json'), 'utf8'))
  assert.equal(report.duration, duration)
  assert.equal(report.frameCount, 480)
  assert.equal(report.nativeTurns, 6)
  assert.equal(report.finalPunch.move, 'phinks:finisher')
  const destination = path.join(folder, 'Phinks-Fatality-8s.mp4')
  ffmpeg([
    '-i',
    path.join(folder, 'Phinks-Le-dernier-tour-picture.mp4'),
    '-i',
    track,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c',
    'copy',
    '-t',
    String(duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Phinks / Le dernier tour',
    destination,
  ])
  await writeFile(
    path.join(folder, 'composition.json'),
    JSON.stringify(
      {
        duration,
        frameCount: report.frameCount,
        nativeTurns: report.nativeTurns,
        displayedTurns: 2,
        parrySecond: report.victory.parryFrame / 60,
        stepPlantSecond: report.victory.stepPlantFrame / 60,
        impactSecond: report.victory.impactFrame / 60,
        floorCrackSecond: report.victory.floorCrackFrame / 60,
        fragmentBurstSecond: report.victory.fragmentBurstFrame / 60,
        fullyDisintegratedSecond: report.victory.disintegratedFrame / 60,
        debrisHitSecond: report.victory.debrisHitFrame / 60,
        debrisSettleSecond: report.victory.debrisSettleFrame / 60,
        announcementSecond: report.victory.verdictFrame / 60,
        nativePunch: report.finalPunch,
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Saved: ${destination}\n`)
}
