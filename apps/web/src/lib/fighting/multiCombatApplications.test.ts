import { describe, it, expect } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { emptyBattleCantabile, BATTLE_MOVES } from './battleCantabileTypes'
import { battleAppearance } from './battleCantabileRules'
import { speakBattleWords } from './battleConversation'
import { privatePvpState } from './pvp/view'
import { releasePreparedControl } from './preparationActions'
import { advanceCorpseControls } from './illumiCorpses'
import { damageArenaObject } from './arenaSimulation'
import { performArenaAction } from './arenaActions'
import { multiCombatAi } from './multiCombatAi'
import { EMPTY_INPUT, type FightState, type FighterId, type FightSide } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(id: FighterId = 'illumi'): FightState {
  const s = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        arenaInteractions: id === 'illumi',
        preparation: {
          mode: 'scenario',
          resources: id === 'illumi' ? ['corpses'] : [],
          cohorts: [],
        },
      },
    }),
  )
  return { ...s, player: { ...s.player, aura: 100, x: 20 }, opponent: { ...s.opponent, x: 80 } }
}
function command(state: FightState, action: ArsenalCommand, side: FightSide = 'player') {
  return performArsenalAction({ state, side, command: action }, performAuraAttack)
}
function frames(s: FightState, n: number): FightState {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function controlled(): FightState {
  return frames(command(ready(), { action: 'illumi-corpse', target: 'player:corpse' }), 60)
}

describe('applications from at least three distinct combats', () => {
  it('selects a previously encountered Bonolenov model after its real opponent has changed', () => {
    let s = ready('bonolenov')
    s = { ...s, opponent: { ...s.opponent, x: 35 } }
    s = speakBattleWords(speakBattleWords(s, 'player'), 'opponent')
    s = frames(s, 120)
    const learned = s.player.battleCantabile!.models.hisoka!.frames
    s = { ...s, opponent: { ...createFight('shizuku', 'hisoka').player, x: 80 } }
    const selected = command(s, { action: 'bono-model', target: 'hisoka' })
    expect(selected.player.battleCantabile!.selectedModel).toBe('hisoka')
    const started = performAuraAttack({
      state: selected,
      side: 'player',
      kind: 'special',
      moveId: BATTLE_MOVES.metamorphosen,
      auraCharged: false,
    })
    expect(started.player.battleCantabile!.preparation).toMatchObject({
      model: 'hisoka',
      duration: learned,
    })
    const changed = frames(started, 45)
    expect(battleAppearance(changed.player)).toBe('hisoka')
    expect(changed.player.id).toBe('bonolenov')
    expect(changed.player.health).toBe(selected.player.health)
    expect(changed.player.battleCantabile!.form!.remaining).toBeLessThanOrEqual(learned)
  })
  it('refuses unknown, silent and merely observed models, and cannot change an active dance', () => {
    const s = ready('bonolenov')
    expect(command(s, { action: 'bono-model', target: 'hisoka' })).toBe(s)
    const silent = {
      ...s,
      player: {
        ...s.player,
        battleCantabile: {
          ...emptyBattleCantabile(),
          models: { hisoka: { frames: 100, spoken: false } },
        },
      },
    }
    expect(command(silent, { action: 'bono-model', target: 'hisoka' })).toBe(silent)
    const dance = {
      ...silent,
      player: {
        ...silent.player,
        battleCantabile: {
          ...silent.player.battleCantabile!,
          models: { hisoka: { frames: 100, spoken: true } },
          preparation: { piece: 'prologue' as const, remaining: 60, total: 60 },
        },
      },
    }
    expect(command(dance, { action: 'bono-model', target: 'hisoka' })).toBe(dance)
  })
  it('requires an actual corpse, physical needles, contact and an uninterrupted slow preparation', () => {
    const s = ready()
    const missing = { ...s, battlefield: undefined }
    expect(command(missing, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(missing)
    const bare = { ...s, player: { ...s.player, weaponsConfiscated: true } }
    expect(command(bare, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(bare)
    const far = { ...s, player: { ...s.player, x: 50 } }
    expect(command(far, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(far)
    const started = command(s, { action: 'illumi-corpse', target: 'player:corpse' })
    expect(started.player.aura).toBe(70)
    expect(started.player.corpsePreparation!.frames).toBe(60)
    expect(
      frames(started, 59).battlefield!.entities.find((body) => body.kind === 'corpse')!.controller,
    ).toBeUndefined()
    const hit = advanceCorpseControls({ ...started, player: { ...started.player, hitStun: 10 } })
    expect(hit.player.corpsePreparation).toBeUndefined()
    expect(
      hit.battlefield!.entities.find((body) => body.kind === 'corpse')!.controller,
    ).toBeUndefined()
  })
  it('moves the same material cadaver, leaves health unchanged and collapses it after needle removal', () => {
    const s = controlled(),
      corpse = s.battlefield!.entities.find((body) => body.id === 'player:corpse')!
    expect(corpse.controller).toEqual({ side: 'player', source: 'illumi' })
    const ordered = command(s, { action: 'illumi-corpse-order', target: `${corpse.id}|retreat` })
    const moved = frames(ordered, 10),
      target = moved.battlefield!.entities.find((body) => body.id === corpse.id)!
    expect(target.x).toBeGreaterThan(corpse.x)
    expect(target.health).toBe(corpse.health)
    expect(moved.battlefield!.entities.filter((body) => body.kind === 'corpse')).toHaveLength(2)
    const released = command(
      { ...moved, player: { ...moved.player, x: 24 } },
      { action: 'illumi-corpse-release', target: corpse.id },
    )
    expect(
      released.battlefield!.entities.find((body) => body.id === corpse.id)!.controller,
    ).toBeUndefined()
  })
  it('collapses both the visible body and its collider when a borrowed application is released', () => {
    const active = controlled()
    expect(
      active.battlefield!.entities.find((body) => body.id === 'player:corpse')!.arena!.height,
    ).toBe(12)
    const released = releasePreparedControl(active, 'player')
    const body = released.battlefield!.entities.find((entry) => entry.id === 'player:corpse')!
    expect(body.controller).toBeUndefined()
    expect(body.arena!.height).toBe(3)
    expect(body.health).toBe(60)
  })
  it('keeps scripted corpse speech at its physical source and private to actual listeners', () => {
    const s = controlled(),
      distant = command(s, { action: 'illumi-corpse-speak', target: 'player:corpse' })
    expect(distant.player.heardCorpse?.text).toContain('Tout est sous contrôle')
    expect(distant.opponent.heardCorpse).toBeUndefined()
    expect(privatePvpState(distant, 'opponent').opponent.heardCorpse).toBeUndefined()
    const nearby = command(
      { ...s, opponent: { ...s.opponent, x: 30 } },
      { action: 'illumi-corpse-speak', target: 'player:corpse' },
    )
    expect(nearby.opponent.heardCorpse?.source).toBe('player:corpse')
    expect(nearby.opponent.heardCorpse?.text).toBe(nearby.player.heardCorpse?.text)
  })
  it('rejects fabricated copies and occupied corpses, and drops control on Nen loss', () => {
    const s = ready(),
      bodies = s.battlefield!.entities
    const fake = {
      ...s,
      battlefield: {
        ...s.battlefield!,
        entities: bodies.map((entry) =>
          entry.id === 'player:corpse' ? { ...entry, material: 'nen' as const } : entry,
        ),
      },
    }
    expect(command(fake, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(fake)
    const active = controlled()
    expect(command(active, { action: 'illumi-corpse', target: 'player:corpse' })).toBe(active)
    const depleted = advanceCorpseControls({
      ...active,
      player: { ...active.player, nen: { ...active.player.nen, mode: 'zetsu' } },
    })
    expect(
      depleted.battlefield!.entities.find((body) => body.id === 'player:corpse')!.controller,
    ).toBeUndefined()
  })
  it('drops a destroyed body and lets Blinky remove a material corpse without reviving it', () => {
    const s = controlled()
    const broken = advanceCorpseControls(damageArenaObject(s, 'player:corpse', 100))
    expect(
      broken.battlefield!.entities.find((body) => body.id === 'player:corpse')!.controller,
    ).toBeUndefined()
    const initial = ready()
    const shizuku = createFight('shizuku', 'hisoka').player
    const source = { ...initial, player: { ...shizuku, x: 20, aura: 100, crouching: true } }
    const called = performArenaAction(source, 'player', performAuraAttack)
    expect(called.arena!.pending.player?.objectId).toBe('player:corpse')
    const swallowed = frames(called, 30)
    const corpse = swallowed.battlefield!.entities.find((body) => body.id === 'player:corpse')!
    expect(corpse.present).toBe(false)
    expect(corpse.health).toBe(60)
    expect(swallowed.player.blinky?.lastArenaObject).toBe(corpse.id)
  })
  it('refuses living and conjured scenery at the start and after an interrupted material premise', () => {
    const initial = ready(),
      actor = createFight('shizuku', 'hisoka').player
    const s = { ...initial, player: { ...actor, x: 20, aura: 100, crouching: true } }
    const change = (kind: 'corpse' | 'hostage', material: 'real' | 'nen') => ({
      ...s,
      battlefield: {
        ...s.battlefield!,
        entities: s.battlefield!.entities.map((entry) =>
          entry.id === 'player:corpse' ? { ...entry, kind, material } : entry,
        ),
      },
    })
    const nen = change('corpse', 'nen'),
      living = change('hostage', 'real')
    expect(performArenaAction(nen, 'player', performAuraAttack)).toBe(nen)
    expect(performArenaAction(living, 'player', performAuraAttack)).toBe(living)
    const began = performArenaAction(s, 'player', performAuraAttack)
    const altered = {
      ...began,
      battlefield: {
        ...began.battlefield!,
        entities: change('corpse', 'nen').battlefield.entities,
      },
    }
    expect(
      frames(altered, 30).battlefield!.entities.find((body) => body.id === 'player:corpse')!
        .present,
    ).toBe(true)
  })
  it('keeps Bonolenov’s remembered models and next selection out of the other PvP perspective', () => {
    const s = ready('bonolenov')
    const learned = {
      ...s,
      player: {
        ...s.player,
        battleCantabile: {
          ...emptyBattleCantabile(),
          selectedModel: 'lynch' as const,
          models: { lynch: { spoken: true, frames: 300 } },
          form: { model: 'hisoka' as const, duration: 120, remaining: 90 },
        },
      },
    }
    const view = privatePvpState(learned, 'opponent').opponent.battleCantabile!
    expect(view.models).toEqual({})
    expect(view.selectedModel).toBeUndefined()
    expect(view.form!.model).toBe('hisoka')
  })
  it('gives the AI the same physical corpse commands without summoning a subject', () => {
    const initial = beginFight(
      createFight('hisoka', 'illumi', {
        mode: 'versus-ai',
        environment: { preparation: { mode: 'scenario', resources: ['corpses'], cohorts: [] } },
      }),
    )
    const s = { ...initial, opponent: { ...initial.opponent, x: 74, aura: 100 } }
    const chosen = multiCombatAi(s)!
    expect(chosen.opponent.corpsePreparation?.target).toBe('opponent:corpse')
    expect(chosen.battlefield!.entities).toHaveLength(s.battlefield!.entities.length)
    expect(chosen.arsenalTrace?.command.action).toBe('illumi-corpse')
  })
})
