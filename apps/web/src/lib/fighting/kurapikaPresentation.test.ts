import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { createKurapikaPresentationClock } from './kurapikaPresentation'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { createCinematicDirector } from './cinematicDirector'
import { buildFightFigure } from './fighterFigure'
import { defaultFightComfort } from './fightComfort'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function fresh(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'kurapika' : 'chrollo',
      side === 'opponent' ? 'kurapika' : 'chrollo',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function advance(
  state: FightState,
  count: number,
  observe: (state: FightState) => unknown = () => {},
  guard: FightSide | null = null,
) {
  for (let i = 0; i < count; i++) {
    state = tickFight(state, guard === 'player' ? { ...EMPTY_INPUT, guard: true } : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: guard === 'opponent' ? { ...EMPTY_INPUT, guard: true } : EMPTY_INPUT,
    })
    observe(state)
  }
  return state
}
function cast(
  state: FightState,
  side: FightSide,
  kind: 'jail' | 'heal' | 'steal' | 'judgment' | 'dowsing',
) {
  if (kind === 'judgment') return performMove({ state, side, action: 'finisher' })
  const input = {
    ...EMPTY_INPUT,
    down: kind === 'heal',
    left: kind === 'steal',
    right: kind === 'dowsing',
  }
  // Facing-relative special selection uses the player's world-direction inputs.
  if (side === 'opponent') [input.left, input.right] = [input.right, input.left]
  return performMove({ state, side, action: 'special', input })
}

describe('Kurapika type 1 and type 2 presentation', () => {
  it.each(['player', 'opponent'] as const)(
    'starts Emperor Time once for %s, pauses and clears on exit or rewind',
    (side) => {
      const initial = fresh(side)
      const clock = createKurapikaPresentationClock(initial)
      const active = toggleEmperorTime(initial, side)
      expect(clock(active)[side].emperor).toBe(0)
      expect(clock(active)[side].emperor).toBe(0)
      const later = advance(active, 30)
      expect(clock(later)[side].emperor).toBe(30)
      expect(clock(toggleEmperorTime(later, side))[side].emperor).toBeNull()
      expect(clock(active)[side].emperor).toBeNull()
      expect(createKurapikaPresentationClock(active)(active)[side].emperor).toBeNull()
      const ended = createKurapikaPresentationClock(initial)
      ended(active)
      expect(ended({ ...active, phase: 'finished' })[side].emperor).toBeNull()
    },
  )

  it.each(['player', 'opponent'] as const)(
    'presents Chain Jail only after the real capture for %s',
    (side) => {
      const initial = fresh(side)
      const clock = createKurapikaPresentationClock(initial)
      const started = cast(initial, side, 'jail')
      const camera = createCinematicDirector({ viewer: () => side })
      camera.update(initial)
      camera.update(started)
      expect(clock(started)[side].jail).toBeNull()
      let captures = 0
      const target = side === 'player' ? 'opponent' : 'player'
      const state = advance(started, 60, (state) => {
        const detail = camera.update(state).detail
        if (state[target].chainJail) expect(detail?.eventId).toBe('kurapika.jail')
        if (clock(state)[side].jail === 0) captures++
      })
      expect(state[target].chainJail?.owner).toBe(side)
      expect(captures).toBe(1)
      const released = performMove({ state, side, action: 'special' })
      expect(clock(released)[side].jail).toBeNull()
    },
  )

  it('does not turn a blocked chain or a fatal non-Troupe vow into a capture', () => {
    const initial = fresh()
    const clock = createKurapikaPresentationClock(initial)
    const values: unknown[] = []
    const blocked = advance(
      cast(initial, 'player', 'jail'),
      50,
      (state) => values.push(clock(state).player.jail),
      'opponent',
    )
    expect(blocked.opponent.chainJail).toBeUndefined()
    expect(values.every((value) => value === null)).toBe(true)
    const other = beginFight(createFight('kurapika', 'theta', { mode: 'versus-local' }))
    const vows = createKurapikaPresentationClock(other)
    const dead = cast(other, 'player', 'jail')
    expect(dead.player.health).toBe(0)
    expect(vows(dead).player.jail).toBeNull()
  })

  it('distinguishes syringe contact, draining and completed theft without creating a held ability', () => {
    const initial = fresh()
    initial.opponent.aura = 20
    const clock = createKurapikaPresentationClock(initial)
    let drain = 0,
      stolen = 0
    const state = advance(cast(initial, 'player', 'steal'), 100, (state) => {
      const frames = clock(state).player
      if (frames.drain === 0) {
        drain++
        expect(state.opponent.drainingChain?.owner).toBe('player')
      }
      if (frames.steal === 0) {
        stolen++
        expect(state.player.kurapika?.held).toBeTruthy()
      }
    })
    expect(drain).toBe(1)
    expect(stolen).toBe(1)
    expect(state.opponent.stolenChainAbility?.owner).toBe('player')
  })

  it('announces the actual implanted Judgment clauses without damaging or executing the victim', () => {
    let state = toggleEmperorTime(fresh(), 'player')
    state = { ...state, player: { ...state.player, judgmentPreset: 'nen-contact' } }
    const director = createCinematicDirector()
    director.update(state)
    const clock = createKurapikaPresentationClock(state)
    const health = state.opponent.health
    let shown = false
    state = advance(cast(state, 'player', 'judgment'), 60, (state) => {
      clock(state)
      const detail = director.update(state).detail
      if (detail?.eventId === 'kurapika.judgment') {
        expect(detail.labelFr).toContain('Nen interdit')
        expect(detail.labelFr).toContain('Communication avec la Brigade interdite')
        shown = true
      }
    })
    expect(shown).toBe(true)
    expect(state.opponent.judgmentChain?.owner).toBe('player')
    expect(state.opponent.health).toBe(health)
  })

  it('keeps ordinary chains and Holy Chain in type 1 and bounds major shots to 1.4 seconds', () => {
    const initial = fresh()
    const director = createCinematicDirector()
    director.update(initial)
    let state = cast(initial, 'player', 'dowsing')
    expect(director.update(state).detail).toBeNull()
    advance(state, 60, (state) => expect(director.update(state).detail).toBeNull())
    state = { ...initial, player: { ...initial.player, health: initial.player.health - 40 } }
    const healing = createCinematicDirector()
    healing.update(state)
    state = advance(cast(state, 'player', 'heal'), 65, (state) =>
      expect(healing.update(state).detail).toBeNull(),
    )
    expect(state.player.health).toBeGreaterThan(initial.player.health - 40)
    const major = createCinematicDirector()
    major.update(initial)
    const active = toggleEmperorTime(initial, 'player')
    expect(major.update(active).detail?.eventId).toBe('kurapika.emperor')
    expect(major.update({ ...active, frame: 83 }).detail?.eventId).toBe('kurapika.emperor')
    expect(major.update({ ...active, frame: 84 }).detail).toBeNull()
  })

  it('follows rebuilt rigs, conceals new effects with In and restores them only with the viewer’s Gyo', () => {
    const initial = fresh()
    const scene = new THREE.Scene()
    const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
    const model = buildFightFigure({ THREE, glow, fighter: initial.player })
    const rival = buildFightFigure({ THREE, glow, fighter: initial.opponent })
    let figure = model.turns
    scene.add(model.root, rival.root)
    const comfort = defaultFightComfort()
    const effects = createKurapikaEffectScene({
      THREE,
      scene,
      worldX: fightWorldX,
      worldY: fightWorldY,
      figureOf: (side) => (side === 'player' ? figure : rival.turns),
      viewer: () => 'opponent',
      comfort: () => comfort,
    })
    effects.sync(initial, 0)
    let state = toggleEmperorTime(initial, 'player')
    effects.sync(state, 0)
    state = advance(state, 20)
    const replacement = buildFightFigure({ THREE, glow, fighter: state.player })
    scene.add(replacement.root)
    figure = replacement.turns
    effects.sync(state, 1)
    const eye = scene.getObjectByName('emperor-eye-spark:left')!
    expect(eye.visible).toBe(true)
    const position = eye.position.clone()
    replacement.root.position.x += 2
    effects.sync(state, 999)
    expect(eye.position.x - position.x).toBeCloseTo(2)
    const hidden = { ...state, player: { ...state.player, nen: { ...state.player.nen, in: true } } }
    effects.sync(hidden, 1000)
    expect(scene.getObjectByName('kurapika-major:player')!.visible).toBe(false)
    expect(scene.getObjectByName('kurapika-chains:player')!.visible).toBe(false)
    effects.sync(
      {
        ...hidden,
        opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, mode: 'ren', gyo: true } },
      },
      1001,
    )
    expect(scene.getObjectByName('kurapika-major:player')!.visible).toBe(true)
    comfort.flashes = false
    effects.sync(state, 1002)
    expect(scene.getObjectByName('kurapika-major:player')!.visible).toBe(false)
    effects.dispose()
    expect(scene.children).toEqual([model.root, rival.root, replacement.root])
  })
})
