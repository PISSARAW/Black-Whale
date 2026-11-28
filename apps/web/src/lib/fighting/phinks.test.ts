import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { transitionNen } from '@black-whale/nen-engine'
import {
  beginFight,
  createFight,
  nextRound,
  opponentAttack,
  performAttack,
  performAuraAttack,
  performMove,
  performThrow,
  tickFight,
} from './engine'
import { CYCLOTRON_ROTATION_FRAMES, CYCLOTRON_ROTATION_AURA } from './phinksCyclotron'
import { hatsuDamageFactor, triggerHatsu } from './hatsu'
import { finisherReady, moveForSlot, movesetFor } from './movesets'
import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { buildFightFigure } from './fighterFigure'
import { animateCyclotron } from './phinksMotion'
import { fightRigOf, type FightRig } from './fightRig'
import { selectVictory } from './victory/catalogue'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('phinks', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 80 },
  }
}

function advance(state: FightState, frames: number, input: Partial<FightInput> = {}): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
  return state
}

function charge(turns: number): FightState {
  return advance(performAttack(duel(), 'player', 'special'), turns * CYCLOTRON_ROTATION_FRAMES)
}

function punch(state: FightState): FightState {
  return performMove({ state, side: 'player', action: 'finisher' })
}

function strike(state: FightState): FightState {
  const fighter = state.player
  return resolveFightImpacts(
    {
      ...state,
      opponent: { ...state.opponent, x: 46 },
      player: {
        ...fighter,
        attack: { ...fighter.attack!, frame: attackData(fighter.attack!.kind, fighter).startup },
      },
    },
    [],
  )
}

describe('Phinks — right-arm rotations, then one Ripper Cyclotron punch', () => {
  it.each(['hitStun', 'blockStun', 'knockdownFrames'] as const)(
    'refuses to start or release while %s is active',
    (field) => {
      const base = charge(1)
      const locked = { ...base, player: { ...base.player, [field]: 10 } }
      expect(performAttack(locked, 'player', 'special')).toBe(locked)
      expect(punch(locked)).toBe(locked)
    },
  )
  it('starts a vulnerable wind-up without a hitbox, movement, charge or immediate aura payment', () => {
    const base = duel()
    const state = performAttack(base, 'player', 'special')
    expect(state.player).toMatchObject({
      x: 40,
      aura: 100,
      attack: null,
      blocking: false,
      cyclotronWindup: { frame: 0 },
    })
    expect(state.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(triggerHatsu(base, 'player', 'phinks').player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(state.opponent.health).toBe(base.opponent.health)
    expect(state.score).toEqual(base.score)
  })

  it('counts and pays only after one complete rotation, using fixed simulation frames', () => {
    const before = advance(
      performAttack(duel(), 'player', 'special'),
      CYCLOTRON_ROTATION_FRAMES - 1,
    )
    expect(before.player.hatsuEffects.cyclotronTurns).toBe(0)
    const after = advance(before, 1)
    expect(after.player.hatsuEffects.cyclotronTurns).toBe(1)
    expect(after.player.cyclotronWindup?.frame).toBe(0)
    expect(Math.floor(after.player.aura)).toBe(100 - CYCLOTRON_ROTATION_AURA)
    expect(charge(15).player.hatsuEffects.cyclotronTurns).toBe(15)
  })

  it('does not complete rotations during hitstop or when no simulated time passes', () => {
    const winding = advance(performAttack(duel(), 'player', 'special'), 12)
    expect(
      tickFight(winding, EMPTY_INPUT, { dt: 0, opponentInput: EMPTY_INPUT }).player.cyclotronWindup,
    ).toEqual(winding.player.cyclotronWindup)
    expect(advance({ ...winding, hitstop: 12 }, 12).player.cyclotronWindup).toEqual(
      winding.player.cyclotronWindup,
    )
  })

  // Rotation en mouvement (Dix tours, un poing): the arm keeps turning while Phinks moves
  // and strikes with ordinary blows; guard stops it and a throw stays refused.
  it('keeps winding while moving, jumping and striking; guard stops it, throws stay refused', () => {
    const state = charge(1)
    const moved = advance(state, 10, { right: true, jump: true })
    expect(moved.player.cyclotronWindup).toBeDefined()
    expect(moved.player.y > 0 || moved.player.x !== state.player.x).toBe(true)
    const struck = performAttack(state, 'player', 'light')
    expect(struck.player.attack?.moveId).toBe('phinks:standingLight')
    expect(advance(struck, 4).player.cyclotronWindup).toBeDefined()
    const back = state.player.facing === 1 ? { left: true } : { right: true }
    expect(advance(state, 4, { guard: true, ...back }).player.cyclotronWindup).toBeUndefined()
    expect(performThrow(state, 'player')).toBe(state)
  })

  it('pauses with L and discards only the incomplete turn; another L starts a fresh full turn', () => {
    const winding = advance(charge(2), 12)
    const paused = performAttack(winding, 'player', 'special')
    expect(paused.player.cyclotronWindup).toBeUndefined()
    expect(paused.player.hatsuEffects.cyclotronTurns).toBe(2)
    expect(advance(paused, 40).player.hatsuEffects.cyclotronTurns).toBe(2)
    const resumed = advance(performAttack(paused, 'player', 'special'), 35)
    expect(resumed.player.hatsuEffects.cyclotronTurns).toBe(2)
    expect(advance(resumed, 1).player.hatsuEffects.cyclotronTurns).toBe(3)
  })

  it('is interrupted by a real hit and loses the incomplete rotation without undoing the wound', () => {
    const winding = advance(charge(1), 10)
    winding.opponent = { ...winding.opponent, x: 46 }
    const struck = advance(performAttack(winding, 'opponent', 'light'), 12)
    expect(struck.player.health).toBeLessThan(winding.player.health)
    expect(struck.player.cyclotronWindup).toBeUndefined()
    expect(struck.player.hatsuEffects.cyclotronTurns).toBe(1)
  })

  it('keeps the charge and Nen at contact after a decisive punch spends them', () => {
    const charged = charge(3)
    const target = charged.opponent
    const released = punch({
      ...charged,
      opponent: { ...target, health: 1, nen: { ...target.nen, ken: true } },
    })
    const attacker = released.player
    const zone = attackData('special', attacker).auraZone
    const finished = strike({
      ...released,
      player: { ...attacker, nen: { ...attacker.nen, ko: zone } },
    })
    expect(finished).toMatchObject({ phase: 'finished', winner: 'player' })
    expect(finished.impact).toMatchObject({
      critical: true,
      phinksStrike: { frame: finished.frame, turns: 3, ken: true, ko: true },
    })
    expect(finished.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(finished.impact?.phinksStrike?.ten).toBeUndefined()
    expect(finished.impact?.phinksStrike?.ren).toBeUndefined()
    expect(selectVictory(finished)?.phinksStrike).toMatchObject({ turns: 3, ko: true, ken: true })
    expect(selectVictory({ ...finished, frame: finished.frame + 1 })?.phinksStrike).toMatchObject({
      turns: 0,
      ko: false,
      ken: false,
    })
  })

  it('captures the Ren that powers the punch and the Ten that absorbs it', () => {
    const charged = charge(2)
    const released = punch({
      ...charged,
      player: { ...charged.player, nen: { ...charged.player.nen, mode: 'ren' } },
      opponent: {
        ...charged.opponent,
        health: 1,
        nen: { ...charged.opponent.nen, mode: 'ten' },
      },
    })
    const finished = strike(released)
    expect(finished).toMatchObject({ phase: 'finished', winner: 'player' })
    expect(finished.impact).toMatchObject({
      critical: false,
      phinksStrike: { frame: finished.frame, turns: 2, ken: false, ten: true, ren: true },
    })
  })

  it('allows the charged punch after one full turn, with no invented four-turn minimum', () => {
    expect(finisherReady(duel(), 'player')).toBe(false)
    expect(punch(duel()).player.attack).toBeNull()
    const winding = charge(1)
    expect(finisherReady(winding, 'player')).toBe(true)
    const released = punch(winding)
    expect(released.player.attack).toMatchObject({
      moveId: 'phinks:finisher',
      kind: 'special',
      cyclotronTurns: 1,
      hatsuSource: 'phinks',
    })
    expect(released.player.cyclotronWindup).toBeUndefined()
    expect(released.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(released.player.aura).toBe(winding.player.aura)
  })

  it('makes only the charged right punch stronger as completed turns increase', () => {
    const one = strike(punch(charge(1)))
    const fifteen = strike(punch(charge(15)))
    expect(fifteen.impact!.damage).toBeGreaterThan(one.impact!.damage)
    expect(one.impact?.damage).toBeGreaterThan(0)
    expect(hatsuDamageFactor(charge(15).player)).toBe(1)
  })

  it.each(['light', 'heavy'] as const)(
    'gives no general bonus to an ordinary %s attack',
    (kind) => {
      const base = duel()
      const loaded = {
        ...base,
        player: {
          ...base.player,
          hatsuEffects: { ...base.player.hatsuEffects, cyclotronTurns: 15 },
        },
      }
      const plain = strike(performAttack(base, 'player', kind))
      const charged = strike(performAttack(loaded, 'player', kind))
      expect(charged.impact!.damage).toBe(plain.impact!.damage)
      expect(charged.player.hatsuEffects.cyclotronTurns).toBe(15)
    },
  )

  it('spends the punch on a miss and cannot reuse that charge for a second blow', () => {
    const charged = charge(3)
    const missed = advance(punch(charged), 60)
    expect(missed.opponent.health).toBe(charged.opponent.health)
    expect(missed.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(finisherReady(missed, 'player')).toBe(false)
    expect(punch(missed).player.attack).toBeNull()
  })

  it('keeps guard effective and spends the charge on block', () => {
    const released = punch(charge(3))
    const blocked = strike({
      ...released,
      opponent: { ...released.opponent, blocking: true, guardFrames: 20 },
    })
    expect(blocked.impact?.blocked).toBe(true)
    expect(blocked.player.hatsuEffects.cyclotronTurns).toBe(0)
  })

  it('does not restore a punch charge when the startup is interrupted', () => {
    const released = punch(charge(3))
    released.opponent.x = 46
    const interrupted = advance(performAttack(released, 'opponent', 'light'), 12)
    expect(interrupted.player.health).toBeLessThan(released.player.health)
    expect(interrupted.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(interrupted.player.attack).toBeNull()
  })

  it.each(['zetsu', 'stolen', 'forced'] as const)(
    'clears wind-up, reserve and in-flight enhancement when Nen is lost: %s',
    (reason) => {
      const state = charge(2)
      if (reason === 'zetsu')
        state.player.nen = transitionNen(state.player.nen, { type: 'ZETSU' }).state
      if (reason === 'stolen') state.player.hatsuEffects.hatsuStolen = 10
      if (reason === 'forced') state.player.hatsuEffects.forcedZetsuFrames = 10
      const cleared = advance(state, 1)
      expect(cleared.player.cyclotronWindup).toBeUndefined()
      expect(cleared.player.hatsuEffects.cyclotronTurns).toBe(0)
    },
  )

  it('has no invented special variants and never routes a normal cancel into charging', () => {
    const moves = movesetFor('phinks')!.moves
    expect(moves.filter((move) => move.category === 'special').map((move) => move.slot)).toEqual([
      'neutralSpecial',
    ])
    expect(moveForSlot('phinks', 'neutralSpecial')?.tuning.damage).toBe(0)
    expect(
      moves.every((move) => move.cancelInto.every((id) => !/Special$|:finisher$/.test(id))),
    ).toBe(true)
    expect(
      performAttack(performAttack(duel(), 'player', 'light'), 'player', 'special').player
        .cyclotronWindup,
    ).toBeUndefined()
  })

  it('makes Chrollo perform real rotations and spend the copied charge in a single punch', () => {
    const base = duel()
    const copied = {
      ...base,
      player: {
        ...createFight('chrollo', 'hisoka').player,
        x: 40,
        aura: 100,
        chrolloBook: { pages: ['phinks'] as const, page: 0, open: true, bookmark: null },
      },
    }
    const charged = advance(performAttack(copied, 'player', 'special'), CYCLOTRON_ROTATION_FRAMES)
    expect(charged.player.hatsuEffects.cyclotronTurns).toBe(1)
    const released = performAttack(charged, 'player', 'special')
    expect(released.player.attack?.cyclotronTurns).toBe(1)
    expect(strike(released).impact!.damage).toBeGreaterThan(0)
  })

  it('keeps a borrowed Dolphin use busy throughout winding, then releases and returns it', () => {
    const base = beginFight(
      createFight('kurapika', 'phinks', { mode: 'versus-local', formatId: 'knockout' }),
    )
    base.player.aura = 100
    base.player.kurapika = {
      ...base.player.kurapika!,
      emperorTime: true,
      held: {
        source: 'phinks',
        victim: 'opponent',
        moveId: 'phinks:neutralSpecial',
        loaded: true,
        used: false,
        sustainedKeys: [],
      },
    }
    base.opponent.stolenChainAbility = { owner: 'player', moveId: 'phinks:neutralSpecial' }
    const use = (state: FightState) =>
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'kurapika:backSpecial',
        auraCharged: false,
      })
    const winding = use(base)
    expect(winding.player.kurapika?.held?.sustainedKeys).toContain('cyclotron')
    expect(winding.player.hatsuEffects.cyclotronTurns).toBe(0)
    const loaded = advance(winding, CYCLOTRON_ROTATION_FRAMES)
    expect(loaded.player.hatsuEffects.cyclotronTurns).toBe(1)
    const released = use(loaded)
    expect(released.player.id).toBe('kurapika')
    expect(released.player.attack?.cyclotronTurns).toBe(1)
    const returned = use(advance(released, 50))
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
  })

  it('lets the AI wind from a distance and clears all charge between rounds', () => {
    const base = duel()
    const mirrored = {
      ...base,
      mode: 'versus-ai' as const,
      player: { ...base.opponent, x: 20 },
      opponent: { ...base.player, x: 80 },
    }
    expect(opponentAttack(mirrored).opponent.cyclotronWindup).toEqual({ frame: 0 })
    const recovering = {
      ...mirrored,
      opponent: {
        ...mirrored.opponent,
        nen: transitionNen(mirrored.opponent.nen, { type: 'ZETSU' }).state,
      },
    }
    expect(opponentAttack(recovering).opponent.nen.mode).not.toBe('zetsu')
    const ended = {
      ...charge(3),
      phase: 'finished' as const,
      winner: 'player' as const,
      matchWinner: null,
    }
    const reset = nextRound(ended)
    expect(reset.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(reset.player.cyclotronWindup).toBeUndefined()
  })

  it.each([1, -1] as const)(
    'rotates the anatomical right arm through a full circle, facing %s',
    (facing) => {
      const fighter = { ...duel().player, facing }
      const model = buildFightFigure({
        THREE,
        glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
        fighter,
      })
      let rig!: FightRig
      model.animate(0, 'idle', {
        motion: (human) => {
          rig = fightRigOf(human)
        },
      })
      const right = rig.human.arms.findIndex((arm) => arm.name === 'shoulder-right')
      const left = rig.human.arms.findIndex((arm) => arm.name === 'shoulder-left')
      const leftRotation = rig.human.arms[left].rotation.clone()
      animateCyclotron(rig, { ...fighter, cyclotronWindup: { frame: 9 } })
      expect(rig.human.arms[right].rotation.x).toBeCloseTo(-Math.PI / 2)
      animateCyclotron(rig, { ...fighter, cyclotronWindup: { frame: 18 } })
      expect(rig.human.arms[right].rotation.x).toBeCloseTo(-Math.PI)
      animateCyclotron(rig, {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, cyclotronTurns: 1 },
        cyclotronWindup: { frame: 0 },
      })
      expect(rig.human.arms[right].rotation.x).toBeCloseTo(-Math.PI * 2)
      expect(rig.human.arms[left].rotation.equals(leftRotation)).toBe(true)
      model.root.traverse((node) => {
        if ('geometry' in node) (node as THREE.Mesh).geometry.dispose()
      })
    },
  )
})
