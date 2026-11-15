import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { attackData } from './frameData'
import { chooseStyleAttack, fightingStyle, styleMovement } from './fightStyles'
import type { FighterId } from './types'

const fighters: FighterId[] = [
  'kurapika',
  'hisoka',
  'chrollo',
  'morena',
  'benjamin',
  'tserriednich',
]

describe('character fighting styles', () => {
  it('gives every fighter an authored and visible identity', () => {
    const styles = fighters.map(fightingStyle)
    expect(new Set(styles.map(({ nameFr }) => nameFr)).size).toBe(fighters.length)
    expect(styles.every(({ descriptionFr }) => descriptionFr.length > 20)).toBe(true)
  })

  it('makes characters seek distances that suit them', () => {
    expect(styleMovement('kurapika', { gap: 10, health: 100 })).toBe(0)
    expect(styleMovement('benjamin', { gap: 10, health: 100 })).toBe(1)
    expect(styleMovement('morena', { gap: 10, health: 100 })).toBe(-1)
  })

  it('uses character-specific attack priorities', () => {
    const situation = { canSpecial: true, inRange: true, roll: 0.25 }
    expect(chooseStyleAttack('kurapika', situation)).toBe('special')
    expect(chooseStyleAttack('benjamin', situation)).toBe('heavy')
  })

  it('changes frame data as well as labels', () => {
    const hisoka = createFight('hisoka', 'kurapika').player
    const benjamin = createFight('benjamin', 'kurapika').player
    expect(attackData('light', hisoka).startup).toBeLessThan(attackData('light', benjamin).startup)
    expect(attackData('heavy', benjamin).damage).toBeGreaterThan(attackData('heavy', hisoka).damage)
  })
})
