import { expect, it } from 'vitest'
import { createFight, beginFight, performAuraAttack } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { moveForSlot, canUseMovesetMove } from './movesets'
import { nenFollowupReadiness } from './nenComboReadiness'
import { focusNenZone } from './nenAdvanced'
import { advanceNenTransfer } from './nenTransfer'
import { canCancel } from './duelMoves'
import { usesVoluntaryNen } from './nenActionRules'

it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s keeps physical continuations while Nen waits for a real transfer',
  (id) => {
    let state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'light',
      moveId: `${id}:standingLight`,
      auraCharged: false,
    })
    const fighter = { ...state.player, attack: { ...state.player.attack!, confirmedHit: true } }
    const next = moveForSlot(id, 'neutralSpecial')
    if (!next) {
      expect(moveForSlot(id, 'standingHeavy')).not.toBeNull()
      return
    }
    const incoming = focusNenZone(focusNenZone(fighter, 'feet'), next.tuning.auraZone)
    const physical = moveForSlot(id, 'standingHeavy')!
    expect(nenFollowupReadiness(incoming, physical)).toBe('ready')
    if (usesVoluntaryNen(incoming, { kind: next.kind, moveId: next.id })) {
      if (incoming.nenTransfer) {
        expect(nenFollowupReadiness(incoming, next)).toBe('transfer')
        expect(canUseMovesetMove({ ...state, player: incoming }, 'player', next)).toBe(false)
        expect(canCancel(incoming, next.kind, next.id)).toBe(false)
      }
      expect(nenFollowupReadiness(advanceNenTransfer(incoming, 1), next)).toBe('ready')
    }
    expect(state.player.nenTransfer).toBeUndefined()
  },
)

it('keeps real supports and personal conditions in the admission path', () => {
  for (const id of ['bill', 'cluck', 'sayird', 'luini'] as const) {
    const state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    expect(canUseMovesetMove(state, 'player', moveForSlot(id, 'neutralSpecial')!)).toBe(false)
  }
  let state = beginFight(createFight('franklin', 'hisoka', { mode: 'versus-local' }))
  state = performAuraAttack({ state, side: 'player', kind: 'light', auraCharged: false })
  const fighter = {
    ...state.player,
    aura: 0,
    attack: { ...state.player.attack!, confirmedHit: true },
  }
  expect(nenFollowupReadiness(fighter, moveForSlot('franklin', 'neutralSpecial')!)).toBe('access')
})
