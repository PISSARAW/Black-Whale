import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { bindBiohazard } from './biohazardCapture'
import { biohazardDeviceAi } from './biohazardDeviceAi'
import { EMPTY_INPUT, type FightState, type FightSide } from './types'

function captured(side: FightSide = 'player'): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  let s = beginFight(
    createFight(
      side === 'player' ? 'hinrigh' : 'padaille',
      side === 'player' ? 'padaille' : 'hinrigh',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  s = {
    ...s,
    [side]: { ...s[side], x: 42 },
    [target]: { ...s[target], x: 46, padailleTool: 'axe' },
  }
  const object = { ...s[side].biohazard!.objects[0], phase: 'bound' as const, x: 46, life: 300 }
  s = {
    ...s,
    [side]: {
      ...s[side],
      biohazard: { objects: [object, ...s[side].biohazard!.objects.slice(1)] },
    },
  }
  return bindBiohazard(s, side, object)
}
function counter(state: FightState, side: FightSide = 'player') {
  return performArsenalAction(
    { state, side, command: { action: 'bio-axe-counter' } },
    performAuraAttack,
  )
}
function frames(s: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
describe('Hinrigh turns the opponent’s real axe arm back', () => {
  it.each(['player', 'opponent'] as const)(
    'performs a physical grab from %s without copying or manufacturing an axe',
    (side) => {
      const s = captured(side),
        target = side === 'player' ? 'opponent' : 'player'
      const started = counter(s, side)
      expect(started[side].attack?.variant).toBe('throw')
      expect(started[side].attack?.hatsuSource).toBeNull()
      expect(started[side].padailleTool).toBeUndefined()
      expect(started[side].aura).toBe(s[side].aura)
      const hit = frames(started, 10)
      expect(hit[target].health).toBeLessThan(s[target].health)
      expect(hit[target].openWounds).toBe(1)
      expect(hit[side].id).toBe('hinrigh')
      expect(hit[target].id).toBe('padaille')
      expect(hit.phase).toBe('fighting')
    },
  )
  it('lets the AI use the same conditional counter and records its actual order', () => {
    const s = captured('opponent')
    const next = biohazardDeviceAi(s, performAuraAttack)!
    expect(next.opponent.hinrighAxeCounter?.target).toBe('player')
    expect(next.arsenalTrace?.command.action).toBe('bio-axe-counter')
    const absent = { ...s, player: { ...s.player, padailleTool: undefined } }
    expect(biohazardDeviceAi({ ...absent, frame: 1 }, performAuraAttack)).toBeNull()
  })
  it('refuses an absent axe, a free arm or a distant target', () => {
    const s = captured()
    for (const target of [
      { ...s.opponent, padailleTool: 'drill' as const },
      { ...s.opponent, biohazardRestraint: undefined },
      { ...s.opponent, x: 80 },
    ]) {
      const invalid = { ...s, opponent: target }
      expect(counter(invalid)).toBe(invalid)
    }
  })
  it('cancels before contact if the actual axe disappears or Hinrigh is interrupted', () => {
    const s = counter(captured())
    for (const interrupted of [
      { ...s, opponent: { ...s.opponent, padailleTool: undefined } },
      { ...s, player: { ...s.player, attack: null, hitStun: 20 } },
    ]) {
      const next = frames(interrupted, 12)
      expect(next.opponent.health).toBe(s.opponent.health)
      expect(next.player.hinrighAxeCounter).toBeUndefined()
    }
  })
})
