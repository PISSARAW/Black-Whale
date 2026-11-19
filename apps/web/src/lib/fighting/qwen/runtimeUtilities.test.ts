import { describe, expect, it } from 'vitest'
import { createFight, beginFight, performAuraAttack } from '../engine'
import { EMPTY_INPUT } from '../types'
import { createQwenDuel } from './duel'
import { createFastController } from './execution'
import { createFightMatchRuntime } from '../fightMatchRuntime'
import { initialReplayState, executeReplayPacket } from '../fightReplayCommands'
import { fightReplayHash } from '../fightReplayHash'
import { bindBiohazard } from '../biohazardCapture'
import { performArsenalAction } from '../arsenalExecution'
import { utilityKey } from './utilities'

const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}
describe('Qwen panel execution through the match runtime', () => {
  it('records sequential native panel actions from both seats and replays both changes', async () => {
    let now = 0
    const qwen = createQwenDuel({
      clock: () => now,
      transport: async (observation) => {
        const option = observation.utilities!.find(
          (entry) => entry.command.action === 'weapon-ready',
        )!
        expect(option).toBeTruthy()
        return {
          plan: { goal: 'bait', nen: 'ten', move: option.key },
          model: 'test-fixture',
          requestId: observation.fighter,
          elapsedMs: 1,
        }
      },
    })
    const match = createFightMatchRuntime(() => now, { qwen })
    let state = { ...createFight('leorio', 'hanzo', { mode: 'versus-local' }), frame: 20 }
    match.begin(state)
    state = match.apply(state, { kind: 'start' })
    qwen.setEnabled(true)
    const advance = () => {
      state = match.advance(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    advance()
    await settle()
    for (let frame = 0; frame < 12; frame++) advance()
    now = 1700
    advance()
    await settle()
    for (let frame = 0; frame < 12; frame++) advance()
    expect(qwen.evidence.map((entry) => entry.side)).toEqual(['player', 'opponent'])
    expect(state.player.historicalWeapon).toBeTruthy()
    expect(state.opponent.historicalWeapon).toBeTruthy()
    const entry = await match.replays.save()
    const replay = entry!.replay
    expect(
      replay.packets.flatMap((packet) => packet[3]).filter((command) => command.kind === 'panel'),
    ).toHaveLength(2)
    let verified = initialReplayState(replay.setup)
    for (const packet of replay.packets) verified = executeReplayPacket(verified, packet)
    expect(fightReplayHash(verified)).toBe(fightReplayHash(state))
    qwen.dispose()
  })
  it('keeps Padaille’s native escape accessible while ordinary attacks are disabled by cuffs', () => {
    let state = beginFight(createFight('padaille', 'hinrigh', { mode: 'versus-local' }))
    state = { ...state, frame: 20, player: { ...state.player, x: 42, aura: 100 } }
    const object = { ...state.opponent.biohazard!.objects[0], phase: 'bound' as const, x: 42 }
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        biohazard: { objects: [object, ...state.opponent.biohazard!.objects.slice(1)] },
      },
    }
    state = bindBiohazard(state, 'opponent', object)
    const move = utilityKey({ action: 'padaille-escape', target: 'drill' })
    const decision = createFastController('player')(state, { goal: 'bait', nen: 'ten', move })
    expect(decision.command).toBeUndefined()
    expect(decision.utility?.command).toEqual({ action: 'padaille-escape', target: 'drill' })
    const prepared = performArsenalAction({ state, ...decision.utility! }, performAuraAttack)
    expect(prepared.player.padailleEscape?.tool).toBe('drill')
    expect(prepared.player.aura).toBe(80)
    expect(prepared.opponent.health).toBe(state.opponent.health)
  })
})
