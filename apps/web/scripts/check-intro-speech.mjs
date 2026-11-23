import assert from 'node:assert/strict'

export async function installIntroSpeechProbe(page) {
  await page.addInitScript(() => {
    window.introSpeech = []
    const inputs = new WeakMap()
    const buffers = new WeakMap()
    const read = Response.prototype.arrayBuffer
    Response.prototype.arrayBuffer = async function () {
      const bytes = await read.call(this)
      if (this.url.includes('/clash-voices/rivals/')) inputs.set(bytes, this.url)
      return bytes
    }
    const decode = AudioContext.prototype.decodeAudioData
    AudioContext.prototype.decodeAudioData = function (bytes) {
      const pending = decode.apply(this, arguments)
      const url = inputs.get(bytes)
      if (url)
        void pending.then(
          (buffer) => buffers.set(buffer, url),
          () => {},
        )
      return pending
    }
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (at, offset, duration) {
      const url = buffers.get(this.buffer)
      if (url) window.introSpeech.push({ event: 'start', url, offset, duration })
      if (url && window.skipWhenIntroStarts && url.endsWith(window.skipWhenIntroStarts)) {
        window.skipWhenIntroStarts = undefined
        queueMicrotask(() => {
          window.skippedIntroSubtitle = document.querySelector(
            '[data-intro-shot="opponent"] .actor p',
          )?.textContent
          document.querySelector('.fight-introduction button')?.click()
        })
      }
      return start.apply(this, arguments)
    }
    const stop = AudioBufferSourceNode.prototype.stop
    AudioBufferSourceNode.prototype.stop = function () {
      const url = buffers.get(this.buffer)
      if (url) window.introSpeech.push({ event: 'stop', url })
      return stop.apply(this, arguments)
    }
  })
}

export async function verifyIntroSpeech(page, { reset, snapshot, pause }) {
  const shot = (side) => page.locator(`[data-intro-shot="${side}"] .actor`)
  const starts = () =>
    page.evaluate(() => window.introSpeech.filter(({ event }) => event === 'start'))
  const eventCount = (event) =>
    page.evaluate(
      (type) => window.introSpeech.filter((entry) => entry.event === type).length,
      event,
    )
  const waitForEvents = (event, count) =>
    page.waitForFunction(
      ([type, total]) => window.introSpeech.filter((entry) => entry.event === type).length >= total,
      [event, count],
      { timeout: 12_000 },
    )
  await page.keyboard.press('Enter')
  await page.waitForSelector('output[data-phase="fighting"]')
  await page.keyboard.press('Shift')
  await page.evaluate(() => {
    window.introSpeech.length = 0
  })
  await reset()
  await shot('player').waitFor()
  await waitForEvents('start', 1)
  assert.match(await shot('player').locator('p').innerText(), /Pakunoda a tenu parole/)
  const first = (await starts()).at(-1)
  assert.match(first.url, /fr-chrollo--kurapika\.mp3$/)
  assert.ok(first.offset < 0.2)
  const pausedBefore = await eventCount('stop')
  await pause(true)
  await waitForEvents('stop', pausedBefore + 1)
  assert.equal((await snapshot()).state.phase, 'ready')
  const startsBeforeResume = (await starts()).length
  await pause(false)
  await waitForEvents('start', startsBeforeResume + 1)
  await shot('opponent').waitFor()
  await waitForEvents('start', startsBeforeResume + 2)
  assert.match(await shot('opponent').locator('p').innerText(), /souvenirs de Pakunoda/)
  const reply = (await starts()).at(-1)
  assert.ok(reply.offset >= first.offset + first.duration + 0.14)
  await page.waitForSelector('output[data-phase="fighting"]')
  const kameo = await page.evaluate(() => window.introductionFixture.callLuzurus())
  assert.equal(kameo.fighter.id, 'luzurus')
  assert.equal(kameo.phase, 'entering')

  const startsBeforeReverse = (await starts()).length
  const stopsBeforeSkip = await eventCount('stop')
  await page.evaluate(() => {
    window.skipWhenIntroStarts = 'en-chrollo--kurapika.mp3'
  })
  await reset({ player: 'chrollo', opponent: 'kurapika', language: 'en' })
  await waitForEvents('start', startsBeforeReverse + 1)
  assert.match((await starts()).at(-1).url, /en-chrollo--kurapika\.mp3$/)
  await waitForEvents('stop', stopsBeforeSkip + 1)
  await page.waitForSelector('output[data-phase="fighting"]')
  assert.match(await page.evaluate(() => window.skippedIntroSubtitle), /Pakunoda kept her word/)

  const startsBeforeMute = (await starts()).length
  await page.evaluate(() => window.introductionFixture.mute(true))
  await reset()
  await shot('player').waitFor()
  assert.match(await shot('player').locator('p').innerText(), /Pakunoda/)
  await shot('opponent').waitFor()
  assert.equal((await starts()).length, startsBeforeMute)
  await page.getByRole('button', { name: /Passer/ }).click()
  await page.evaluate(() => window.introductionFixture.mute(false))
  process.stdout.write(
    'Kurapika vs Chrollo with Luzurus: intro voices, subtitles, pause, mute and skip verified.\n',
  )
}
