import { describe, expect, it } from 'vitest'
import { abilityFirstVisibleChapter, loadAbilityVisibility } from './ability-visibility'

const chapters = new Map([
  ['ch-340', 340],
  ['ch-360', 360],
  ['ch-390', 390],
])
const appearances = new Map([['a', 360]])

describe('abilityFirstVisibleChapter', () => {
  it('prefers the chapter the catalogue declares', () => {
    const chapter = abilityFirstVisibleChapter(
      { id: 'a', ownerId: 'hisoka', firstVisibleChapterId: 'ch-390' },
      chapters,
      appearances,
    )
    expect(chapter).toBe(390)
  })

  it('falls back to the earliest dated canonical use', () => {
    const chapter = abilityFirstVisibleChapter(
      { id: 'a', ownerId: 'morena', userIds: ['hisoka'] },
      chapters,
      appearances,
    )
    expect(chapter).toBe(360)
  })

  it('returns null when nothing dates the ability', () => {
    expect(
      abilityFirstVisibleChapter({ id: 'unknown', ownerId: 'ghost' }, chapters, appearances),
    ).toBe(null)
  })
})

describe('loadAbilityVisibility', () => {
  it('withholds nothing when the reader has no cap', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.isVisible('bungee-gum', undefined)).toBe(true)
  })

  it('withholds an explicitly dated ability until its reveal chapter', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.firstVisibleChapter('stand-by-me')).toBe(414)
    expect(visibility.isVisible('stand-by-me', 413)).toBe(false)
    expect(visibility.isVisible('stand-by-me', 414)).toBe(true)
  })

  it('withholds an ability the catalogue cannot date while a cap is active', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.isVisible('not-a-real-ability', 400)).toBe(false)
    expect(visibility.isVisible('not-a-real-ability', undefined)).toBe(true)
  })

  it('does not reveal a later technique merely because its owner is already known', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.isVisible('stealth-dolphin', 340)).toBe(false)
  })
})
