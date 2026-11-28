import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import {
  advanceCausalObjectLedger,
  beginCausalObjectLedger,
  recordObjectTouch,
} from './causalObjectLedger'

describe('causal object ledger', () => {
  it('keeps origin, motion, touch and destruction as a bounded causal history', () => {
    const initial = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    initial.battlefield!.entities = [
      {
        id: 'crate-1',
        kind: 'crate',
        owner: 'neutral',
        x: 50,
        y: 0,
        present: true,
        material: 'real',
        health: 40,
      },
    ]
    let state = beginCausalObjectLedger(initial)
    const entity = state.battlefield!.entities[0]
    const key = `entity:${entity.id}`
    state = {
      ...state,
      frame: 1,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === entity.id ? { ...entry, x: entry.x + 4 } : entry,
        ),
      },
    }
    state = advanceCausalObjectLedger(state)
    state = recordObjectTouch(state, key, { actor: 'player', cause: 'bungee-gum' })
    state = {
      ...state,
      frame: 2,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.filter((entry) => entry.id !== entity.id),
      },
    }
    state = advanceCausalObjectLedger(state)
    expect(state.causalObjectLedger?.records[key]).toMatchObject({
      origin: 'arena',
      events: [
        { kind: 'created' },
        { kind: 'moved' },
        { kind: 'touched', actor: 'player', cause: 'bungee-gum' },
        { kind: 'destroyed' },
      ],
      last: { present: false },
    })
  })

  it('does nothing until a system explicitly requests forensic tracking', () => {
    const state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    expect(advanceCausalObjectLedger(state)).toBe(state)
  })
})
