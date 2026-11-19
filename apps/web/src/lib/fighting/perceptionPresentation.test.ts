import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { createPerceptionClock } from './perceptionPresentation'
import { createPerceptionAccentScene } from './perceptionAccentScene'
import { createSecretWindowScene } from './secretWindowScene'
import { createCinematicDirector } from './cinematicDirector'
import { observeComboMaster } from './comboMaster'
import { askLynchQuestion } from './lynchAction'
import { privateLynchReplies } from './lynchInterrogation'
import { resolveFightImpacts } from './combatImpact'
import { attackData } from './frameData'
import { defaultFightComfort } from './fightComfort'
import { IN_CHARGE_FRAMES } from './nen'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId, side: FightSide, animals = false): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: animals ? 'scenario' : 'duel',
          resources: animals ? ['animals'] : [],
          cohorts: [],
        },
      },
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: animals ? 25 : 42, aura: 100 },
    opponent: { ...s.opponent, x: animals ? 75 : 48, aura: 100 },
  }
}
function frames(s: FightState, n: number, watch: (state: FightState) => void = () => {}) {
  for (let i = 0; i < n; i++) {
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    watch(s)
  }
  return s
}
function punch(s: FightState, side: FightSide) {
  const armed = performAttack(s, side, 'light'),
    fighter = armed[side]
  return resolveFightImpacts(
    {
      ...armed,
      [side]: {
        ...fighter,
        attack: { ...fighter.attack!, frame: attackData('light', fighter).startup },
      },
    },
    [],
  )
}

describe('private type 1 surveillance, perception and replies', () => {
  for (const side of ['player', 'opponent'] as const) {
    const other = side === 'player' ? 'opponent' : 'player'
    it(`Musse ${side}: accents actual attachment and acquired observations only for the owner`, () => {
      const clock = createPerceptionClock(),
        hidden = createPerceptionClock(),
        camera = createCinematicDirector({ viewer: () => other })
      let s = duel('musse', side)
      clock(s, side)
      hidden(s, other)
      camera.update(s)
      const found = new Set<string>()
      s = frames(performAttack(s, side, 'special'), 35, (n) => {
        for (const e of clock(n, side)) found.add(e.kind)
        expect(hidden(n, other)).toEqual([])
        expect(camera.update(n).detail).toBeNull()
      })
      expect(s[side].secretWindow).toBeDefined()
      expect(found.has('watch')).toBe(true)
      const before = JSON.stringify(s)
      expect(clock(s, side)).toEqual(clock(s, side))
      expect(JSON.stringify(s)).toBe(before)
      s = frames(performAttack(s, other, 'light'), 1)
      const events = clock(s, side)
      expect(events.some((e) => e.kind === 'relay')).toBe(true)
      expect(JSON.stringify(events)).not.toContain('CONFIDENTIEL')
      expect(clock(s, other)).toEqual([])
      expect(createPerceptionClock()(s, side)).toEqual([])
    })
    it(`Sayird ${side}: requires a real controlled animal and creates no sensor facts`, () => {
      const clock = createPerceptionClock()
      const empty = duel('sayird', side)
      clock(empty, side)
      expect(clock(performAttack(empty, side, 'special'), side)).toEqual([])
      let s = duel('sayird', side, true)
      clock(s, side)
      s = performAttack(s, side, 'special')
      expect(clock(s, side)).toEqual([])
      s = frames(s, 8)
      const events = clock(s, side)
      expect(events).toMatchObject([
        { source: 'sayird', kind: 'watch', owner: side, subject: `${side}:animal` },
      ])
      expect(JSON.stringify(events)).not.toMatch(/observation|signature|answer|identity/)
      s = {
        ...s,
        [side]: { ...s[side], hatsuEffects: { ...s[side].hatsuEffects, forcedZetsuFrames: 30 } },
      }
      expect(clock(s, side)).toEqual([])
      expect(s.battlefield?.entities.some((e) => e.kind === 'animal' && e.present)).toBe(true)
    })
    it(`Furykov ${side}: accents only the console’s actual warning and readable signature`, () => {
      const clock = createPerceptionClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('furykov', side)
      clock(s, side)
      camera.update(s)
      s = performMove({ state: s, side, action: 'special' })
      expect(clock(s, side).some((e) => e.kind === 'console')).toBe(true)
      expect(camera.update(s).detail).toBeNull()
      s = performMove({
        state: { ...s, [other]: { ...s[other], hatsuChargeFrames: IN_CHARGE_FRAMES, aura: 100 } },
        side: other,
        action: 'special',
      })
      s = observeComboMaster(s)
      expect(s[side].comboMaster?.alert?.incoming).toBe(true)
      expect(clock(s, side).some((e) => e.kind === 'alert')).toBe(true)
      expect(camera.update(s).detail).toBeNull()
      expect(s[side].comboMaster?.alert?.signature).toBeNull()
      s = observeComboMaster({ ...s, [side]: { ...s[side], nen: { ...s[side].nen, gyo: true } } })
      const read = clock(s, side)
      expect(read.some((e) => e.kind === 'read')).toBe(true)
      expect(camera.update(s).detail).toBeNull()
      expect(JSON.stringify(read)).not.toContain('hisoka')
      s = observeComboMaster({ ...s, [other]: { ...s[other], attack: null } })
      expect(clock(s, side).filter((e) => e.kind === 'alert' || e.kind === 'read')).toEqual([])
    })
    it(`Lynch ${side}: a question alone creates no reply; real contact notifies both authorized participants without its text`, () => {
      const clock = createPerceptionClock(),
        target = createPerceptionClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('lynch', side)
      clock(s, side)
      target(s, other)
      camera.update(s)
      s = askLynchQuestion({ state: s, side, question: 'identity' }, performAuraAttack)
      expect(clock(s, side)).toEqual([])
      expect(camera.update(s).detail).toBeNull()
      const normal = punch(duel('lynch', side), side)
      s = punch(s, side)
      expect(s[other].health).toBe(normal[other].health)
      expect(privateLynchReplies(s, side)).toHaveLength(1)
      const reply = clock(s, side)
      expect(reply).toMatchObject([{ source: 'lynch', kind: 'reply', owner: side }])
      expect(target(s, other).some((e) => e.kind === 'reply')).toBe(true)
      expect(JSON.stringify(reply)).not.toMatch(/hisoka|nenMode|concealed|identity/)
      expect(camera.update(s).detail).toBeNull()
      expect(clock(nextRound({ ...s, phase: 'finished', winner: side }), side)).toEqual([])
    })
  }
  it('does not invent a relay while the acquired observation is unchanged', () => {
    let s = frames(performAttack(duel('musse', 'player'), 'player', 'special'), 60)
    const clock = createPerceptionClock()
    clock(s, 'player')
    s = frames(s, 5)
    expect(clock(s, 'player')).toEqual([])
    s = frames(performAttack(s, 'opponent', 'light'), 1)
    expect(clock(s, 'player').some((e) => e.kind === 'relay')).toBe(true)
  })
  it('freezes the private owl and its reticle on pause, resets on viewer change, and preserves owned resources', () => {
    let s = duel('musse', 'player'),
      viewer: FightSide = 'opponent',
      comfort = defaultFightComfort()
    const scene = new THREE.Scene(),
      options = {
        THREE,
        scene,
        worldX: (x: number) => x / 5,
        worldY: (y: number) => y / 5,
        viewer: () => viewer,
        comfort: () => comfort,
      }
    const owl = createSecretWindowScene(options),
      effect = createPerceptionAccentScene(options)
    owl.sync(s, 0)
    effect.sync(s, 0)
    s = frames(performAttack(s, 'player', 'special'), 35, (n) => {
      owl.sync(n, n.frame)
      effect.sync(n, n.frame)
    })
    const root = scene.getObjectByName('perception-type-one')!,
      bird = scene.getObjectByName('secret-window-player')!
    expect(root.children).toHaveLength(0)
    expect(bird.visible).toBe(false)
    viewer = 'player'
    owl.sync(s, 0)
    effect.sync(s, 0)
    expect(root.children).toHaveLength(0)
    s = frames(performAttack(s, 'opponent', 'light'), 1)
    owl.sync(s, 0)
    effect.sync(s, 0)
    expect(root.children).toHaveLength(1)
    let part: THREE.Mesh | undefined
    bird.traverse((n) => {
      if (n instanceof THREE.Mesh) part = n
    })
    const dispose = vi.spyOn(part!.geometry, 'dispose')
    const positions = [bird.position.toArray(), root.children[0].position.toArray()]
    owl.sync(s, 999)
    effect.sync(s, 999)
    expect([bird.position.toArray(), root.children[0].position.toArray()]).toEqual(positions)
    comfort = { ...comfort, camera: 0, flashes: false }
    owl.sync(s, 1000)
    effect.sync(s, 1000)
    expect(root.visible).toBe(false)
    expect(bird.visible).toBe(true)
    viewer = 'opponent'
    owl.sync(s, 1001)
    effect.sync(s, 1001)
    expect(root.children).toHaveLength(0)
    expect(bird.visible).toBe(false)
    effect.dispose()
    expect(dispose).not.toHaveBeenCalled()
    owl.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
