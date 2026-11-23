import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const atlas = JSON.parse(
  await readFile(path.join(root, 'src/lib/fighting/audio/speechAtlas.json'), 'utf8'),
)
const descriptions = JSON.parse(
  await readFile(path.join(root, 'src/lib/fighting/audio/descriptionAtlas.json'), 'utf8'),
)
const cacheDir = await mkdtemp(path.join(tmpdir(), 'black-whale-audio-'))
const server = await createServer({
  configFile: false,
  root,
  cacheDir,
  publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-audio/index.html'], holdUntilCrawlEnd: false },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
function identifyVoiceSamples(manifest, locale, calls) {
  return calls.flatMap((call) => {
    const hit = Object.entries(manifest.locales[locale]).find(
      ([, [start, duration]]) =>
        Math.abs(call.offset * manifest.sampleRate - start) < 0.2 &&
        Math.abs(call.duration * manifest.sampleRate - duration) < 0.2,
    )
    return hit ? [{ line: hit[0], rate: call.rate }] : []
  })
}

let browser
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    window.cuePitches = []
    window.voiceStarts = []
    window.voiceBanks = 0
    window.descriptionBanks = 0
    window.descriptionStops = 0
    window.descriptionStarts = []
    window.musicLoops = 0
    const isDescription = (buffer) => buffer?.numberOfChannels === 1 && buffer.duration > 100
    const decode = AudioContext.prototype.decodeAudioData
    AudioContext.prototype.decodeAudioData = function (...args) {
      const pending = decode.apply(this, args)
      void pending.then(
        (buffer) => {
          if (buffer.duration > 16 && buffer.duration < 35 && buffer.numberOfChannels === 1)
            window.voiceBanks++
          if (isDescription(buffer)) window.descriptionBanks++
        },
        () => {},
      )
      return pending
    }
    const playSample = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (at, offset, duration) {
      if (isDescription(this.buffer)) window.descriptionStarts.push({ offset, duration })
      else if (duration !== undefined)
        window.voiceStarts.push({ offset, duration, rate: this.playbackRate.value })
      if (this.loop && this.buffer?.duration > 35) window.musicLoops++
      return Reflect.apply(playSample, this, arguments)
    }
    const stopSample = AudioBufferSourceNode.prototype.stop
    AudioBufferSourceNode.prototype.stop = function (...args) {
      if (isDescription(this.buffer)) window.descriptionStops++
      return Reflect.apply(stopSample, this, args)
    }
    const createLimiter = AudioContext.prototype.createDynamicsCompressor
    AudioContext.prototype.createDynamicsCompressor = function () {
      const limiter = createLimiter.call(this)
      const analyser = this.createAnalyser()
      const silent = this.createGain()
      silent.gain.value = 0
      limiter.connect(analyser).connect(silent).connect(this.destination)
      window.outputAnalyser = analyser
      return limiter
    }
    const frequencies = new WeakSet()
    const createOscillator = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = createOscillator.call(this)
      frequencies.add(oscillator.frequency)
      return oscillator
    }
    const set = AudioParam.prototype.setValueAtTime
    AudioParam.prototype.setValueAtTime = function (value, when) {
      if (frequencies.has(this) && value >= 100) window.cuePitches.push(value)
      return set.call(this, value, when)
    }
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-audio/`, {
    waitUntil: 'commit',
    timeout: 90_000,
  })
  await page
    .waitForFunction(() => window.audioFixture, undefined, { timeout: 90_000 })
    .catch((error) => {
      if (errors.length)
        throw new AggregateError(
          errors.map((message) => Error(message)),
          'Audio fixture failed to mount',
        )
      throw error
    })
  await page.locator('summary').filter({ hasText: 'Mixage' }).first().click()
  await page.getByRole('button', { name: 'Compétition' }).click()
  const panel = page.locator('.fight-audio details')
  assert.equal(
    await panel.evaluate((details) => details.open),
    true,
    'mix stays open after a preset',
  )
  await panel.getByRole('checkbox', { name: 'Mono' }).check()
  await page.waitForFunction(() => {
    const options = JSON.parse(localStorage.getItem('black-whale:fighting-audio') ?? '{}')
    return options.mono && options.effects === 1 && options.music === 0.2
  })
  await page.waitForFunction(() => window.voiceBanks >= 1)
  const voiceLines = async (locale = 'fr') => {
    const calls = await page.evaluate(() => window.voiceStarts.splice(0))
    return identifyVoiceSamples(atlas, locale, calls)
  }
  const waitForLine = (name, locale = 'fr') =>
    page.waitForFunction(
      ({ start, duration }) =>
        window.voiceStarts.some(
          (clip) =>
            Math.abs(clip.offset - start) < 0.00001 && Math.abs(clip.duration - duration) < 0.00001,
        ),
      {
        start: atlas.locales[locale][name][0] / atlas.sampleRate,
        duration: atlas.locales[locale][name][1] / atlas.sampleRate,
      },
    )
  await voiceLines()
  await page.evaluate(() => window.audioFixture.restartRound())
  await waitForLine('start')
  assert.deepEqual(
    (await voiceLines()).map(({ line }) => line),
    ['start'],
  )
  const kameo = await page.evaluate(() => window.audioFixture.kameo())
  for (const cue of ['assist-entry', 'assist-action', 'assist-exit', 'assist-ready'])
    assert.equal(kameo.filter((event) => event === cue).length, 1, cue)
  const calls = await voiceLines()
  assert.deepEqual(
    calls.map(({ line }) => line),
    ['call-luzurus'],
  )
  assert.ok(calls[0].rate > 0.9, 'the Kameo call uses Kurapika’s voice register')
  let pitches = await page.evaluate(() => window.cuePitches.splice(0))
  for (const pitch of [475, 665, 990]) assert.ok(pitches.includes(pitch), 'assist pitch ' + pitch)

  for (const guard of ['none', 'early', 'late']) {
    const impact = await page.evaluate(async (guard) => {
      await window.audioFixture.reset()
      return window.audioFixture.opening(guard)
    }, guard)
    assert.equal(impact.blocked, guard !== 'none')
    assert.equal(impact.parried, guard === 'late')
    const sounded = await voiceLines()
    const effort = sounded.find(({ line }) => line.startsWith('effort-'))
    const pain = sounded.find(({ line }) => line.startsWith('pain-'))
    assert.ok(effort && effort.rate < 0.85, 'Chrollo’s attack effort uses his lower register')
    assert.equal(Boolean(pain), guard === 'none', 'only confirmed damage produces a cry')
    if (pain) assert.ok(pain.rate > effort.rate, 'Kurapika’s cry uses his own register')
  }
  pitches = await page.evaluate(() => window.cuePitches.splice(0))
  assert.ok(pitches.includes(940), 'parry scheduled in Web Audio')

  const burst = await page.evaluate(async () => {
    await window.audioFixture.reset()
    return window.audioFixture.burst()
  })
  assert.equal(burst?.side, 'player')
  pitches = await page.evaluate(() => window.cuePitches.splice(0))
  assert.ok(pitches.includes(936), 'Burst scheduled in Web Audio')

  await page.waitForFunction(() => {
    const analyser = window.outputAnalyser
    if (!analyser) return false
    const samples = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(samples)
    return samples.some((sample) => Math.abs(sample) > 0.006)
  })
  const punish = await page.evaluate(async () => {
    await window.audioFixture.reset()
    return window.audioFixture.punishAt30Hz()
  })
  assert.equal(punish?.punish, true)
  pitches = await page.evaluate(() => window.cuePitches.splice(0))
  for (const pitch of [510, 300]) assert.ok(pitches.includes(pitch), 'punish pitch ' + pitch)

  const footwork = await page.evaluate(async () => {
    await window.audioFixture.reset()
    return window.audioFixture.footwork()
  })
  for (const cue of ['step', 'dash', 'jump', 'land', 'assist-action'])
    assert.ok(footwork.includes(cue), cue)
  pitches = await page.evaluate(() => window.cuePitches.splice(0))
  assert.ok(
    pitches.some((value) => value >= 101 && value <= 119),
    'carpet heel in Web Audio',
  )

  for (const kind of ['light', 'heavy']) {
    const { impact, scheduled } = await page.evaluate(async (kind) => {
      await window.audioFixture.reset()
      window.cuePitches.length = 0
      const impact = await window.audioFixture.strike(kind)
      return { impact, scheduled: window.cuePitches.splice(0) }
    }, kind)
    assert.equal(impact?.kind, kind)
    assert.ok(impact.damage > 0)
    const bodyFrequency = (kind === 'light' ? 185 : 173) * 0.91
    assert.ok(
      scheduled.some((value) => Math.abs(value - bodyFrequency) < 0.001),
      kind + ' body',
    )
    const chainLinks = [1, 0.91, 1.07, 0.96].map((pitch) => 2480 * pitch)
    const hasLinks = scheduled.some((value) =>
      chainLinks.some((link) => Math.abs(value - link) < 0.001),
    )
    assert.equal(
      hasLinks,
      kind === 'heavy',
      `chain on the authored heavy only: ${scheduled.join(', ')}`,
    )
  }

  for (const intercept of [true, false]) {
    const projectile = await page.evaluate(async (intercept) => {
      await window.audioFixture.reset()
      return window.audioFixture.projectile(intercept)
    }, intercept)
    assert.equal(
      projectile.events.filter((event) => event === 'projectile').length,
      1,
      JSON.stringify(projectile),
    )
    assert.equal(
      projectile.events.filter((event) => event === 'projectile-intercept').length,
      Number(intercept),
    )
    assert.equal(Boolean(projectile.impact?.projectileId), !intercept)
    const scheduled = await page.evaluate(() => window.cuePitches.splice(0))
    assert.equal(scheduled.includes(840), intercept, 'confirmed terrain ricochet')
  }

  await voiceLines()
  await page.evaluate(() => window.audioFixture.restartRound(true))
  await waitForLine('decisive')
  assert.deepEqual(
    (await voiceLines()).map(({ line }) => line),
    ['decisive'],
  )
  for (const draw of [true, false]) {
    const winner = await page.evaluate(async (draw) => {
      await window.audioFixture.reset()
      return window.audioFixture.timeout(draw)
    }, draw)
    assert.equal(winner, draw ? 'draw' : 'player')
    const last = draw ? 'draw' : 'player'
    await waitForLine(last)
    assert.deepEqual(
      (await voiceLines()).map(({ line }) => line),
      ['time', last],
    )
  }
  const reason = await page.evaluate(async () => {
    await window.audioFixture.reset()
    return window.audioFixture.points()
  })
  assert.equal(reason, 'hits')
  await waitForLine('player')
  assert.deepEqual(
    (await voiceLines()).map(({ line }) => line),
    ['points', 'player'],
  )
  await page.evaluate(async () => {
    await window.audioFixture.pauseAudio(true)
    await window.audioFixture.restartRound()
    await window.audioFixture.pauseAudio(false)
  })
  assert.deepEqual(await voiceLines(), [], 'a start observed while paused does not replay')
  await page.evaluate(() => window.audioFixture.setLocale('en'))
  await page.waitForFunction(() => window.voiceBanks >= 2)
  await page.evaluate(() => window.audioFixture.restartRound())
  await waitForLine('start', 'en')
  assert.deepEqual(
    (await voiceLines('en')).map(({ line }) => line),
    ['start'],
  )
  await page.evaluate(() => window.audioFixture.setLocale('fr'))

  for (const fallback of [false, true]) {
    if (fallback)
      await page.route('**/chrollo-sun-moon.m4a', (route) => route.fulfill({ status: 404 }))
    const victory = await page.evaluate(async () => {
      await window.audioFixture.reset()
      return window.audioFixture.sunMoon()
    })
    assert.equal(victory.mark, 1)
    assert.equal(victory.winner, 'opponent')
    assert.equal(victory.active, true)
    await waitForLine('knockout')
    assert.deepEqual(
      (await voiceLines())
        .filter(({ line }) => !line.startsWith('effort-') && !line.startsWith('pain-'))
        .map(({ line }) => line),
      ['knockout', 'opponent'],
    )
    const filename = fallback ? 'chrollo.m4a' : 'chrollo-sun-moon.m4a'
    await page.waitForFunction((filename) => {
      const media = document.querySelector(`audio[src$="/${filename}"]`)
      return media?.readyState >= 2 && !media.paused && media.currentTime > 0.12
    }, filename)
  }
  await page.unroute('**/chrollo-sun-moon.m4a')
  const fader = (name, value) =>
    page.getByRole('slider', { name, exact: true }).evaluate((input, value) => {
      input.value = String(value)
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
  await page.evaluate(() => window.audioFixture.reset())
  await fader('Voix de bord', 0)
  await fader('Commentaire dynamique', 1)
  await page.getByLabel('Registre des voix').selectOption('low')
  await voiceLines()
  const parry = await page.evaluate(() => window.audioFixture.opening('late'))
  assert.equal(parry?.parried, true)
  await waitForLine('comment-parry')
  const first = await voiceLines()
  assert.equal(first.filter(({ line }) => line === 'comment-parry').length, 1)
  assert.ok(first.find(({ line }) => line.startsWith('effort-'))?.rate < 0.7, 'deep voice register')
  await page.evaluate(() => window.audioFixture.advanceIdle(32))
  await page.evaluate(() => window.audioFixture.opening('late'))
  assert.ok(
    !(await voiceLines()).some(({ line }) => line.startsWith('comment-')),
    'commentary cooldown',
  )

  await fader('Audiodescription des victoires', 1)
  await page.waitForFunction(() => window.descriptionBanks >= 1)
  await page.evaluate(async () => {
    await window.audioFixture.reset()
    return window.audioFixture.sunMoon()
  })
  const [sample, length] = descriptions.locales.fr['description-chrollo-sun-moon-0']
  await page.waitForFunction(
    ({ offset, duration }) =>
      window.descriptionStarts.some(
        (clip) => clip.offset >= offset && clip.offset < offset + 0.4 && clip.duration <= duration,
      ),
    { offset: sample / descriptions.sampleRate, duration: length / descriptions.sampleRate },
  )
  const stopsBeforePause = await page.evaluate(() => window.descriptionStops)
  await page.evaluate(() => window.audioFixture.pauseAudio(true))
  await page.waitForFunction((count) => window.descriptionStops > count, stopsBeforePause)
  const startsBeforeResume = await page.evaluate(() => window.descriptionStarts.length)
  await page.evaluate(() => window.audioFixture.pauseAudio(false))
  await page.waitForFunction((count) => window.descriptionStarts.length > count, startsBeforeResume)
  const stopsBeforeSkip = await page.evaluate(() => window.descriptionStops)
  await page.locator('.skip-victory').click()
  await page.waitForFunction((count) => window.descriptionStops > count, stopsBeforeSkip)

  const captions = page.locator('.sound-captions')
  const captionSetting = page.getByRole('checkbox', { name: 'Sous-titres des sons de combat' })
  assert.equal(await captions.count(), 0, 'captions are opt-in')
  await page.getByRole('button', { name: 'Accessibilité', exact: true }).click()
  assert.equal(await captionSetting.isChecked(), true)
  await page.getByRole('button', { name: 'Son · Activé' }).click()
  await page.evaluate(async () => {
    await window.audioFixture.reset()
    await window.audioFixture.kameo(2)
  })
  await captions.getByText('Kaméo · Luzurus', { exact: true }).waitFor()
  await page.evaluate(() => window.audioFixture.pauseAudio(true))
  assert.equal(await captions.innerText(), '', 'pausing clears active captions')
  await page.evaluate(async () => {
    await window.audioFixture.restartRound()
    await window.audioFixture.pauseAudio(false)
    await window.audioFixture.opening('late')
  })
  await captions.getByText('Parade', { exact: true }).waitFor()
  assert.equal(await captions.getByText('Combat !', { exact: true }).count(), 0)
  await page.evaluate(() => window.audioFixture.reset())
  assert.equal(await captions.innerText(), '', 'seeking clears active captions')
  await page.evaluate(() => window.audioFixture.burst())
  await captions.getByText('Burst', { exact: true }).waitFor()
  await page.evaluate(async () => {
    await window.audioFixture.setLocale('en')
    await window.audioFixture.timeout(false)
  })
  await captions.getByText('Time up · Kurapika wins the round', { exact: true }).waitFor()
  await page.waitForFunction(() => document.querySelector('.sound-captions')?.textContent === '')
  await page.evaluate(() => window.audioFixture.setLocale('fr'))
  await page.getByRole('button', { name: 'Son · Coupé' }).click()
  await captionSetting.uncheck()

  await page.evaluate(() => window.audioFixture.showMenu(true))
  await page.locator('.jukebox summary').click()
  await page.getByLabel('Musique du menu').selectOption('off')
  await page.getByLabel('Piste à écouter').selectOption('whale-hold')
  const preview = page.waitForResponse('**/audio/clash/whale-hold.mp3')
  const loops = await page.evaluate(() => window.musicLoops)
  await page.getByRole('button', { name: 'Écouter', exact: true }).click()
  assert.equal((await preview).status(), 200)
  await page.waitForFunction((count) => window.musicLoops > count, loops)
  await page.getByRole('button', { name: 'Arrêter l’extrait' }).click()
  await page.getByLabel('Musique des combats').selectOption('vip-casino')
  const battle = page.waitForResponse('**/audio/clash/vip-casino.mp3')
  const loopsBeforeBattle = await page.evaluate(() => window.musicLoops)
  await page.evaluate(async () => {
    await window.audioFixture.reset()
    await window.audioFixture.showMenu(false)
  })
  assert.equal((await battle).status(), 200)
  await page.waitForFunction((count) => window.musicLoops > count, loopsBeforeBattle)
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('black-whale:fighting-audio')).battleTrack,
    ),
    'vip-casino',
  )
  assert.deepEqual(errors, [])
  process.stdout.write(
    'Kurapika vs Chrollo with Luzurus: mix, combat cues, voices, jukebox, commentary, victory narration and muted FR/EN sound captions verified.\n',
  )
} finally {
  await browser?.close()
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
}
