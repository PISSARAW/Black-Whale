import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { loadFrozenCombatTapes } from '../../../../../scripts/clash-frozen-tapes'
import { BASELINE_FIGHTERS } from './combatBaseline'
import { qualificationState, probeCommandQueue, probeRouteWindows } from './commandQualification'
import { createKeyboardMapper, defaultBindings } from './fightInputBindings'
import { createGamepadReader, type FightPad } from './fightGamepad'
import { EMPTY_INPUT } from './types'
import { revalidateCombatReference } from './revalidateCombatReference'
import { REPLAY_RULESET } from './fightReplayTypes'
import { probeRecoveryLink } from './linkQualification'
import { markFightRender } from './fightRenderObservation'
import { initialReplayState, executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'

let frozen: Awaited<ReturnType<typeof loadFrozenCombatTapes>>
beforeAll(async () => {
  frozen = await loadFrozenCombatTapes()
})

describe('command qualification from the frozen six-fighter states', () => {
  it('keeps all historical input packets and the original archive intact across the v17 recording', async () => {
    const historical = await loadFrozenCombatTapes(
      fileURLToPath(new URL('../../../ui-tests/fighting-reference/reference', import.meta.url)),
    )
    expect(historical.archiveSha256).toBe(
      'd4e27df52932d61bfd526cc94d145111947103190208e4c2aae3c4a00e416900',
    )
    expect(frozen.ruleset).toBe('clash-combat-17')
    expect(Object.keys(frozen.tapes).sort()).toEqual(Object.keys(historical.tapes).sort())
    for (const [id, replay] of Object.entries(historical.tapes))
      expect(frozen.tapes[id].packets).toEqual(replay.packets)
  })
  it('still rejects promotion of the original Kurapika trace when its checkpoints differ', async () => {
    const historical = await loadFrozenCombatTapes(
      fileURLToPath(new URL('../../../ui-tests/fighting-reference/reference', import.meta.url)),
    )
    expect(() =>
      revalidateCombatReference(historical.tapes['route-kurapika-confirm-neutral-right-center-6']),
    ).toThrow(/Reference changed/)
  })

  for (const fighter of BASELINE_FIGHTERS)
    it(`${fighter}: verifies or refuses promotion without rewriting the immutable original checkpoints`, () => {
      const original = frozen.tapes[`route-${fighter}-confirm-neutral-right-center-6`]
      const before = JSON.stringify(original)
      let verified: ReturnType<typeof revalidateCombatReference> | undefined
      let refusal: unknown
      try {
        verified = revalidateCombatReference(original)
      } catch (error) {
        refusal = error
      }
      expect(JSON.stringify(original)).toBe(before)
      if (!verified) {
        expect(original.ruleset).not.toBe(REPLAY_RULESET)
        expect(String(refusal)).toMatch(/Reference changed at checkpoint/)
        return
      }
      expect(verified.measuredRuleset).toBe(REPLAY_RULESET)
      expect(verified.checkpointsVerified).toBe(original.checkpoints.length)
      expect(JSON.stringify(original)).toBe(before)
      const tampered = structuredClone(original)
      tampered.checkpoints.at(-1)!.hash = '00000000'
      expect(() => revalidateCombatReference(tampered)).toThrow(/checkpoint/)
    })
  for (const fighter of BASELINE_FIGHTERS)
    for (const side of ['player', 'opponent'] as const)
      for (const mirrored of [false, true])
        for (const hz of [120, 60, 30, 20])
          it(`${fighter}/${side}/mirrored=${mirrored}/${hz}Hz: recovery buffer boundary`, () => {
            const replay = frozen.tapes[`route-${fighter}-confirm-neutral-right-center-6`]
            for (const stun of [0, 1, 5, 6, 7]) {
              const row = probeCommandQueue({
                initial: qualificationState(replay, { side, mirrored }),
                side,
                hz,
                stun,
              })
              expect(row.pass, JSON.stringify(row)).toBe(true)
              if (stun <= 6) {
                expect(row.executedFrame).toBeGreaterThanOrEqual(stun)
                expect(row.executedFrame).toBeLessThanOrEqual(stun + 3)
              }
            }
            for (const slot of ['forwardHeavy', 'backHeavy', 'lowLight', 'airLight'] as const)
              expect(
                probeCommandQueue({
                  initial: qualificationState(replay, { side, mirrored }),
                  side,
                  hz,
                  stun: 0,
                  slot,
                }).pass,
              ).toBe(true)
          })
  for (const fighter of BASELINE_FIGHTERS)
    it(`${fighter}: hitstop preserves the buffered command and focus cancellation removes queued commands`, () => {
      const replay = frozen.tapes[`route-${fighter}-confirm-neutral-right-center-6`]
      const initial = qualificationState(replay, { side: 'player', mirrored: false })
      for (const hitstop of [1, 6, 12])
        expect(probeCommandQueue({ initial, side: 'player', hz: 60, stun: 3, hitstop }).pass).toBe(
          true,
        )
      expect(
        probeCommandQueue({ initial, side: 'player', hz: 60, stun: 0, cancel: true }),
      ).toMatchObject({ pass: true, outcome: 'cancelled', executedFrame: null })
    })
  for (const fighter of BASELINE_FIGHTERS)
    it(`${fighter}: qualifies current command windows using the unchanged frozen inputs`, () => {
      const id = `route-${fighter}-confirm-neutral-right-center-6`
      const row = probeRouteWindows(frozen.tapes[id])
      if (frozen.ruleset === REPLAY_RULESET)
        expect(row.finalHash).toBe(frozen.rows.find((entry) => entry.id === id)!.finalHash)
      else {
        const independent = frozen.tapes[id].packets.reduce(
          executeReplayPacket,
          initialReplayState(frozen.tapes[id].setup),
        )
        expect(row.finalHash).toBe(fightReplayHash(independent))
      }
      expect(row.observations.length).toBeGreaterThan(0)
      expect(row.observations.filter((sample) => sample.admitted)).not.toHaveLength(0)
      expect(row.observations.every((sample) => sample.admitted === sample.started)).toBe(true)
    })
})

describe('recovery links use real guard and one-frame timing offsets', () => {
  for (const [fighter, route, from, to] of [
    ['kurapika', 'precision', 'forwardLight', 'standingHeavy'],
    ['chrollo', 'precision', 'standingHeavy', 'backHeavy'],
    ['phinks', 'charged', 'standingHeavy', 'finisher'],
  ] as const)
    it(`${fighter}: before recovery, first free tick, and the first late tick`, () => {
      const result = probeRecoveryLink({
        replay: frozen.tapes[`route-${fighter}-${route}-neutral-right-center-6`],
        from,
        to,
      })
      expect(result.pass, JSON.stringify(result)).toBe(true)
      expect(result.rows[0].startedImmediately).toBe(false)
      expect(result.rows.find((row) => row.offset === 0)?.guaranteed).toBe(true)
      expect(result.rows.at(-1)?.guaranteed).toBe(false)
    })
})

function pad(buttons: number[] = [], axes: number[] = [0, 0]): FightPad {
  return {
    index: 0,
    id: 'Simulated Xbox standard controller',
    mapping: 'standard',
    connected: true,
    axes,
    buttons: Array.from({ length: 16 }, (_, index) => ({
      pressed: buttons.includes(index),
      value: Number(buttons.includes(index)),
    })),
  }
}

describe('held inputs and neutral gating', () => {
  it('retains the logical key across a binding change, then clears lost-focus input', () => {
    const mapper = createKeyboardMapper(),
      bindings = defaultBindings()
    const event = { key: 'd', code: 'KeyD' }
    expect(mapper.key(event, true, bindings)).toBe('d')
    expect(mapper.key({ ...event, key: 'x' }, false, { ...bindings, playerRight: 'x' })).toBe('d')
    mapper.key({ key: 'l', code: 'KeyL' }, true, bindings)
    mapper.clear()
    expect(mapper.key({ key: 'l', code: 'KeyL' }, false, bindings)).toBeNull()
  })
  it('has no held-button attack after reconnect or resume and emits one special on release', () => {
    const reader = createGamepadReader()
    reader.poll([pad()], true)
    reader.poll([pad()], true)
    expect(reader.poll([pad([0])], true).actions).toEqual([{ side: 'player', action: 'light' }])
    expect(reader.poll([pad([0])], true).actions).toEqual([])
    reader.poll([], true)
    expect(reader.poll([pad([0])], true).actions).toEqual([])
    reader.poll([pad()], true)
    reader.poll([pad([2])], true)
    expect(reader.poll([pad()], true).actions).toEqual([{ side: 'player', action: 'special' }])
    expect(reader.poll([pad()], true).actions).toEqual([])
    reader.release()
    expect(reader.inputs.player).toEqual(EMPTY_INPUT)
    expect(reader.poll([pad([0])], false).actions).toEqual([])
    expect(reader.poll([pad([0])], true).actions).toEqual([])
  })
  it('keeps stick hysteresis and reverses direction without sticking', () => {
    const reader = createGamepadReader()
    reader.poll([pad()], true)
    reader.poll([pad()], true)
    reader.poll([pad([], [0.51, 0])], true)
    expect(reader.inputs.player.right).toBe(true)
    reader.poll([pad([], [0.4, 0])], true)
    expect(reader.inputs.player.right).toBe(true)
    reader.poll([pad([], [-0.6, 0])], true)
    expect(reader.inputs.player.left).toBe(true)
    expect(reader.inputs.player.right).toBe(false)
    reader.poll([pad([], [0, 0])], true)
    expect(Object.values(reader.inputs.player).some(Boolean)).toBe(false)
  })
})

describe('draw observation stays outside the simulation', () => {
  it('does not record render metadata unless a probe is enabled', () => {
    const state = initialReplayState(
      frozen.tapes['route-kurapika-confirm-neutral-right-center-6'].setup,
    )
    const scene = { userData: {} }
    markFightRender(scene, state)
    expect(scene.userData).toEqual({})
  })
  it('reports the posed frame without altering any combat or replay state', () => {
    const state = initialReplayState(
      frozen.tapes['route-kurapika-confirm-neutral-right-center-6'].setup,
    )
    const before = fightReplayHash(state)
    const scene = { userData: { measureFight: true } as Record<string, unknown> }
    markFightRender(scene, state)
    expect(scene.userData.drawnFight).toEqual({
      frame: state.frame,
      player: 'kurapika',
      moveId: null,
      attackFrame: null,
    })
    expect(fightReplayHash(state)).toBe(before)
  })
})
