import { inspectCatsSpectacle } from './showcase-cats-inspection.mjs'
import { validateCatsReport } from './showcase-cats-validation.mjs'
import { validateJudgmentReport } from './showcase-judgment-validation.mjs'
import { validateSolarReport } from './showcase-solar-validation.mjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const still = process.argv.includes('--cats-still')
const faceOnly = still || process.argv.includes('--cats-face')
const grip = faceOnly || process.argv.includes('--cats-grip')
const spectacle = grip || process.argv.includes('--cats-spectacle')
const cats = spectacle || process.argv.includes('--cats')
const judgment = process.argv.includes('--judgment')
const solar = process.argv.includes('--solar')
const manga = process.argv.includes('--manga')
const longForm = process.argv.includes('--ballroom-long')
const ballroom = longForm || process.argv.includes('--ballroom')
const cinematic =
  cats || judgment || solar || ballroom || manga || process.argv.includes('--cinematic')
const continuous = cinematic || process.argv.includes('--continuous')
const output =
  process.env.FIGHT_SHOWCASE_OUTPUT ??
  path.resolve(
    root,
    `../../output/${still ? 'fighting-cats-still' : faceOnly ? 'fighting-cats-awakening' : grip ? 'fighting-cats-grip' : cats ? 'fighting-cats-name' : judgment ? 'fighting-judgment' : solar ? 'fighting-solar' : longForm ? 'fighting-ballroom-long' : ballroom ? 'fighting-ballroom' : manga ? 'fighting-manga' : cinematic ? 'fighting-cinematic' : continuous ? 'fighting-continuous' : 'fighting-showcase'}`,
  )
const inspect = process.argv.includes('--inspect')
const predictionOnly = process.argv.includes('--prediction-only')
const pictureOnly = predictionOnly || process.argv.includes('--picture-only')
const audioOnly = process.argv.includes('--audio-only')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    {
      name: 'showcase-scene-diagnostics',
      enforce: 'pre',
      transform(code, id) {
        if (solar && id.endsWith('/futureBeastScene.ts'))
          return code
            .replace("future.owner !== 'player' || ", '')
            .replace('const owner = state.player', 'const owner = state[future.owner]')
        if (ballroom && id.endsWith('/benjaminEffectScene.ts'))
          return code.replace(
            "side === 'player' && Boolean(activeNen && target)",
            'Boolean(activeNen && target)',
          )
        if (id.endsWith('/FightScene.svelte'))
          return code.replace(
            '} catch {\n        failed = true',
            '} catch (error) { console.error(error);\n        failed = true',
          )
      },
    },
    svelte({ configFile: false }),
  ],
  optimizeDeps: { entries: ['demos/fighting-showcase/index.html'], holdUntilCrawlEnd: false },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
let encoder
const errors = []
try {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(chrome) ? chrome : undefined),
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(error.message + '\n')
  })
  page.on('console', (event) => {
    if (event.type() === 'error') process.stderr.write(event.text() + '\n')
  })
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/${continuous ? '?continuous=1' : ''}${cinematic ? '&cinematic=1' : ''}${manga ? '&manga=1' : ''}${ballroom ? '&ballroom=1' : ''}${longForm ? '&long=1' : ''}${solar ? '&solar=1' : ''}${judgment ? '&judgment=1' : ''}${cats ? '&cats=1' : ''}${spectacle ? '&spectacle=1' : ''}${still ? '&still=1' : ''}`,
    {
      waitUntil: 'domcontentloaded',
    },
  )
  await page.waitForFunction(() => window.fightingShowcase?.ready())
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  const report = await page.evaluate(() => window.fightingShowcase.report())
  const fps = report.fps
  await writeFile(path.join(output, 'combat-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify(
      {
        duration: report.duration,
        apparentKnockoutSecond: report.apparentKnockoutSecond,
        contactsBySide: report.contactsBySide,
        catFrames: report.catFrames,
        storyEvents: report.storyEvents,
        emptyStrikes: report.emptyStrikes,
        simultaneousOnSeconds: report.simultaneousOnSeconds,
        bothOnAtVictory: report.bothOnAtVictory,
        solarEvents: report.solarEvents,
        solarVision: report.solarVision,
        predictedHealth: report.predictedHealth,
        solarDamageTaken: report.solarDamageTaken,
        divergenceFrames: report.divergenceFrames,
        techniques: report.techniques,
        combos: report.maxCombo,
        continuity: report.continuity,
        confirmedCombos: report.confirmedCombos,
        impactCount: report.impactCount,
        maxIdleSeconds: report.maxIdleSeconds,
        finalAura: report.finalAura,
        finalHealth: report.finalHealth,
        camera: report.camera ? { ...report.camera, cues: undefined } : undefined,
        onEvents: report.onEvents,
        techniquesBySide: report.techniquesBySide,
        initialRen: report.initialRen,
        emperorTimeAtVictory: report.emperorTimeAtVictory,
        abilityEvents: report.abilityEvents,
        holyChainHeals: report.holyChainHeals,
        failedCommands: report.audit.filter((event) => event.kind === 'command' && !event.accepted),
        effects: report.audit.filter((event) =>
          ['gum-attached', 'texture-surprise', 'sun-moon-detonation', 'black-voice'].includes(
            event.kind,
          ),
        ),
      },
      null,
      2,
    ) + '\n',
  )
  const cuts = continuous
    ? Array.from({ length: 8 }, (_, index) => ({ second: (index * report.duration) / 8 }))
    : report.audit.filter((event) => event.kind === 'cut')
  if (cinematic) {
    assert.equal(
      report.camera.framingViolations,
      0,
      'Both fighters must remain inside the safe frame',
    )
    assert.ok(report.camera.maximumDollyStep < 0.06, 'The camera must move continuously')
    assert.ok(
      report.camera.cueCount >= (cats ? 15 : solar ? 12 : 25),
      'Combos and Hatsu must trigger camera cues',
    )
  }
  for (let index = 0; index < cuts.length; index++) {
    await page.evaluate(
      (frame) => window.fightingShowcase.seek(frame),
      Math.round((cuts[index].second + 2.8) * fps),
    )
    await page.clock.runFor(100)
    await page.screenshot({
      path: path.join(output, `chapter-${index}.jpg`),
      type: 'jpeg',
      quality: 90,
    })
  }
  if (longForm) {
    for (const [index, shot] of report.closeups.shots.entries()) {
      await page.evaluate(
        (frame) => window.fightingShowcase.seek(frame),
        Math.round((shot.second + 0.2) * fps),
      )
      await page.clock.runFor(100)
      await page.screenshot({
        path: path.join(output, `detail-${index}.jpg`),
        type: 'jpeg',
        quality: 94,
      })
    }
  }
  if (solar) {
    for (const event of report.solarEvents.filter((e) =>
      [
        'pain-packer-equipped',
        'laplace-vision',
        'laplace-diverging',
        'rising-sun-expired',
      ].includes(e.kind),
    )) {
      await page.evaluate(
        (frame) => window.fightingShowcase.seek(frame),
        Math.round((event.second + 0.12) * fps),
      )
      await page.clock.runFor(100)
      await page.screenshot({
        path: path.join(output, `${event.kind}.jpg`),
        type: 'jpeg',
        quality: 94,
      })
    }
  }
  if ((judgment || cats) && !spectacle) {
    for (const [index, event] of report.storyEvents.entries()) {
      await page.evaluate(
        (frame) => window.fightingShowcase.seek(frame),
        Math.round((event.second + 0.1) * fps),
      )
      await page.clock.runFor(100)
      await page.screenshot({
        path: path.join(output, `power-${index}-${event.kind}.jpg`),
        type: 'jpeg',
        quality: 94,
      })
    }
  }
  if (spectacle) await inspectCatsSpectacle(page, { report, output })
  if (inspect) process.stdout.write(`Inspection: ${output}\n`)
  else {
    if (cats) validateCatsReport(report)
    else if (judgment) validateJudgmentReport(report)
    else if (solar) validateSolarReport(report)
    else {
      for (const technique of ballroom
        ? ['ten', 'ren', 'ken', 'ryu', 'ko', 'on']
        : ['ten', 'ren', 'zetsu', 'gyo', 'ken', 'ryu', 'ko', 'in', 'en', 'shu'])
        assert.ok(report.techniques.includes(technique), `Technique absent: ${technique}`)
      assert.ok(
        report.maxCombo.player >= 2 && report.maxCombo.opponent >= 2,
        'Both fighters must land real combos',
      )
      for (const effect of ballroom
        ? [
            'secret-window-mark',
            'culdcept-replay',
            'holy-chain-heal',
            'steal-chain-complete',
            'stealth-dolphin-loaded',
            'judgment-chain-attached',
          ]
        : ['gum-attached', 'texture-surprise', 'sun-moon-detonation', 'black-voice'])
        assert.ok(
          report.audit.some((event) => event.kind === effect),
          `Effect absent: ${effect}`,
        )
      assert.ok(
        report.audit.every((event) => event.kind !== 'command' || event.accepted),
        'A choreographed command was rejected',
      )
      assert.ok(
        report.audit.some((event) => event.kind === 'impact' && event.critical),
        'Ko must land a critical strike',
      )
      assert.ok(
        report.audit.some(
          (event) =>
            event.kind === 'impact' &&
            event.move === `${ballroom ? 'kurapika' : manga ? 'chrollo' : 'hisoka'}:finisher`,
        ),
        'The final elastic execution must land',
      )
      assert.deepEqual(errors, [])
      if (continuous) {
        assert.equal(report.continuity.resets, 0)
        assert.equal(report.continuity.backwards, false)
        if (!ballroom) assert.equal(report.continuity.healed, false)
        assert.ok(
          report.confirmedCombos >= (longForm ? 18 : ballroom ? 6 : 16),
          'Confirmed combos must remain in the sequence',
        )
        assert.ok(
          report.impactCount >= (ballroom ? 28 : 50),
          'Actual contacts must remain in the sequence',
        )
        if (!ballroom) assert.ok(report.maxIdleSeconds < 1, 'No long simultaneous idle')
        assert.equal(
          manga ? report.finalHealth.player : report.finalHealth.opponent,
          0,
          'The uninterrupted match must reach its final knockout',
        )
      }
      if (manga) {
        assert.ok(report.techniques.includes('on'), 'On must actually activate')
        for (const kind of ['on-oath', 'on-seal', 'on-ken-block', 'on-collapse'])
          assert.ok(
            report.onEvents.some((event) => event.kind === kind),
            `Strategy must execute: ${kind}`,
          )
        assert.ok(
          report.sunTrapAgeSeconds > 15,
          'The final explosion must use the original persistent Sun mark',
        )
      }
      if (ballroom) {
        assert.ok(report.initialRen && report.emperorTimeAtVictory)
        for (const side of ['player', 'opponent'])
          assert.ok(
            report.audit.some((e) => e.kind === 'impact' && e.attacker === side && e.critical),
            `${side} must land Ko`,
          )
        assert.ok(
          report.audit.some(
            (e) => e.kind === 'impact' && e.move === 'benjamin:neutralSpecial' && e.damage > 0,
          ),
          'Air Blow must actually hit',
        )
        for (const side of ['player', 'opponent'])
          for (const technique of ['ren', 'ten', 'ken', 'ko', 'ryu', 'on'])
            assert.ok(
              report.techniquesBySide[side].includes(technique),
              `${side} must use ${technique}`,
            )
        assert.ok(
          report.holyChainHeals.length > 0 &&
            report.holyChainHeals.every((heal) => heal.move === 'kurapika:downSpecial'),
        )
        assert.ok(
          !report.moves.includes('kurapika:neutralSpecial'),
          'Chain Jail cannot be used on Benjamin',
        )
      }
      if (longForm) {
        assert.ok(report.duration >= 80 && report.duration <= 120)
        assert.ok(report.rangeVolleys.length >= 6 && report.rangeFrames >= 400)
        assert.ok(report.closeups.simultaneous && report.closeups.eyeSeconds >= 2)
        assert.ok(report.closeups.chainSeconds >= 6)
        assert.ok(report.closeups.shots.some((shot) => shot.kind === 'seal'))
      }
    }
    if (!pictureOnly) {
      process.stdout.write('Rendering original game audio…\n')
      const audio = await page.evaluate(() => window.fightingShowcase.audio())
      await writeFile(path.join(output, 'game-audio.wav'), Buffer.from(audio, 'base64'))
    }
    if (audioOnly) process.stdout.write(`Audio saved: ${output}\n`)
    else {
      let destination = path.join(
        output,
        cats
          ? spectacle
            ? grip
              ? faceOnly
                ? still
                  ? 'Chrollo-vs-Camilla-Le-Souffle.mp4'
                  : 'Chrollo-vs-Camilla-Reveil-Dramatique.mp4'
                : 'Chrollo-vs-Camilla-Prise-et-Resurrection.mp4'
              : 'Chrollo-vs-Camilla-Cat-s-Name-Spectaculaire.mp4'
            : 'Chrollo-vs-Camilla-Nen-Post-Mortem.mp4'
          : judgment
            ? 'Mizaistom-vs-Biscuit-Duel-Strategique.mp4'
            : solar
              ? 'Feitan-vs-Tserriednich-Rising-Sun.mp4'
              : longForm
                ? 'Kurapika-vs-Benjamin-Version-Longue.mp4'
                : ballroom
                  ? 'Kurapika-vs-Benjamin-Salle-de-Bal.mp4'
                  : manga
                    ? 'Hisoka-vs-Chrollo-Duel-Strategique.mp4'
                    : cinematic
                      ? 'Hisoka-vs-Chrollo-Camera-Cinema.mp4'
                      : continuous
                        ? 'Hisoka-vs-Chrollo-Combat-Continu.mp4'
                        : 'Hisoka-vs-Chrollo-Tour-Celeste.mp4',
      )
      if (pictureOnly)
        destination = destination.replace(
          '.mp4',
          predictionOnly ? '-prediction.mp4' : '-picture.mp4',
        )
      encoder = spawn(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-y',
          '-f',
          'image2pipe',
          '-vcodec',
          'mjpeg',
          '-framerate',
          String(fps),
          '-i',
          'pipe:0',
          ...(pictureOnly ? [] : ['-i', path.join(output, 'game-audio.wav')]),
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '18',
          '-pix_fmt',
          'yuv420p',
          ...(pictureOnly
            ? []
            : [
                '-c:a',
                'aac',
                '-b:a',
                '192k',
                '-ar',
                '48000',
                '-af',
                `afade=t=in:d=0.5,afade=t=out:st=${report.duration - 1.5}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11`,
              ]),
          '-movflags',
          '+faststart',
          '-shortest',
          '-metadata',
          cats
            ? 'title=Black Whale — Chrollo × Camilla / Nen post mortem'
            : judgment
              ? 'title=Black Whale — Mizaistom × Biscuit / Duel stratégique'
              : solar
                ? 'title=Black Whale — Feitan × Tserriednich / Rising Sun'
                : ballroom
                  ? 'title=Black Whale — Kurapika × Benjamin / Salle de bal'
                  : 'title=Black Whale — Hisoka × Chrollo / Tour céleste',
          destination,
        ],
        { stdio: ['pipe', 'inherit', 'inherit'] },
      )
      const finished = once(encoder, 'exit')
      const count = await page.evaluate(() => window.fightingShowcase.count())
      const startFrame = faceOnly
        ? report.spectacle.shots.find((shot) => shot.kind === 'victory').frame - 32
        : spectacle
          ? report.spectacle.startFrame
          : predictionOnly
            ? report.solarVision.startFrame
            : 0
      const endFrame = still
        ? startFrame + 90
        : predictionOnly
          ? report.solarVision.endFrame
          : count
      // Warm the camera at the first shot before starting the output clock.
      await page.evaluate(
        ({ frame, predicted }) => window.fightingShowcase.seek(frame, predicted),
        { frame: startFrame, predicted: predictionOnly },
      )
      await page.clock.runFor(1200)
      for (let frame = startFrame; frame < endFrame; frame++) {
        await page.evaluate(
          ({ frame, predicted }) => window.fightingShowcase.seek(frame, predicted),
          { frame, predicted: predictionOnly },
        )
        await page.clock.runFor(
          Math.floor(((frame + 1) * 1000) / fps) - Math.floor((frame * 1000) / fps),
        )
        const bytes = await page.screenshot({ type: 'jpeg', quality: 94, animations: 'allow' })
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
        if (frame % (fps * 10) === 0)
          process.stdout.write(`Video: ${(frame / fps).toFixed(0)} / ${report.duration}s\n`)
      }
      encoder.stdin.end()
      const [code] = await finished
      assert.equal(code, 0, 'ffmpeg failed')
      assert.deepEqual(errors, [])
      process.stdout.write(`Saved: ${destination}\n`)
    }
  }
} finally {
  encoder?.kill()
  await browser?.close()
  await server.close()
}
