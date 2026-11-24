import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { fighterKeyedMove } from './fighterKeyedMove'
import { fightStrikeLimb } from './fightStrikeLimb'
import { keyPoseTimeline } from './keyPoseMoves'
import { meleeWeaponContact } from './meleeWeaponContact'
import { animatePadailleWeapon } from './padailleFigure'
import { animateServiceHandgun } from './serviceHandgun'
import { EMPTY_INPUT, type ArcadeFighter, type FightSide } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

function ready(id: 'padaille' | 'sayird', side: FightSide) {
  return beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
    }),
  )
}

function contactPose(fighter: ArcadeFighter) {
  return fighterKeyedMove(fighter, 'standingHeavy').timeline.find(
    (key) => key.phase === 'active' && key.at === 0,
  )?.pose
}

describe('eighth wave weapon melee', () => {
  it.each(['player', 'opponent'] as const)(
    'uses the three actually selected Padaille tools for regular melee on %s',
    (side) => {
      const contacts = new Set<string>()
      const start = ready('padaille', side)
      const forward = side === 'player' ? { right: true } : { left: true }
      for (const [tool, direction] of [
        ['hammer', {}],
        ['drill', forward],
        ['axe', { down: true }],
      ] as const) {
        let state = performMove({
          state: { ...start, [side]: { ...start[side], aura: 100 } },
          side,
          action: 'special',
          input: { ...EMPTY_INPUT, ...direction },
        })
        expect(state[side].padailleTool).toBe(tool)
        for (let frame = 0; frame < 60; frame++) {
          state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
        }
        const strike = performMove({ state, side, action: 'heavy', input: EMPTY_INPUT })
        const fighter = strike[side]
        expect(fighter.attack?.moveId).toBe('padaille:standingHeavy')
        expect(fighter.aura).toBe(state[side].aura)
        expect(fightStrikeLimb(fighter, 'hands')).toBe('right')
        contacts.add(JSON.stringify(contactPose(fighter)))

        const model = buildFightFigure({ THREE, glow, fighter })
        animatePadailleWeapon(model.turns, fighter, 1)
        const contact = meleeWeaponContact(model.turns, fighter)
        const hand = model.root.getObjectByName('hand-right')
        expect(hand?.visible).toBe(false)
        expect(contact?.parent?.name).toBe(`padaille-${tool}-right-hand`)
        expect(contact?.parent?.parent).toBe(hand?.parent)
        expect(contact?.parent?.visible).toBe(true)

        const restored = { ...fighter, padailleTool: undefined }
        animatePadailleWeapon(model.turns, restored, 1)
        expect(hand?.visible).toBe(true)
        expect(meleeWeaponContact(model.turns, restored)).toBeUndefined()
        expect(fighterKeyedMove(restored, 'standingHeavy').timeline).toBe(
          keyPoseTimeline('padaille', 'standingHeavy'),
        )
      }
      expect(contacts.size).toBe(3)
    },
  )

  it.each(['player', 'opponent'] as const)(
    'draws Sayird’s pistol for a butt strike on %s',
    (side) => {
      const state = ready('sayird', side)
      const strike = performMove({
        state,
        side,
        action: 'heavy',
        input: { ...EMPTY_INPUT, left: side === 'player', right: side === 'opponent' },
      })
      const fighter = strike[side]
      expect(fighter.attack?.moveId).toBe('sayird:backHeavy')
      const model = buildFightFigure({ THREE, glow, fighter })
      animateServiceHandgun(model.turns, fighter)
      const handgun = model.turns.getObjectByName('sayird-handgun')
      expect(handgun?.visible).toBe(true)
      expect(handgun?.parent?.name).toBe('hand-right')
      expect(meleeWeaponContact(model.turns, fighter)).toBe(
        handgun?.getObjectByName('sayird-pistol-butt'),
      )
      expect(model.turns.getObjectByName('sayird-muzzle-flash')?.visible).toBe(false)
      expect(strike.projectiles).toHaveLength(0)
      const disarmed = { ...fighter, weaponsConfiscated: true }
      animateServiceHandgun(model.turns, disarmed)
      expect(handgun?.visible).toBe(false)
      expect(meleeWeaponContact(model.turns, disarmed)).toBeUndefined()
    },
  )
})
