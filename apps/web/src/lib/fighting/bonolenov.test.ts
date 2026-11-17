import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { battleCanStart, stopBattleCantabile } from './battleCantabileAction'
import { reconcileBattleCantabile } from './battleCantabileFrame'
import { battleAppearance } from './battleCantabileRules'
import {
  BATTLE_DANCE_FRAMES,
  BATTLE_MOVES,
  BATTLE_SOUND_RANGE,
  emptyBattleCantabile,
} from './battleCantabileTypes'
import { speakBattleWords } from './battleConversation'
import { activeHitbox } from './frameData'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor, hatsuFor } from './hatsu'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { createProjectileScene } from './projectileScene'
import { advanceJupiter } from './jupiterFlight'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinCanUse } from './kurapikaDolphin'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FightInput,
  type FightSide,
  type FightState,
} from './types'

function duel(owner: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      owner === 'player' ? 'bonolenov' : 'hisoka',
      owner === 'opponent' ? 'bonolenov' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 24, aura: 100 },
    opponent: { ...state.opponent, x: 64, aura: 100 },
  }
}
function command(state: FightState, moveId: string, side: FightSide = 'player'): FightState {
  return performAuraAttack({ state, side, kind: 'special', moveId, auraCharged: false })
}
function step(state: FightState, frames: number, input: FightInput = EMPTY_INPUT): FightState {
  for (let frame = 0; frame < frames; frame++)
    state = tickFight(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function learned(): FightState {
  let state = duel()
  state.opponent.x = 38
  state = speakBattleWords(speakBattleWords(state, 'player'), 'opponent')
  return step(state, 120)
}
function sphere(state = duel()): FightState {
  return step(command(state, BATTLE_MOVES.jupiter), BATTLE_DANCE_FRAMES.jupiter)
}
const glow = (colour: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color: colour, opacity })

describe('Bonolenov — prepared Battle Cantabile pieces', () => {
  it.each(['player', 'opponent'] as const)(
    'prepares Prologue without any activation hit or generic buff (%s)',
    (owner) => {
      const ready = duel(owner)
      const dancing = command(ready, BATTLE_MOVES.prologue, owner)
      expect(dancing[owner].battleCantabile?.preparation?.piece).toBe('prologue')
      expect(dancing[owner].aura).toBe(60)
      expect(dancing[owner].x).toBe(ready[owner].x)
      expect(dancing[owner].attack).toBeNull()
      expect(activeHitbox(dancing[owner])).toBeNull()
      expect(hatsuDamageFactor(dancing[owner])).toBe(1)
      expect(hatsuDefenceFactor(dancing[owner])).toBe(1)
      expect(hatsuAvoidsImpact(dancing[owner])).toBe(false)
      const almost = step(dancing, BATTLE_DANCE_FRAMES.prologue - 1)
      expect(almost[owner].battleCantabile?.prologue).toBe(false)
      const complete = step(almost, 1)
      expect(complete[owner].battleCantabile?.prologue).toBe(true)
      expect(complete.score).toEqual(ready.score)
      expect(complete.impact).toBeNull()
      expect(complete.player.health).toBe(ready.player.health)
      expect(complete.opponent.health).toBe(ready.opponent.health)
    },
  )

  it('requires a conjured spear before the Prologue thrust', () => {
    const state = duel()
    expect(command(state, BATTLE_MOVES.spear)).toBe(state)
    const armed = step(command(state, BATTLE_MOVES.prologue), 60)
    const close = { ...armed, opponent: { ...armed.opponent, x: 42 } }
    const thrust = command(close, BATTLE_MOVES.spear)
    expect(thrust.player.attack?.moveId).toBe(BATTLE_MOVES.spear)
    expect(thrust.player.aura).toBeCloseTo(armed.player.aura - 12)
    const struck = step(thrust, 20)
    expect(struck.opponent.health).toBeLessThan(state.opponent.health)
    expect(hatsuDamageFactor(struck.player)).toBe(1)
    expect(hatsuDefenceFactor(struck.player)).toBe(1)
  })

  it('cannot attack, buffer or cancel a normal into an instant prepared piece', () => {
    const dancing = command(duel(), BATTLE_MOVES.prologue)
    expect(performMove({ state: dancing, side: 'player', action: 'light' })).toBe(dancing)
    expect(command(dancing, BATTLE_MOVES.jupiter)).toBe(dancing)
    expect(dancing.player.bufferedAttack).toBeNull()
    const striking = performMove({ state: duel(), side: 'player', action: 'light' })
    expect(command(striking, BATTLE_MOVES.prologue)).toBe(striking)
  })

  it.each([{ guard: true }, { jump: true }, { left: true }, { right: true }])(
    'interrupts an in-place dance on deliberate input %j',
    (patch) => {
      const state = step(command(duel(), BATTLE_MOVES.prologue), 1, { ...EMPTY_INPUT, ...patch })
      expect(state.player.battleCantabile?.preparation).toBeNull()
      expect(state.player.battleCantabile?.prologue).toBe(false)
      expect(state.player.aura).toBeLessThan(65)
    },
  )

  it('a real incoming hit breaks preparation in that same frame', () => {
    const ready = duel()
    ready.opponent.x = 30
    const attacked = performMove({
      state: command(ready, BATTLE_MOVES.prologue),
      side: 'opponent',
      action: 'light',
    })
    const struck = step(attacked, 10)
    expect(struck.player.health).toBeLessThan(ready.player.health)
    expect(struck.player.battleCantabile?.preparation).toBeNull()
    expect(struck.player.battleCantabile?.prologue).toBe(false)
  })

  it.each(['zetsu', 'forced-zetsu', 'stolen', 'chain', 'on', 'exhausted', 'dead'] as const)(
    'dissipates the pieces when Nen becomes unavailable: %s',
    (reason) => {
      const state = step(command(duel(), BATTLE_MOVES.prologue), 60)
      const fighter = state.player
      if (reason === 'zetsu') fighter.nen.mode = 'zetsu'
      if (reason === 'forced-zetsu') fighter.hatsuEffects.forcedZetsuFrames = 60
      if (reason === 'stolen') fighter.hatsuEffects.hatsuStolen = 1
      if (reason === 'chain')
        fighter.stolenChainAbility = { owner: 'opponent', moveId: BATTLE_MOVES.prologue }
      if (reason === 'on') fighter.on = { grudge: 0, sealFrames: 10 }
      if (reason === 'exhausted') fighter.auraExhausted = true
      if (reason === 'dead') fighter.health = 0
      expect(reconcileBattleCantabile(state).player.battleCantabile?.prologue).toBe(false)
      expect(command(state, BATTLE_MOVES.jupiter)).toBe(state)
    },
  )

  it('U and H both require a new Jupiter dance, without an ordinary aura shot', () => {
    const ready = duel()
    const ranged = performAuraAttack({
      state: ready,
      side: 'player',
      kind: 'ranged',
      auraCharged: false,
    })
    const finisher = performMove({ state: ready, side: 'player', action: 'finisher' })
    expect(ranged.player.battleCantabile).toEqual(finisher.player.battleCantabile)
    expect(ranged.player.aura).toBe(45)
    expect(ranged.projectiles).toHaveLength(0)
    expect(step(ranged, 89).projectiles).toHaveLength(0)
    const emitted = step(ranged, 90)
    expect(emitted.projectiles).toHaveLength(1)
    expect(emitted.projectiles[0]).toMatchObject({
      jupiter: true,
      width: 12,
      height: 12,
      concealed: false,
    })
    emitted.player.aura = 100
    expect(command(emitted, BATTLE_MOVES.jupiter)).toBe(emitted)
    const stopped = stopBattleCantabile(emitted, 'player')
    expect(stopped.projectiles).toHaveLength(0)
    const restarted = command(stopped, BATTLE_MOVES.jupiter)
    expect(restarted.player.battleCantabile?.preparation?.remaining).toBe(90)
  })

  it('tracks a moving target, including a reversal, inside earshot', () => {
    const state = sphere()
    const shot = state.projectiles[0]
    const ahead = advanceJupiter(state, shot, 1 / 60)!
    expect(ahead.x).toBeGreaterThan(shot.x)
    state.opponent.x = 7
    state.opponent.y = 8
    const reversed = advanceJupiter(state, ahead, 1 / 60)!
    expect(reversed.x).toBeLessThan(ahead.x)
    expect(reversed.y).toBeGreaterThan(ahead.y)
  })

  it('ends pursuit outside the music radius; blocking ears does not erase a spatial condition', () => {
    const state = sphere()
    state.opponent.coveringEars = true
    expect(advanceJupiter(state, state.projectiles[0], 1 / 60)).not.toBeNull()
    state.player.x = 7
    state.opponent.x = 7 + BATTLE_SOUND_RANGE + 1
    expect(advanceJupiter(state, state.projectiles[0], 1 / 60)).toBeNull()
    expect(step(state, 1).projectiles).toHaveLength(0)
  })

  it('crushes through the ordinary damage pipeline once, and can lose its musical source', () => {
    const state = sphere()
    const struck = step(state, 45)
    expect(struck.opponent.health).toBeLessThan(state.opponent.health)
    expect(struck.projectiles).toHaveLength(0)
    const later = step(struck, 60)
    expect(later.opponent.health).toBe(struck.opponent.health)
    const interrupted = sphere()
    interrupted.player.hitStun = 12
    expect(reconcileBattleCantabile(interrupted).projectiles).toHaveLength(0)
  })

  it('requires both local voices, proximity and a model-specific exchange', () => {
    let state = duel()
    expect(command(state, BATTLE_MOVES.metamorphosen)).toBe(state)
    expect(speakBattleWords(state, 'player')).toBe(state)
    state.opponent.x = 38
    state = step(speakBattleWords(state, 'player'), 2)
    expect(state.player.battleCantabile?.models.hisoka?.spoken).toBe(false)
    state = step(speakBattleWords(state, 'opponent'), 1)
    expect(state.player.battleCantabile?.models.hisoka?.spoken).toBe(true)
    expect(battleCanStart(state, 'player', BATTLE_MOVES.metamorphosen)).toBe(true)
    state.opponent.id = 'biscuit'
    expect(battleCanStart(state, 'player', BATTLE_MOVES.metamorphosen)).toBe(false)
  })

  it('cannot learn by silenced speech, deafness, or an unconscious reply', () => {
    for (const sealed of [2, 4]) {
      const state = duel()
      state.opponent.x = 38
      state.opponent.hatsuEffects.senseSeals = sealed
      const spoken = speakBattleWords(state, 'opponent')
      expect(spoken.opponent.battleUtteranceFrame).toBeUndefined()
      expect(step(spoken, 1).player.battleCantabile?.models.hisoka?.spoken).not.toBe(true)
    }
    const state = duel()
    state.opponent.x = 38
    state.opponent.knockdownFrames = 20
    const spoken = speakBattleWords(state, 'opponent')
    expect(spoken.opponent.battleUtteranceFrame).toBeUndefined()
    expect(step(spoken, 1).player.battleCantabile?.models.hisoka?.spoken).not.toBe(true)
  })

  it('an available AI can reply, without supplying words for the local human opponent', () => {
    const state = duel()
    state.opponent.x = 38
    state.mode = 'versus-ai'
    expect(
      step(speakBattleWords(state, 'player'), 1).player.battleCantabile?.models.hisoka?.spoken,
    ).toBe(true)
    state.mode = 'versus-local'
    expect(
      step(speakBattleWords(state, 'player'), 1).player.battleCantabile?.models.hisoka?.spoken,
    ).toBe(false)
  })

  it('counts nearby time with a previously learned unconscious model without inventing a new conversation', () => {
    const state = learned()
    const before = state.player.battleCantabile!.models.hisoka!.frames
    state.opponent.knockdownFrames = 20
    expect(step(state, 10).player.battleCantabile?.models.hisoka?.frames).toBe(before + 10)
  })

  it('Metamorphosen prepares then expires within earned time, without copying powers or extending itself', () => {
    const state = learned()
    const dancing = command(state, BATTLE_MOVES.metamorphosen)
    const duration = dancing.player.battleCantabile!.preparation!.duration!
    expect(dancing.player.battleCantabile?.form).toBeNull()
    const transformed = step(dancing, 45)
    expect(transformed.player.battleCantabile?.form).toMatchObject({
      model: 'hisoka',
      remaining: duration,
    })
    expect(battleAppearance(transformed.player)).toBe('hisoka')
    expect(transformed.player.id).toBe('bonolenov')
    expect(hatsuDamageFactor(transformed.player)).toBe(1)
    expect(hatsuDefenceFactor(transformed.player)).toBe(1)
    expect(hatsuAvoidsImpact(transformed.player)).toBe(false)
    expect(transformed.bungeeGum).toBeNull()
    const guarded = step(transformed, 1, { ...EMPTY_INPUT, guard: true })
    expect(guarded.player.battleCantabile?.form?.model).toBe('hisoka')
    expect(step(transformed, duration).player.battleCantabile?.form).toBeNull()
    expect(stopBattleCantabile(transformed, 'player').player.battleCantabile?.form).toBeNull()
  })

  it('shows the spear/attire and the model’s silhouette, with a giant banded Jupiter', () => {
    const state = step(command(duel(), BATTLE_MOVES.prologue), 60)
    const figure = buildFightFigure({ THREE, glow, fighter: state.player })
    expect(figure.root.getObjectByName('bonolenov-prologue-spear')).toBeDefined()
    expect(figure.root.getObjectByName('bonolenov-prologue-attire')).toBeDefined()
    const base = duel().player
    const copied: ArcadeFighter = {
      ...base,
      battleCantabile: {
        ...emptyBattleCantabile(),
        form: { model: 'hisoka', remaining: 60, duration: 60 },
      },
    }
    expect(fightFigureKey(copied)).not.toBe(fightFigureKey(base))
    const scene = new THREE.Scene()
    const renderer = createProjectileScene({
      THREE,
      scene,
      glow,
      geometry: (made) => made,
      worldX: (n) => n / 6,
      worldY: (n) => n / 6,
    })
    renderer.sync(sphere().projectiles, 0)
    const planet = scene.getObjectByName('bonolenov-jupiter:1')
    expect(planet).toBeDefined()
    expect(planet!.userData.visitModel).toBe('jupiter')
    const bounds = new THREE.Box3().setFromObject(planet!).getSize(new THREE.Vector3())
    const shot = sphere().projectiles[0]
    expect(bounds.x).toBeLessThanOrEqual(shot.width / 6 + 0.001)
    expect(bounds.y).toBeLessThanOrEqual(shot.height / 6 + 0.001)
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
  })

  it('cannot bypass the required body holes via Skill Hunter or load an unusable Dolphin', () => {
    const state = beginFight(createFight('chrollo', 'bonolenov', { mode: 'versus-local' }))
    state.player.chrolloBook = { pages: ['bonolenov'], page: 0, open: true, bookmark: null }
    expect(command(state, 'chrollo:neutralSpecial')).toBe(state)
    expect(hatsuFor('bonolenov').onTrigger({ state, side: 'player', source: 'bonolenov' })).toBe(
      state,
    )
    const borrowed = beginFight(createFight('kurapika', 'bonolenov', { mode: 'versus-local' }))
    borrowed.player.kurapika!.held = {
      source: 'bonolenov',
      victim: 'opponent',
      moveId: BATTLE_MOVES.prologue,
      loaded: false,
      used: false,
      sustainedKeys: [],
    }
    const active = toggleEmperorTime(borrowed, 'player')
    expect(command(active, 'kurapika:backSpecial')).toBe(active)
    expect(dolphinCanUse(active, 'player')).toBe(false)
    expect(active.player.kurapika?.held?.loaded).toBe(false)
    expect(toggleEmperorTime(active, 'player').player.kurapika?.emperorTime).toBe(false)
  })

  it('clears learned models and active pieces between rounds', () => {
    const state = learned()
    const reset = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(reset.player.battleCantabile).toBeUndefined()
    expect(reset.player.battleUtteranceFrame).toBeUndefined()
    expect(reset.projectiles).toHaveLength(0)
  })
})
