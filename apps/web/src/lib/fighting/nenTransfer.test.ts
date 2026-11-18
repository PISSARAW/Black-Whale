import { expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { focusNenZone } from './nenAdvanced'
import { releaseFocusedAura, applyAuraContext } from './nen'
import { advanceNenTransfer, nenTransferFrames } from './nenTransfer'
import { EMPTY_INPUT } from './types'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s carries outgoing aura into a different zone without teleporting it',
  (id) => {
    const fighter = createFight(id, 'hisoka').player
    const old = focusNenZone(fighter, 'hands')
    const incoming = focusNenZone(releaseFocusedAura(old), 'feet')
    expect(incoming.nen.ryu.hands).toBeCloseTo(0.76)
    expect(incoming.nen.ryu.feet).toBeCloseTo(0.08)
    const middle = advanceNenTransfer(incoming, 1 / 60)
    expect(middle.nen.ryu.feet).toBeGreaterThan(0.08)
    expect(middle.nen.ryu.feet).toBeLessThan(0.76)
    expect(Object.values(middle.nen.ryu).reduce((n, v) => n + Number(v), 0)).toBeCloseTo(1)
    expect(focusNenZone(middle, 'feet').nenTransfer?.age).toBe(middle.nenTransfer?.age)
    const final = advanceNenTransfer(middle, 1)
    expect(final.nen.ryu.feet).toBeCloseTo(0.76)
    expect(final.nenTransfer).toBeUndefined()
    expect(
      advanceNenTransfer({ ...incoming, nen: { ...incoming.nen, mode: 'zetsu' } }, 1).nenTransfer,
    ).toBeUndefined()
  },
)

it('advances with native ticks, freezes in hitstop, and makes a paid Ko zone change punishable', () => {
  let state = beginFight(createFight('hisoka', 'phinks', { mode: 'versus-local' }))
  state = { ...state, player: focusNenZone(focusNenZone(state.player, 'hands'), 'feet') }
  const frozen = tickFight({ ...state, hitstop: 3 }, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: EMPTY_INPUT,
  })
  expect(frozen.player.nenTransfer?.age).toBe(state.player.nenTransfer?.age)
  const guard = { ...EMPTY_INPUT, aura: true, guard: true, gyo: true, focusHead: true }
  const head = applyAuraContext(state.opponent, guard)
  const torso = applyAuraContext(head, { ...guard, focusHead: false, focusTorso: true })
  expect(torso.aura).toBe(head.aura - 20)
  expect(torso.nen.ko).toBeNull()
  expect(torso.nenTransfer?.ko).toBe(true)
  expect(applyAuraContext(torso, { ...guard, focusHead: false, focusTorso: true }).aura).toBe(
    torso.aura,
  )
  expect(
    applyAuraContext(torso, { ...guard, focusHead: false, focusTorso: true }).nen.ko,
  ).toBeNull()
  expect(advanceNenTransfer(torso, 1).nen.ko).toBe('torso')
  expect(nenTransferFrames(createFight('biscuit', 'hisoka').player)).toBeLessThan(
    nenTransferFrames(state.player),
  )
})
