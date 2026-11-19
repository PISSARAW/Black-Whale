import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { applyAuraContext } from './nen'
import { focusNenZone } from './nenAdvanced'
import { nenComboDecision } from './nenComboDecision'
import { focusCommand } from './nenFocusCommand'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT } from './types'
import { preparedNenDestinations } from './nenPreparedBranches'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s executes an actually earned branch after legal focus and a real contact',
  (id) => {
    let s = beginFight(createFight(id, 'beyond', { mode: 'versus-local' }))
    s = { ...s, player: { ...s.player, x: 44, aura: 100 }, opponent: { ...s.opponent, x: 49 } }
    s = { ...s, player: focusNenZone(s.player, 'hands') }
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'light',
      moveId: `${id}:standingLight`,
      auraCharged: false,
    })
    for (let i = 0; i < 50 && !s.player.nenOpening; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(s.player.nenOpening).toBeDefined()
    const earned = new Set(preparedNenDestinations(s.player))
    for (let i = 0; i < 30 && !s.player.nenConversionCount; i++) {
      const d = nenComboDecision(s, 'player')
      if (d.move) {
        if (!earned.has(d.move.id)) break
        s = performAuraAttack({
          state: s,
          side: 'player',
          kind: d.move.kind,
          moveId: d.move.id,
          auraCharged: false,
        })
      }
      const input = d.focus ? focusCommand(d.focus) : EMPTY_INPUT
      if (d.focus) s = { ...s, player: applyAuraContext(s.player, input) }
      s = tickFight(s, input, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    }
    expect(s.player.nenConversionCount, id).toBe(1)
    expect(s.player.nenBranchCount).toBe(1)
  },
)
