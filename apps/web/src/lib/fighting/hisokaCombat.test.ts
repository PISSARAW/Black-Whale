import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performMove,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { hisokaAiSlots } from './hisokaAi'
import { moveHisokaOpponent } from './hisokaFootwork'
import { addGumLink } from './bungeeNetwork'
import { gumNetworkAi } from './bungeeAi'
import { styleMobility } from './styleMobility'
import { retrospectiveAiAction } from './retrospectiveAi'
import { fighterKeyedMove } from './fighterKeyedMove'
import { bodyPlan } from './fightBodyMotion'
import { attackData } from './frameData'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function duel(player: FighterId = 'phinks', arena = false): FightState {
  const state = beginFight(
    createFight(player, 'hisoka', {
      mode: 'versus-ai',
      formatId: 'arcade',
      ...(arena ? { environment: { stageId: 'heavens-arena' as const } } : {}),
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 38, aura: 100 },
    opponent: { ...state.opponent, x: 64, aura: 100 },
  }
}

describe('Hisoka reference combat', () => {
  it('mixes cards, sweeping kicks and a contact attachment instead of always opening with Gum', () => {
    const state = duel()
    const slots = [0.1, 0.4, 0.8].map((roll) => hisokaAiSlots({ state, gap: 7, roll }))
    expect(slots[0][0]).toBe('neutralSpecial')
    expect(slots[1][0]).toBe('lowLight')
    expect(slots[2][0]).toBe('backHeavy')
    expect(slots.flat()).not.toContain('downSpecial')
    expect(hisokaAiSlots({ state, gap: 20, roll: 0.1 })).toEqual([])
  })

  it('earns an elastic finish from a real attachment and a confirmed opening', () => {
    const base = duel()
    const state = addGumLink(base, {
      side: 'opponent',
      target: { kind: 'fighter', side: 'player' },
      hidden: false,
    })
    expect(hisokaAiSlots({ state, gap: 8, roll: 0.9 })[0]).not.toBe('finisher')
    const hit = { ...state, player: { ...state.player, hitStun: 20 } }
    expect(hisokaAiSlots({ state: hit, gap: 8, roll: 0.9 })[0]).toBe('finisher')
    expect(hisokaAiSlots({ state, gap: 20, roll: 0.2 })[0]).toBe('forwardSpecial')
  })

  it('prepares a paid, visible physical card at distance without waiting for a global frame lottery', () => {
    const base = duel()
    const state = { ...base, frame: 117 }
    const prepared = gumNetworkAi(state)!
    expect(prepared.opponent.gumThrowReady).toBeDefined()
    expect(prepared.opponent.aura).toBeLessThan(state.opponent.aura)
    expect(gumNetworkAi(prepared)).toBeNull()
  })

  it('withdraws only after seeing a threat and never gains an automatic evade or invulnerability', () => {
    const base = duel()
    const attack = performMove({
      state: { ...base, player: { ...base.player, x: 54 } },
      side: 'player',
      action: 'heavy',
    })
    const read = {
      clock: 100,
      move: attack.player.attack!.moveId,
      attackFrame: 11,
      seen: 11,
      lastHit: -1000,
      impact: -1,
    }
    const actor = { ...attack.opponent, pressureRead: read }
    expect(
      moveHisokaOpponent({ ...actor, pressureRead: { ...read, seen: 1 } }, attack.player),
    ).toBeNull()
    const moved = moveHisokaOpponent(actor, attack.player)!
    expect(moved.x).toBeGreaterThan(actor.x)
    expect(moved.motion?.dash?.direction).toBe(1)
    expect(moved.wakeupInvulnerableFrames).toBe(0)
    expect(moved.hatsuEffects.teleportDodges).toBe(0)
    expect(moveHisokaOpponent({ ...actor, hitStun: 10 }, attack.player)).toBeNull()
    expect(moveHisokaOpponent({ ...actor, parallelEyesClosed: true }, attack.player)).toBeNull()
  })

  it('keeps ordinary damage and guard available when pinned against the arena boundary', () => {
    const base = duel()
    let state = {
      ...base,
      player: { ...base.player, x: 86 },
      opponent: { ...base.opponent, x: 93 },
    }
    state = performMove({ state, side: 'player', action: 'heavy' })
    const read = {
      clock: 100,
      move: state.player.attack!.moveId,
      attackFrame: 11,
      seen: 11,
      lastHit: -1000,
      impact: -1,
    }
    expect(moveHisokaOpponent({ ...state.opponent, pressureRead: read }, state.player)).toBeNull()
    for (let i = 0; i < 35; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.opponent.health).toBeLessThan(base.opponent.health)
  })

  it('uses personal movement from either human seat without giving copied Gum its body mobility', () => {
    const state = duel()
    expect(styleMobility(state.opponent).backDash.frames).toBe(12)
    expect(
      styleMobility({
        ...state.opponent,
        id: 'chrollo',
        hatsuEffects: { ...state.opponent.hatsuEffects, stolenHatsu: 'hisoka' },
      }).backDash.frames,
    ).not.toBe(12)
  })

  it('intercepts only an observed physical object, paying for a vulnerable catch window', () => {
    let state = performAttack(duel('theta'), 'player', 'ranged')
    for (let i = 0; i < 22 && !state.projectiles.length; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    const shot = { ...state.projectiles[0], x: state.opponent.x - 14, y: 7 }
    expect(shot.matter).toBe('object')
    state = { ...state, projectiles: [shot] }
    const fresh = retrospectiveAiAction(state, performAuraAttack)
    expect(fresh?.opponent.gumCatch).toBeUndefined()
    const read = { key: `projectile:${shot.id}`, frames: 20, coveringEars: false }
    const observed = { ...state, opponent: { ...state.opponent, counterplayRead: read } }
    const caught = retrospectiveAiAction(observed, performAuraAttack)!
    expect(caught.opponent.gumCatch?.frames).toBe(24)
    expect(caught.opponent.aura).toBe(state.opponent.aura - 12)
    expect(caught.opponent.arenaRecovery).toBe(24)
    expect(
      retrospectiveAiAction(
        { ...observed, projectiles: [{ ...shot, matter: 'nen' }] },
        performAuraAttack,
      )?.opponent.gumCatch,
    ).toBeUndefined()
    const blind = { ...observed, opponent: { ...observed.opponent, parallelEyesClosed: true } }
    expect(retrospectiveAiAction(blind, performAuraAttack)?.opponent.gumCatch).toBeUndefined()
    const unrelated = {
      ...observed,
      opponent: { ...observed.opponent, counterplayRead: { ...read, key: 'heat:1' } },
    }
    expect(retrospectiveAiAction(unrelated, performAuraAttack)?.opponent.gumCatch).toBeUndefined()
  })

  it('draws a card and snaps the wrist on release in both facings, independently of render time', () => {
    const state = performAttack(duel(), 'opponent', 'ranged')
    const fighter = state.opponent
    const frames = attackData('ranged', fighter)
    const draw = { ...fighter, attack: { ...fighter.attack!, frame: frames.startup * 0.65 } }
    const release = { ...fighter, attack: { ...fighter.attack!, frame: frames.startup } }
    const context = { seconds: 0, progress: 0 }
    const a = bodyPlan(draw, context)!.pose
    const b = bodyPlan(release, context)!.pose
    expect(b.leadWrist![0]).toBeGreaterThan(a.leadWrist![0])
    expect(b.leadElbow![0]).toBeGreaterThan(a.leadElbow![0])
    expect(bodyPlan({ ...release, facing: 1 }, context)!.pose).toEqual(b)
    expect(bodyPlan(release, { ...context, seconds: 100 })!.pose).toEqual(b)
    const gum = performMove({ state: duel(), side: 'opponent', action: 'special' }).opponent
    expect(fighterKeyedMove(fighter, 'neutralSpecial').timeline).not.toEqual(
      fighterKeyedMove(gum, 'neutralSpecial').timeline,
    )
  })

  it('can choose a catch over generic guard and return the real object through native AI cadence', () => {
    let state = performAttack(duel('theta'), 'player', 'ranged')
    for (let i = 0; i < 22 && !state.projectiles.length; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = { ...state, opponent: { ...state.opponent, x: 78 } }
    let prepared = false,
      caught = false,
      returned = false
    for (let i = 0; i < 150; i++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
      prepared ||= Boolean(state.opponent.gumCatch?.frames)
      caught ||= Boolean(state.opponent.gumCatch?.projectile)
      returned ||= state.projectiles.some(
        (shot) => shot.owner === 'opponent' && shot.shape === 'bullet' && shot.matter === 'object',
      )
    }
    expect(prepared).toBe(true)
    expect(caught).toBe(true)
    expect(returned).toBe(true)
    expect(state.opponent.health).toBeLessThan(state.opponent.maxHealth)
  })

  it.each([false, true])(
    'fights with physical attacks, real card throws and finite movement through native AI ticks (arena=%s)',
    (arena) => {
      let state = duel('phinks', arena)
      state = {
        ...state,
        player: { ...state.player, x: 24 },
        opponent: { ...state.opponent, x: 72 },
      }
      const moves = new Set<string>()
      let card = false,
        dash = false,
        contacts = 0
      for (let frame = 0; frame < 1500 && state.phase === 'fighting'; frame++) {
        if (frame > 200 && frame % 90 === 0)
          state = performMove({ state, side: 'player', action: 'heavy' })
        state = tickFight(
          state,
          { ...EMPTY_INPUT, right: frame > 200 && state.player.x < state.opponent.x - 12 },
          { dt: 1 / 60, ai: true },
        )
        if (state.opponent.attack)
          moves.add(state.opponent.attack.moveId ?? state.opponent.attack.kind)
        card ||= state.projectiles.some(
          (shot) => shot.fighterId === 'hisoka' && shot.shape === 'card',
        )
        dash ||= Boolean(state.opponent.motion?.dash)
        if (state.impact?.attacker === 'opponent') contacts++
      }
      expect(card).toBe(true)
      expect(dash).toBe(true)
      expect([...moves].some((id) => /Light|Heavy/.test(id))).toBe(true)
      expect(contacts).toBeGreaterThan(0)
    },
  )

  it('records the new footwork and decisions deterministically', () => {
    let state = duel()
    const recorder = createReplayRecorder(state)!
    for (let frame = 0; frame < 240; frame++) {
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        frame % 90 === 0 ? [{ kind: 'move', side: 'player', action: 'heavy', input: 0 }] : [],
      ]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    const replay = createReplayPlayer(recorder.snapshot()!)
    while (!replay.done && !replay.error) replay.advance(0.05, 10)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
