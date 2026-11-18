import { describe, expect, it } from 'vitest'
import { parsePvpPacket, parsePvpSetup } from './protocol'
import { createFightEnvironment } from '../fightEnvironment'
import { REPLAY_INPUT_MASK } from '../fightReplayInput'
import { FIGHTING_ROSTER } from '../roster'

const setup = () => ({
  player: 'kurapika',
  opponent: 'hisoka',
  formatId: 'knockout',
  environment: createFightEnvironment(),
})
const packet = (command: unknown) => ({ sequence: 0, input: 0, commands: [command] })
describe('Clash private network protocol', () => {
  it.each(FIGHTING_ROSTER)('accepts the ordinary scenario for $id', ({ id }) => {
    expect(parsePvpSetup({ ...setup(), player: id })?.player).toBe(id)
  })
  it('accepts all thirteen explicit resources including Musse history and actual paper', () => {
    const config = setup()
    config.environment = createFightEnvironment({
      preparation: {
        mode: 'scenario',
        resources: [
          'animals',
          'birds',
          'plants',
          'objects',
          'flutes',
          'needles',
          'rooms',
          'devices',
          'writing',
          'spirits',
          'people',
          'musse-history',
          'paper',
        ],
        cohorts: [],
      },
    })
    expect(parsePvpSetup(config)).toEqual(config)
  })
  it('preserves equipment, resources, consent, and chosen arena without accepting initial states', () => {
    const config = setup()
    config.environment = createFightEnvironment({
      stageId: 'heilly-hideout',
      morenaPresent: true,
      arenaInteractions: true,
      unlawfulIntruders: { player: true, opponent: false },
      needleStock: { player: false, opponent: true },
      preparation: { mode: 'scenario', resources: ['flutes', 'rooms'], cohorts: ['opponent'] },
    })
    expect(parsePvpSetup(config)).toEqual(config)
    expect(parsePvpSetup({ ...config, initial: 'forged' })).toBeNull()
    expect(parsePvpSetup({ ...config, mode: 'training' })).toBeNull()
    expect(parsePvpSetup({ ...config, environment: { ...config.environment, seed: 1 } })).toBeNull()
  })
  it.each([
    { kind: 'move', action: 'special', input: REPLAY_INPUT_MASK },
    { kind: 'emperor' },
    { kind: 'call' },
    { kind: 'offer' },
    { kind: 'respond', accept: false },
    { kind: 'easter', slot: 4 },
    { kind: 'battle', moveId: 'melody:neutralSpecial' },
    { kind: 'talk', words: 'Bonjour' },
    { kind: 'poem', text: 'Trois vers' },
    { kind: 'mary', command: 'infuse' },
    { kind: 'paper-use', command: 'serpent' },
    { kind: 'paper-target', zone: 'feet' },
    { kind: 'paper-command', command: 'doll' },
    { kind: 'blinky-target', target: 'bullet' },
    { kind: 'blinky-command', command: 'blood' },
    { kind: 'question', question: 'nen' },
  ])('serializes the semantic command $kind', (command) => {
    expect(parsePvpPacket(packet(command))).toEqual(packet(command))
  })
  it.each([
    { kind: 'panel', payload: 'arbitrary state patch' },
    { kind: 'start' },
    { kind: 'round' },
    { kind: 'move', side: 'opponent', action: 'light', input: 0 },
    { kind: 'move', action: 'heavy', input: -1 },
    { kind: 'move', action: 'unknown', input: 0 },
    { kind: 'emperor', health: 999 },
    { kind: 'respond', accept: 'true' },
    { kind: 'easter', slot: 0 },
    { kind: 'paper-target', zone: 'heart' },
    { kind: 'poem', text: 'x'.repeat(241) },
    { kind: 'mary', command: 'restore-all-blood' },
    { kind: '__proto__' },
  ])('rejects unsafe command $kind', (command) =>
    expect(parsePvpPacket(packet(command))).toBeNull(),
  )
  it('bounds sequences, input bits, batch size, and rejects client clocks and results', () => {
    const valid = { sequence: 0, input: REPLAY_INPUT_MASK, commands: [] }
    expect(parsePvpPacket(valid)).toEqual(valid)
    for (const change of [
      { sequence: NaN },
      { sequence: 0.5 },
      { input: REPLAY_INPUT_MASK + 1 },
      { dt: 0.05 },
      { winner: 'player' },
      { tick: 100 },
      { commands: Array(9).fill({ kind: 'call' }) },
    ])
      expect(parsePvpPacket({ ...valid, ...change })).toBeNull()
    expect(
      parsePvpSetup({
        ...setup(),
        environment: {
          ...setup().environment,
          preparation: { mode: 'scenario', resources: ['dragon'], cohorts: [] },
        },
      }),
    ).toBeNull()
  })
})
