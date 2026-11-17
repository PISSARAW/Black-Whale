import { describe, expect, it } from 'vitest'
import { createInputPipeline, INPUT_REQUESTS, INPUT_WINDOW } from './inputPipeline'
import { parsePvpPackets } from './protocol'
import type { PvpCommand, PvpInputPacket } from './types'

function fixture() {
  let now = 0
  let id = 0
  const requests: Array<{
    packets: PvpInputPacket[]
    signal: AbortSignal
    resolve: () => void
    reject: (error: Error) => void
  }> = []
  const errors: unknown[] = []
  const sent: PvpInputPacket[] = []
  const pipeline = createInputPipeline({
    now: () => now,
    send: (packets, signal) =>
      new Promise<void>((resolve, reject) => {
        requests.push({ packets, signal, resolve, reject })
      }),
    failed: (error) => errors.push(error),
    sent: (packet) => sent.push(structuredClone(packet)),
  })
  return {
    pipeline,
    requests,
    errors,
    sent,
    queue(command: PvpCommand = { kind: 'move', action: 'light', input: 0 }) {
      return pipeline.queue(command, () => ++id)
    },
    time(ms = 50) {
      now += ms
    },
  }
}

describe('bounded cumulative input uploads', () => {
  it('sends a cancel and guard while the first command is still awaiting its HTTP receipt', async () => {
    const f = fixture()
    f.queue()
    const first = f.pipeline.send(0)
    f.time(17)
    f.queue({ kind: 'move', action: 'heavy', input: 0 })
    const second = f.pipeline.send(16)
    expect(f.requests).toHaveLength(2)
    expect(f.requests[1].packets).toEqual([
      { sequence: 0, input: 0, commands: [{ kind: 'move', action: 'light', input: 0 }] },
      { sequence: 1, input: 16, commands: [{ kind: 'move', action: 'heavy', input: 0 }] },
    ])
    f.pipeline.acknowledge(1)
    expect(f.requests[0].signal.aborted).toBe(true)
    expect(f.requests[1].signal.aborted).toBe(false)
    f.pipeline.acknowledge(2)
    expect(f.pipeline.stats.inFlight).toBe(0)
    f.requests[0].reject(Error('late abort'))
    f.requests[1].resolve()
    await Promise.all([first, second])
    expect(f.errors).toEqual([])
  })
  it('retransmits the immutable accepted prefix after upload loss or reordered requests', async () => {
    const f = fixture()
    const command: PvpCommand = { kind: 'talk', words: 'original' }
    f.queue(command)
    const first = f.pipeline.send(0)
    command.words = 'mutated'
    f.requests[0].reject(Error('lost upload'))
    await first
    f.time()
    const retry = f.pipeline.send(2)
    expect(f.requests[1].packets[0]).toEqual(f.sent[0])
    expect(f.requests[1].packets[0].commands).toEqual([{ kind: 'talk', words: 'original' }])
    f.pipeline.acknowledge(2)
    f.requests[1].resolve()
    await retry
    expect(f.errors).toHaveLength(1)
  })
  it('bounds requests, unreceived packets, command backlog and wire bytes', async () => {
    const f = fixture()
    for (let i = 0; i < 8; i++) expect(f.queue({ kind: 'poem', text: '界'.repeat(240) })).toBe(true)
    expect(f.queue()).toBe(false)
    const promises: Promise<void>[] = []
    for (let i = 0; i < 100; i++) {
      f.time()
      promises.push(f.pipeline.send(i % 2))
    }
    expect(f.pipeline.stats.inFlight).toBe(INPUT_REQUESTS)
    for (const r of f.requests) r.resolve()
    await Promise.all(promises)
    for (let i = 0; i < 100; i++) {
      f.time()
      const sent = f.pipeline.send(i % 2)
      const request = f.requests.at(-1)!
      expect(parsePvpPackets(request.packets)).not.toBeNull()
      expect(
        new TextEncoder().encode(JSON.stringify({ kind: 'inputs', packets: request.packets }))
          .length,
      ).toBeLessThan(8192)
      request.resolve()
      await sent
    }
    expect(f.pipeline.stats.unreceived).toBe(INPUT_WINDOW)
    expect(f.pipeline.stats.nextSequence).toBe(INPUT_WINDOW)
  })
  it('keeps sent sequences on focus release, resets on a new round and cancels work on stop', async () => {
    const f = fixture()
    f.queue()
    const first = f.pipeline.send(2)
    f.queue({ kind: 'call' })
    f.pipeline.release()
    expect(f.pipeline.stats.pending).toBe(0)
    expect(f.pipeline.stats.unreceived).toBe(1)
    f.time()
    const release = f.pipeline.send(0)
    expect(f.requests[1].packets.map((p) => p.sequence)).toEqual([0, 1])
    f.pipeline.reset(2)
    expect(f.requests.every((r) => r.signal.aborted)).toBe(true)
    for (const r of f.requests) r.resolve()
    await Promise.all([first, release])
    f.time()
    const newRound = f.pipeline.send(0)
    expect(f.requests[2].packets[0].sequence).toBe(2)
    f.pipeline.stop()
    f.requests[2].reject(Error('late failure'))
    await newRound
    await f.pipeline.send(2)
    expect(f.queue()).toBe(false)
    expect(f.errors).toEqual([])
    expect(f.requests).toHaveLength(3)
  })
  it('limits production uploads to 20 per second plus the initial three-packet burst', async () => {
    const f = fixture()
    for (let frame = 0; frame < 120; frame++) {
      f.time(1000 / 60)
      const sent = f.pipeline.send(frame % 2)
      f.pipeline.acknowledge(f.pipeline.stats.nextSequence)
      f.requests.at(-1)?.resolve()
      await sent
    }
    expect(f.requests.length).toBeGreaterThanOrEqual(39)
    expect(f.requests.length).toBeLessThanOrEqual(43)
  })
})
