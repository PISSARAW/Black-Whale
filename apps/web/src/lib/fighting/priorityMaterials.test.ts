import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { performMachiMaterial, machiThreadStrength } from './machiMaterial'
import { advanceMachiThreads } from './machiThread'
import { performArsenalCommand } from './retrospectiveArsenal'
import { advanceDowsingEvidence, recordDowsingStatement } from './dowsingEvidence'
import { declareJudgment, implantJudgment } from './judgmentAction'
import { advanceJudgmentHostages } from './judgmentHostages'
import { hurtboxes } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function ready(id: 'machi' | 'luini' | 'kurapika') {
  const s = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: ['objects', 'rooms', 'cameras', 'hostages'],
          cohorts: [],
        },
      },
    }),
  )
  return { ...s, player: { ...s.player, x: 25, aura: 100 }, opponent: { ...s.opponent, x: 30 } }
}
function frames(s: FightState, n: number) {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
describe('material applications preserve their conditions', () => {
  it('shortens a real strand, weakens it after detachment and releases the held body', () => {
    const s = ready('machi')
    const linked = {
      ...s,
      opponent: {
        ...s.opponent,
        x: 28,
        machiThread: { owner: 'player' as const, kind: 'bind' as const, x: 28, y: 0, length: 16 },
      },
    }
    const shortened = performMachiMaterial({
      state: linked,
      side: 'player',
      command: { action: 'machi-length', target: '4' },
    })
    expect(machiThreadStrength(shortened.opponent)).toBeGreaterThan(
      machiThreadStrength(linked.opponent),
    )
    const released = performMachiMaterial({
      state: shortened,
      side: 'player',
      command: { action: 'machi-detach' },
    })
    expect(advanceMachiThreads(released).opponent.machiThread?.kind).toBe('mark')
    expect(machiThreadStrength(released.opponent)).toBeLessThan(
      machiThreadStrength(shortened.opponent),
    )
  })
  it('sutures a real wound once, requires consent for another body, and cannot heal generic lost HP', () => {
    const s = ready('machi')
    const bruised = { ...s, player: { ...s.player, health: 40 } }
    expect(
      performMachiMaterial({
        state: bruised,
        side: 'player',
        command: { action: 'machi-suture', target: 'player' },
      }),
    ).toBe(bruised)
    const wounded = { ...bruised, player: { ...bruised.player, openWounds: 1 } }
    const healing = performMachiMaterial({
      state: wounded,
      side: 'player',
      command: { action: 'machi-suture', target: 'player' },
    })
    const healed = frames(healing, 31)
    expect(healed.player.health).toBe(52)
    expect(healed.player.openWounds).toBe(0)
    const other = { ...s, opponent: { ...s.opponent, health: 40, openWounds: 1 } }
    expect(
      performMachiMaterial({
        state: other,
        side: 'player',
        command: { action: 'machi-suture', target: 'opponent' },
      }),
    ).toBe(other)
  })
  it('attaches to an existing prop and pulls that same prop without creating a replacement', () => {
    const s = ready('machi')
    const linked = performMachiMaterial({
      state: s,
      side: 'player',
      command: { action: 'machi-anchor', target: 'player:crate' },
    })
    expect(linked.player.machiAnchor?.objectId).toBe('player:crate')
    const farther = {
      ...linked,
      player: {
        ...linked.player,
        x: 20,
        machiAnchor: { ...linked.player.machiAnchor!, length: 20 },
      },
      opponent: { ...linked.opponent, x: 80 },
    }
    const pulled = performMachiMaterial({
      state: farther,
      side: 'player',
      command: { action: 'machi-pull' },
    })
    expect(
      pulled.battlefield!.entities.find((entry) => entry.id === 'player:crate')!.x,
    ).toBeLessThan(29)
    expect(pulled.battlefield!.entities.length).toBe(s.battlefield!.entities.length)
  })
  it('selects a visited exit, exposes a partial Luini body and permits actual emergence', () => {
    let s: FightState = ready('luini')
    s = { ...s, player: { ...s.player, x: 20 } }
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'special',
      moveId: 'luini:neutralSpecial',
      auraCharged: false,
    })
    s = frames(s, 20)
    s = performArsenalAction(
      {
        state: s,
        side: 'player',
        command: { action: 'luini-select', target: 'door:player:destination' },
      },
      performAuraAttack,
    )
    s = performArsenalAction(
      { state: s, side: 'player', command: { action: 'luini-travel' } },
      performAuraAttack,
    )
    expect(s.player.luiniPassage).toMatchObject({ mode: 'door', exitX: 85, originX: 20 })
    expect(hurtboxes(s.player)).toHaveLength(2)
    s = frames(s, 20)
    const emerged = performArsenalAction(
      { state: s, side: 'player', command: { action: 'luini-emerge' } },
      performAuraAttack,
    )
    expect(emerged.player.luiniPassage).toBeUndefined()
    expect(emerged.player.x).toBe(85)
  })
  it('rejects metadata-only camera statements even under Emperor Time after meeting the subject', () => {
    let s: FightState = advanceDowsingEvidence(ready('kurapika'))
    s = recordDowsingStatement(s, { speaker: 'opponent', text: 'Je suis Kurapika.', lie: true })
    const camera = s.battlefield!.entities.find((entry) => entry.id === 'player:camera')!
    expect(camera.statements).toHaveLength(1)
    const command = {
      action: 'dowsing-video' as const,
      target: `${camera.id}|${camera.statements![0].sequence}`,
    }
    expect(performArsenalCommand(s, 'player', command)).toBe(s)
    s = { ...s, player: { ...s.player, kurapika: { ...s.player.kurapika!, emperorTime: true } } }
    const reading = performArsenalCommand(s, 'player', command)
    expect(reading).toBe(s)
    expect(reading.player.dowsingReading).toBeUndefined()
  })
  it('gives a direction for a known person without exposing intent or exact coordinates', () => {
    const met = advanceDowsingEvidence(ready('kurapika'))
    const moved = { ...met, opponent: { ...met.opponent, x: 80 } }
    const key = moved.player.dowsingAcquaintances![0].key
    const located = performArsenalCommand(moved, 'player', {
      action: 'dowsing-locate',
      target: key,
    })
    expect(located.player.dowsingLocation).toMatchObject({ direction: 'right' })
    expect(located.player.dowsingLocation).not.toHaveProperty('x')
  })
  it('requires the chain hand for the directional application and keeps Judgment applicable', () => {
    const base = beginFight(
      createFight('kurapika', 'hisoka', {
        mode: 'versus-local',
        environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
      }),
    )
    const met = advanceDowsingEvidence({
      ...base,
      player: { ...base.player, x: 25, aura: 100 },
      opponent: { ...base.opponent, x: 40 },
    })
    const command = {
      action: 'dowsing-locate' as const,
      target: met.player.dowsingAcquaintances![0].key,
    }
    const occupied = performArsenalCommand(met, 'player', {
      action: 'device-pickup',
      target: 'player:device:camera',
    })
    expect(occupied).not.toBe(met)
    expect(performArsenalCommand(occupied, 'player', command)).toBe(occupied)
    const bound = {
      ...met,
      player: {
        ...met.player,
        judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
      },
    }
    const attempted = performArsenalCommand(bound, 'player', command)
    expect(attempted.player.health).toBe(0)
    expect(attempted.player.dowsingLocation).toBeUndefined()
  })
  it('enforces a secret clause on real spoken disclosure and keeps existing clauses independent', () => {
    const s = ready('kurapika')
    const selected = { ...s, player: { ...s.player, judgmentPreset: 'secret' as const } }
    const sealed = implantJudgment(
      declareJudgment(selected, 'player', 'kurapika:finisher'),
      'player',
      'opponent',
    )
    expect(sealed.opponent.nen.mode).not.toBe('zetsu')
    const breached = performArsenalCommand(sealed, 'opponent', { action: 'judgment-reveal' })
    expect(breached.opponent.health).toBe(0)
  })
  it('binds the deadline to an actual hostage and distinguishes a handover from a fatal timeout', () => {
    const s = ready('kurapika')
    const selected = { ...s, player: { ...s.player, judgmentPreset: 'hostage-secret' as const } }
    const sealed = implantJudgment(
      declareJudgment(selected, 'player', 'kurapika:finisher'),
      'player',
      'opponent',
    )
    expect(sealed.opponent.judgmentChain?.hostageId).toBe('opponent:hostage')
    expect(advanceJudgmentHostages({ ...sealed, frame: 1801 }).opponent.health).toBe(0)
    const hostage = sealed.battlefield!.entities.find((entry) => entry.id === 'opponent:hostage')!
    const positioned = {
      ...sealed,
      player: { ...sealed.player, x: hostage.x - 4 },
      opponent: { ...sealed.opponent, x: hostage.x + 2 },
    }
    const handed = performArsenalCommand(positioned, 'opponent', {
      action: 'judgment-return-hostage',
      target: hostage.id,
    })
    expect(advanceJudgmentHostages({ ...handed, frame: 1801 }).opponent.health).toBeGreaterThan(0)
  })
})
