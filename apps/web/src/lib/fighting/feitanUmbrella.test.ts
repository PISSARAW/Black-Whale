import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import {
  advanceUmbrellaFeints,
  umbrellaScreensStrike,
  UMBRELLA_FEINT_FRAMES,
  UMBRELLA_OPEN_FRAMES,
} from './feitanUmbrella'
import { priorityLineOfSight } from './priorityOptics'
import { prepareDefence } from './combatDefence'
import { strikeRead } from './combatRead'
import { createUmbrellaFeintScene } from './feitanUmbrellaScene'
import { panelReplayCommand } from './fightReplayPanels'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { multiCombatAi } from './multiCombatAi'
import { EMPTY_INPUT, type FightState } from './types'

function ready(): FightState {
  const s = beginFight(
    createFight('feitan', 'hinrigh', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: { ...s.player, x: 40, aura: 100 },
    opponent: { ...s.opponent, x: 55, aura: 100 },
  }
}
function open(s = ready()) {
  return performArsenalAction(
    { state: s, side: 'player', command: { action: 'umbrella-feint' } },
    performAuraAttack,
  )
}
function frames(s: FightState, n: number): FightState {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function headRay(s: FightState) {
  return { x: s.opponent.x, y: s.opponent.y + 10, targetX: s.player.x, targetY: s.player.y + 10 }
}

describe('Feitan’s physical umbrella feint against Zazan', () => {
  it('needs the real weapon and free hands, spends no aura and does not attack or injure on opening', () => {
    const s = ready(),
      feint = open(s)
    expect(feint.player.umbrellaFeintFrames).toBe(UMBRELLA_FEINT_FRAMES)
    expect(feint.player.aura).toBe(s.player.aura)
    expect(feint.opponent.health).toBe(s.opponent.health)
    expect(feint.player.attack).toBeNull()
    expect(feint.player.arenaRecovery).toBe(UMBRELLA_OPEN_FRAMES)
    const confiscated = { ...s, player: { ...s.player, weaponsConfiscated: true } }
    expect(open(confiscated)).toBe(confiscated)
    const stolen = {
      ...s,
      player: { ...s.player, aura: 0, nen: { ...s.player.nen, mode: 'zetsu' as const } },
    }
    expect(open(stolen).player.umbrellaFeintFrames).toBe(UMBRELLA_FEINT_FRAMES)
    expect(open(feint)).toBe(feint)
  })
  it('only occludes the opened canopy’s actual axis, not a flank or an elevated view', () => {
    const started = open()
    expect(priorityLineOfSight(started, headRay(started))).toBe(true)
    const s = frames(started, UMBRELLA_OPEN_FRAMES)
    expect(priorityLineOfSight(s, headRay(s))).toBe(false)
    expect(priorityLineOfSight(s, { ...headRay(s), x: 35 })).toBe(true)
    expect(priorityLineOfSight(s, { ...headRay(s), y: 35 })).toBe(true)
    expect(priorityLineOfSight(frames(s, UMBRELLA_FEINT_FRAMES), headRay(s))).toBe(true)
  })
  it('allows ordinary guard, lets En sense the strike and does not turn Gyo into sight through cloth', () => {
    const s = frames(open(), UMBRELLA_OPEN_FRAMES)
    const armed = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'heavy',
      moveId: 'feitan:standingHeavy',
      auraCharged: false,
    })
    const actor = armed.player as typeof armed.player & {
      attack: NonNullable<typeof armed.player.attack>
    }
    const guard = {
      ...armed.opponent,
      blocking: true,
      guardFrames: 1,
      nen: { ...armed.opponent.nen, gyo: true },
    }
    const read = strikeRead(actor, guard)
    expect(read.physicalScreened).toBe(true)
    const blocked = prepareDefence(guard, 'torso', read)
    expect(blocked.blocked).toBe(true)
    expect(blocked.parried).toBe(false)
    const en = { ...guard, nen: { ...guard.nen, mode: 'ren' as const, en: { radius: 22 } } }
    expect(prepareDefence(en, 'torso', strikeRead(actor, en)).parried).toBe(true)
    expect(
      umbrellaScreensStrike({ ...actor, attack: { ...actor.attack, variant: 'low' } }, guard),
    ).toBe(false)
  })
  it('loses the screen after a real hit or confiscation without adding immunity', () => {
    const s = frames(open(), UMBRELLA_OPEN_FRAMES)
    const hit = { ...s, player: { ...s.player, hitStun: 12, health: s.player.health - 10 } }
    expect(priorityLineOfSight(hit, headRay(hit))).toBe(true)
    expect(advanceUmbrellaFeints(hit).player.umbrellaFeintFrames).toBeUndefined()
    const taken = { ...s, player: { ...s.player, weaponsConfiscated: true } }
    expect(advanceUmbrellaFeints(taken).player.umbrellaFeintFrames).toBeUndefined()
  })
  it('journals the physical command and replays its frame clock without changing RNG', () => {
    const s = ready(),
      feint = open(s),
      command = panelReplayCommand(s, feint)
    const replayed = executeReplayPacket(s, [1 / 60, 0, 0, [command]])
    expect(fightReplayHash(replayed)).toBe(fightReplayHash(frames(feint, 1)))
    expect(feint.rng).toBe(s.rng)
  })
  it('renders an opaque physical canopy, freezes on a paused state and releases its geometry', () => {
    const state = frames(open(), UMBRELLA_OPEN_FRAMES),
      scene = new THREE.Scene()
    const effect = createUmbrellaFeintScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(state)
    const canopy = scene.getObjectByName('feitan-umbrella:player')!
    expect(canopy.visible).toBe(true)
    const mesh = canopy.children[0] as THREE.Mesh
    expect((mesh.material as THREE.Material).transparent).toBe(false)
    const before = mesh.position.toArray()
    effect.sync(state)
    expect(mesh.position.toArray()).toEqual(before)
    effect.sync({ ...state, player: { ...state.player, umbrellaFeintFrames: undefined } })
    expect(canopy.visible).toBe(false)
    effect.dispose()
    expect(scene.getObjectByName('feitan-umbrella:player')).toBeUndefined()
  })
  it('makes the opponent use the same free physical command at an actual opening', () => {
    const s = ready(),
      ai = {
        ...s,
        player: { ...s.opponent, x: 40 },
        opponent: { ...s.player, x: 55, facing: -1 as const },
      }
    const chosen = multiCombatAi(ai)!
    expect(chosen.opponent.umbrellaFeintFrames).toBe(UMBRELLA_FEINT_FRAMES)
    expect(chosen.arsenalTrace?.command.action).toBe('umbrella-feint')
  })
})
