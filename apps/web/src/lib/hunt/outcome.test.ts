import { describe, it, expect } from 'vitest'
import { CONTACT_RANGE, GAME_LENGTH, isOver, judgeHunt, playerWon, type Standing } from './outcome'

function standing(over: Partial<Standing> = {}): Standing {
  return {
    clock: 0,
    gap: 50,
    playerSpaceId: 'salon',
    targetSpaceId: 'chambre',
    hunterSpent: false,
    hunterHeld: false,
    ...over,
  }
}

describe('how a game ends', () => {
  it('is still being played when nothing has happened', () => {
    expect(judgeHunt(standing())).toBe('playing')
  })

  it('reaches contact at arm’s length', () => {
    expect(judgeHunt(standing({ gap: CONTACT_RANGE - 0.1 }))).toBe('contact')
    expect(judgeHunt(standing({ gap: CONTACT_RANGE + 0.1 }))).toBe('playing')
  })

  it('is won by standing in the marked room', () => {
    expect(judgeHunt(standing({ playerSpaceId: 'chambre' }))).toBe('reached')
  })

  it('runs out at ten minutes', () => {
    expect(judgeHunt(standing({ clock: GAME_LENGTH }))).toBe('timeUp')
  })
})

describe('elimination without contact — T4.4', () => {
  it('needs both: a hunter with nothing left, held by an entrave', () => {
    expect(judgeHunt(standing({ hunterSpent: true, hunterHeld: true }))).toBe('eliminated')
    expect(judgeHunt(standing({ hunterSpent: true }))).toBe('playing')
    expect(judgeHunt(standing({ hunterHeld: true }))).toBe('playing')
  })

  it('comes before contact: an entrave that kills him does not become a duel', () => {
    const both = standing({ hunterSpent: true, hunterHeld: true, gap: 0 })
    expect(judgeHunt(both)).toBe('eliminated')
  })

  it('comes before the clock: he dies at ten minutes rather than escaping it', () => {
    const late = standing({ hunterSpent: true, hunterHeld: true, clock: GAME_LENGTH })
    expect(judgeHunt(late)).toBe('eliminated')
  })
})

describe('reading an outcome', () => {
  it('treats contact as the one ending that is not an ending', () => {
    expect(isOver('contact')).toBe(false)
    expect(isOver('playing')).toBe(false)
    expect(isOver('caught')).toBe(true)
    expect(isOver('eliminated')).toBe(true)
  })

  it('counts reaching the room and killing him as the two wins', () => {
    expect(playerWon('reached')).toBe(true)
    expect(playerWon('eliminated')).toBe(true)
    expect(playerWon('caught')).toBe(false)
    expect(playerWon('timeUp')).toBe(false)
  })
})
