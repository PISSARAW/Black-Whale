import { expect, it } from 'vitest'
import { beginFight, createFight, opponentAttack } from './engine'
import { createFastController } from './qwen/execution'
import { FIGHTING_ROSTER } from './roster'
import { moveCounterplayOpponent } from './counterplayOpponent'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s obeys recovery in both native and reactive control without granting a resource',
  (id) => {
    let s = beginFight(createFight(id, id, { mode: 'versus-ai' }))
    const intent = { goal: 'recover' as const, range: [26, 34] as const, reserve: 65, slots: [] }
    s = {
      ...s,
      frame: 120,
      player: { ...s.player, x: 30, aura: 20, nenTactics: intent },
      opponent: { ...s.opponent, x: 38, aura: 20, nenTactics: intent },
    }
    const before = structuredClone(s)
    const decision = createFastController('player')(s, {
      goal: 'pressure',
      nen: 'ryu',
      move: 'none',
    })
    expect(decision.command).toBeUndefined()
    expect(decision.utility).toBeUndefined()
    expect(decision.input.left).toBe(true)
    expect(decision.input.aura && decision.input.down).toBe(false)
    const cpu = opponentAttack(s)
    expect(cpu.opponent.attack).toBeNull()
    expect(cpu.opponent.aura).toBeLessThanOrEqual(s.opponent.aura)
    const walked = moveCounterplayOpponent({ state: s, fighter: s.opponent, target: s.player })
    expect(walked.x).toBeGreaterThanOrEqual(s.opponent.x)
    expect(s).toEqual(before)
  },
)
