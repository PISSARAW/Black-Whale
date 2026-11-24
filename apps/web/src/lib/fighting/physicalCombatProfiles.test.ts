import { describe, expect, it } from 'vitest'
import { applyReplayCommand } from './fightReplayCommands'
import { packReplayInput } from './fightReplayInput'
import { beginFight, createFight, tickFight } from './engine'
import { motionOf } from './fighterMovement'
import { attackData } from './frameData'
import { keyPoseTimeline } from './keyPoseMoves'
import { moveForSlot } from './movesets'
import { rosterStrikeShape } from './rosterKeyPoses'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'

const WAVE = ['mizaistom', 'terebellum', 'cluck', 'sayird', 'camilla'] as const

function round(id: FighterId, facing: 1 | -1 = 1): FightState {
  const state = beginFight(createFight(id, 'benjamin', { mode: 'versus-local' }))
  return {
    ...state,
    player: { ...state.player, x: 50, facing },
    opponent: { ...state.opponent, x: 50 + 25 * facing, facing: facing === 1 ? -1 : 1 },
  }
}

function step(state: FightState, frames: number, keys: Partial<FightInput> = {}): FightState {
  const input = { ...EMPTY_INPUT, ...keys }
  for (let index = 0; index < frames; index++)
    state = tickFight(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Hatsu-inspired physical combat profiles', () => {
  it('changes the actual pace, dashes and jump arcs on the same controls', () => {
    const traces = WAVE.map((id) => {
      const start = round(id)
      const walking = step(start, 12, { right: true })
      const dashing = step(step(step(start, 1, { right: true }), 2), 1, { right: true })
      const jumping = step(start, 19, { jump: true })
      return {
        walk: walking.player.x - start.player.x,
        dash: motionOf(dashing.player).dash!,
        jump: jumping.player.y,
      }
    })
    expect(new Set(traces.map(({ walk }) => walk)).size).toBe(5)
    expect(new Set(traces.map(({ dash }) => dash.frames)).size).toBe(5)
    expect(new Set(traces.map(({ jump }) => jump)).size).toBe(5)
    expect(traces[2].walk).toBeGreaterThan(traces[1].walk)
    expect(traces[2].jump).toBeGreaterThan(traces[1].jump)
  })

  it.each([1, -1] as const)(
    'moves Camilla away during her ordinary rear counter, facing %s',
    (facing) => {
      const start = round('camilla', facing)
      const input = { ...EMPTY_INPUT, left: facing === 1, right: facing === -1 }
      const attack = applyReplayCommand(start, {
        kind: 'move',
        side: 'player',
        action: 'heavy',
        input: packReplayInput(input),
      })
      const tuning = attackData('heavy', attack.player)
      const contact = step(attack, tuning.startup)
      expect(tuning.startup).toBe(6)
      expect(contact.player.attack?.moveId).toBe('camilla:backHeavy')
      expect((contact.player.x - start.player.x) * facing).toBeCloseTo(-2.5)
      expect(attack.player.aura).toBe(start.player.aura)
      expect(contact.player.attack?.auraCharged).toBe(false)
    },
  )

  it.each([
    'standingLight',
    'standingHeavy',
    'lowLight',
    'lowHeavy',
    'airLight',
    'airHeavy',
    'forwardLight',
    'forwardHeavy',
    'backHeavy',
  ] as const)('draws five different %s contacts', (slot) => {
    const shapes = WAVE.map((id) => rosterStrikeShape(id, slot))
    const contacts = WAVE.map(
      (id) =>
        keyPoseTimeline(id, slot)?.find(({ phase, at }) => phase === 'active' && at === 0)?.pose,
    )
    expect(new Set(shapes).size).toBe(5)
    expect(contacts.every(Boolean)).toBe(true)
    expect(new Set(contacts.map((pose) => JSON.stringify(pose))).size).toBe(5)
    expect(new Set(WAVE.map((id) => moveForSlot(id, slot)?.nameFr)).size).toBe(5)
  })
})

const COHORTS = [
  { wave: 2, fighters: ['musse', 'hinrigh', 'longhi', 'voconte', 'furykov'], retreat: 'longhi' },
  { wave: 3, fighters: ['beyond', 'padaille', 'lynch', 'rihan', 'basho'], retreat: 'rihan' },
] as const
const GROUND_COMMANDS = [
  ['standingLight', 'light', {}],
  ['standingHeavy', 'heavy', {}],
  ['lowLight', 'light', { down: true }],
  ['lowHeavy', 'heavy', { down: true }],
  ['forwardLight', 'light', { right: true }],
  ['forwardHeavy', 'heavy', { right: true }],
  ['backHeavy', 'heavy', { left: true }],
] as const

describe.each(COHORTS)(
  'wave $wave styles before Hatsu activation',
  ({ fighters, retreat: counter }) => {
    it('separates forward speed, retreat speed, dash duration and jump height', () => {
      const traces = fighters.map((id) => {
        const start = round(id)
        const advance = step(start, 12, { right: true })
        const retreat = step(start, 12, { left: true })
        const dash = step(step(step(start, 1, { right: true }), 2), 1, { right: true })
        const jump = step(start, 19, { jump: true })
        return [
          advance.player.x,
          retreat.player.x,
          motionOf(dash.player).dash?.frames,
          jump.player.y,
        ]
      })
      for (const column of [0, 1, 2, 3]) {
        expect(traces.every((trace) => trace[column] !== undefined)).toBe(true)
        expect(new Set(traces.map((trace) => trace[column])).size).toBe(5)
      }
    })

    it.each(GROUND_COMMANDS)(
      'executes five different grounded %s timelines and drive profiles',
      (slot, action, keys) => {
        const poses = []
        const drive = []
        for (const id of fighters) {
          const start = round(id)
          const attack = applyReplayCommand(start, {
            kind: 'move',
            side: 'player',
            action,
            input: packReplayInput({ ...EMPTY_INPUT, ...keys }),
          })
          expect(attack.player.attack).toMatchObject({
            moveId: `${id}:${slot}`,
            auraCharged: false,
          })
          expect(attack.player.aura).toBe(start.player.aura)
          const { startup } = attackData(action, attack.player)
          drive.push(step(attack, startup).player.x - start.player.x)
          poses.push(
            keyPoseTimeline(id, slot)?.find(({ phase, at }) => phase === 'active' && at === 0)
              ?.pose,
          )
        }
        expect(new Set(drive).size).toBe(5)
        expect(poses.every(Boolean)).toBe(true)
        expect(new Set(poses.map((pose) => JSON.stringify(pose))).size).toBe(5)
        if (slot === 'backHeavy')
          expect(drive[fighters.findIndex((id) => id === counter)]).toBeLessThan(-1)
      },
    )
  },
)
