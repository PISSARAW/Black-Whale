import { describe, expect, it } from 'vitest'
import { abilityFirstVisibleChapter, loadAbilityVisibility } from './ability-visibility'

const chapters = new Map([
  ['ch-340', 340],
  ['ch-360', 360],
  ['ch-390', 390],
])
const appearances = new Map([
  ['hisoka', 340],
  ['morena', 360],
])

describe('abilityFirstVisibleChapter', () => {
  it('prefers the chapter the catalogue declares', () => {
    const chapter = abilityFirstVisibleChapter(
      { id: 'a', ownerId: 'hisoka', firstVisibleChapterId: 'ch-390' },
      chapters,
      appearances,
    )
    expect(chapter).toBe(390)
  })

  it('falls back to the earliest appearance among owner and users', () => {
    const chapter = abilityFirstVisibleChapter(
      { id: 'a', ownerId: 'morena', userIds: ['hisoka'] },
      chapters,
      appearances,
    )
    expect(chapter).toBe(340)
  })

  it('returns null when nothing dates the ability', () => {
    expect(abilityFirstVisibleChapter({ id: 'a', ownerId: 'ghost' }, chapters, appearances)).toBe(
      null,
    )
  })
})

describe('loadAbilityVisibility', () => {
  it('withholds nothing when the reader has no cap', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.isVisible('bungee-gum', undefined)).toBe(true)
  })

  it('withholds an ability whose users all appear after the cap', async () => {
    const visibility = await loadAbilityVisibility()
    const chapter = visibility.firstVisibleChapter('bungee-gum')
    expect(chapter).not.toBe(null)
    expect(visibility.isVisible('bungee-gum', chapter! - 1)).toBe(false)
    expect(visibility.isVisible('bungee-gum', chapter!)).toBe(true)
  })

  it('never withholds an ability the catalogue cannot date', async () => {
    const visibility = await loadAbilityVisibility()
    expect(visibility.isVisible('not-a-real-ability', 0)).toBe(true)
  })
})
