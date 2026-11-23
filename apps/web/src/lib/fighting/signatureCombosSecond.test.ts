import { describe, expect, it } from 'vitest'
import {
  signatureCombo,
  signatureComboCounts,
  type SignatureCombo,
  type SignatureStep,
} from './signatureCombos'
import {
  createSignatureFight,
  playSignatureCombo,
  type SignatureDummy,
} from './signatureComboRunner'
import { riposteStep } from './signatureComboSteps'
import { createRisingSun } from './feitanSun'
import { throwKnockback } from './comboCapture'
import { canCancel } from './duelMoves'
import { hurtboxes } from './frameData'
import { moveForSlot } from './movesets'
import { tickFight } from './engine'
import { EMPTY_INPUT, type FightState } from './types'

const tick = (state: FightState, guard = true) =>
  tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: { ...EMPTY_INPUT, guard } })

function play(
  combo: SignatureCombo,
  steps: readonly SignatureStep[] = combo.steps,
  dummy: SignatureDummy = {},
) {
  const variant = { ...combo, steps }
  const start = createSignatureFight(variant, { mirrored: false, gap: 5 })
  return playSignatureCombo(variant, start, dummy)
}

describe('Dix secondes d’avance — Tserriednich', () => {
  const combo = signatureCombo('tserriednich:ten-seconds-ahead')
  const fighters = ['phinks', 'feitan', 'hisoka'] as const

  it.each(fighters)('diverges from a vision of %s attacking and lands the string unhurt', (id) => {
    const run = play({ ...combo, opponent: id }, combo.steps, { ai: true })
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.parallelFuture?.phase).toBe('diverging')
    expect(run.contacts.map((hit) => hit.combo)).toEqual(signatureComboCounts(combo))
    expect(run.contacts.some((hit) => hit.blocked)).toBe(false)
    expect(run.state.player.health).toBe(run.state.player.maxHealth)
    // Blind Spot relaunches out of Calculated Sweep and strikes the body it put down.
    expect(run.contacts.at(-1)?.move).toBe('tserriednich:forwardHeavy')
  })

  it.each(fighters)(
    'never dodges for him: eyes open and idle, %s’s predicted strike lands',
    (id) => {
      const opened = combo.steps.findIndex((step) => 'future' in step && step.future === 'open')
      const run = play({ ...combo, opponent: id }, combo.steps.slice(0, opened + 1), { ai: true })
      const future = run.state.parallelFuture!
      expect(future.phase).toBe('diverging')
      const predicted = future.frames.some((frame) => frame.player.health < run.state.player.health)
      expect(predicted).toBe(true)
      let state = run.state
      for (let i = 0; i < 120; i++) state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
      expect(state.player.health).toBeLessThan(run.state.player.health)
    },
  )

  it('keeps every hurtbox while crossing: the pass is never an invulnerability', () => {
    const run = play(combo, combo.steps.slice(0, 5))
    const fighter = run.state.player
    expect(fighter.futureDiverging).toBe(true)
    expect(fighter.motion?.dash?.through).toBe(true)
    expect(fighter.wakeupInvulnerableFrames).toBe(0)
    const plain = { ...fighter, motion: { ...fighter.motion!, dash: null } }
    expect(hurtboxes(fighter)).toEqual(hurtboxes(plain))
  })
})

describe('Douleur en vitesse — Feitan', () => {
  const combo = signatureCombo('feitan:pain-into-speed')

  /** Plays the route, then lets the sun burn out. */
  function burn(steps?: readonly SignatureStep[]) {
    const run = play(combo, steps)
    let state = run.state
    const before = state.opponent.health
    for (let i = 0; i < 260; i++) state = tick(state)
    return { run, state, heat: before - state.opponent.health }
  }

  it('packs exactly the riposte actually taken, and the sun burns in proportion', () => {
    const { run, heat } = burn()
    const taken = run.state.player.maxHealth - run.state.player.health
    const pain = run.state.player.hatsuEffects.painPacker!
    expect(taken).toBeGreaterThan(0)
    expect(pain.packedDamage).toBe(taken)
    const expected = createRisingSun(run.state.player, taken)
    expect(heat).toBeGreaterThan(0)
    expect(heat % Math.max(1, Math.round(expected.damage))).toBe(0)
  })

  it('burns harder after a harder riposte: the sun follows real injuries', () => {
    const heavier = combo.steps.map((step) =>
      'riposte' in step ? { riposte: 'standingHeavy' as const } : step,
    )
    const light = burn()
    const heavy = burn(heavier)
    expect(heavy.run.state.player.hatsuEffects.painPacker!.packedDamage).toBeGreaterThan(
      light.run.state.player.hatsuEffects.painPacker!.packedDamage,
    )
    expect(heavy.heat).toBeGreaterThan(light.heat)
  })

  it('refuses Pain Packer when no riposte was taken', () => {
    const steps = combo.steps.filter((step) => !('riposte' in step))
    const run = play(combo, steps)
    expect(run.reached).toBe(
      steps.findIndex((step) => 'move' in step && step.move === 'neutralSpecial'),
    )
    expect(run.state.player.hatsuEffects.painPacker?.armour ?? false).toBe(false)
  })

  it('holds the thrown body in the hot zone only while the outfit is worn', () => {
    const { player } = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const pain = { injuries: 0, packedDamage: 5, armour: true, sun: null }
    const armoured = { ...player, hatsuEffects: { ...player.hatsuEffects, painPacker: pain } }
    expect(throwKnockback({ variant: 'throw' }, armoured, 6)).toBe(0)
    expect(throwKnockback({ variant: 'throw' }, player, 6)).toBe(6)
    expect(throwKnockback({ variant: 'standing' }, armoured, 6)).toBe(6)
  })

  it('chains the retreating cut into the cleave only out of the crossing', () => {
    const cut = moveForSlot('feitan', 'backHeavy')!
    expect(cut.cancelInto).not.toContain('feitan:standingHeavy')
    const { player } = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const attack = {
      moveId: cut.id,
      kind: cut.kind,
      variant: cut.variant,
      confirmedHit: true,
      frame: 8,
      impacted: true,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    }
    expect(canCancel({ ...player, attack }, 'heavy', 'feitan:standingHeavy')).toBe(false)
    expect(
      canCancel({ ...player, attack: { ...attack, accel: true } }, 'heavy', 'feitan:standingHeavy'),
    ).toBe(true)
  })

  it('crossing is no invulnerability: a jab met mid-dash still lands', () => {
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const dash = { direction: 1 as const, frame: 0, frames: 19, peak: 126, accel: true as const }
    let state: FightState = {
      ...start,
      player: {
        ...start.player,
        motion: { ...start.player.motion!, dash: { ...dash, through: true } },
      },
    }
    const health = state.player.health
    for (let i = 0; i < 20 && state.player.health === health; i++)
      state = tick(riposteStep(state, 'standingLight', health).state, false)
    expect(state.player.health).toBeLessThan(health)
  })
})
