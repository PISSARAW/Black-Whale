import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const base = process.env.RESPONSE_BASE_URL ?? 'http://127.0.0.1:4177'
const endpoint = base + '/fighting/pvp/api/matches'
const replaySource = await readFile(
  new URL('../src/lib/fighting/fightReplayTypes.ts', import.meta.url),
  'utf8',
)
const replayRuleset = replaySource.match(/REPLAY_RULESET = '([^']+)'/)?.[1]
assert.ok(replayRuleset, 'Missing replay ruleset')
const ruleset = process.env.RESPONSE_RULESET ?? `clash-pvp-3:${replayRuleset}`
const fighters = process.env.RESPONSE_FIGHTERS?.split(',') ?? [
  'kurapika',
  'hisoka',
  'chrollo',
  'benjamin',
]
async function request(options) {
  const response = await fetch(endpoint + (options.id ? '/' + options.id : ''), {
    method: options.body ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + (options.token ?? ''),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const value = await response.json()
  assert.ok(response.ok, `HTTP ${response.status}: ${value.error}`)
  return value
}
async function appliedView(options) {
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), 5000)
  try {
    const response = await fetch(endpoint + '/' + options.id + '?stream=1', {
      headers: { authorization: 'Bearer ' + options.token },
      signal: abort.signal,
    })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /text\/event-stream/)
    assert.match(response.headers.get('cache-control'), /no-store/)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const next = await reader.read()
      assert.equal(next.done, false, 'Stream closed before acknowledgement')
      buffer += decoder.decode(next.value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const view = JSON.parse(buffer.slice(6, boundary))
        buffer = buffer.slice(boundary + 2)
        if (view.appliedSequence >= 1) return view
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    clearTimeout(timeout)
    abort.abort()
  }
}
for (const [index, fighter] of fighters.entries()) {
  const opponent = fighters[(index + 1) % fighters.length]
  const host = await request({
    body: {
      ruleset,
      setup: {
        player: fighter,
        opponent,
        formatId: 'knockout',
        environment: {
          arenaInteractions: false,
          stageId: 'heavens-arena',
          morenaPresent: false,
          unlawfulIntruders: { player: false, opponent: false },
        },
      },
    },
  })
  const id = host.matchId
  const guest = await request({
    id,
    body: { kind: 'join', ruleset, invitation: host.inviteHref.split('#')[1] },
  })
  const initial = await request({ id, token: host.token })
  for (const token of [host.token, guest.token])
    await request({ id, token, body: { kind: 'ready', ruleset, configHash: initial.configHash } })
  for (const token of [host.token, guest.token])
    await request({
      id,
      token,
      body: {
        kind: 'input',
        packet: {
          sequence: 0,
          input: 0,
          commands: [{ kind: 'move', action: 'light', input: 0 }],
        },
      },
    })
  for (const [token, owner] of [
    [host.token, fighter],
    [guest.token, opponent],
  ]) {
    const view = await appliedView({ id, token })
    const state = JSON.parse(view.snapshot)
    assert.equal(state.player.id, owner)
    assert.ok(view.appliedAtTick <= view.tick)
    assert.ok(view.appliedSequence <= view.nextSequence)
    assert.ok(view.revision > initial.revision)
    if (state.opponent.id === 'chrollo') assert.deepEqual(state.opponent.chrolloBook.pages, [])
  }
  const foreign = await fetch(endpoint + '/' + id + '?stream=1', {
    headers: { authorization: 'Bearer foreign' },
  })
  assert.equal(foreign.status, 401)
  await foreign.body.cancel()
  await request({ id, token: host.token, body: { kind: 'leave' } })
  process.stdout.write(
    `${fighter} / ${opponent}: production API + private SSE + applied acknowledgement passed\n`,
  )
}
