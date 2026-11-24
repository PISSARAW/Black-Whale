import { describe, expect, it } from 'vitest'
import type { ChrolloBookState } from '../../chrolloBook'
import { createCrowd } from '../crowd/create'
import type { CrowdState } from '../crowd/types'
import { apparentNature, puppetCensus } from './census'
import {
  FULL_SUN_CHARGE,
  chargeSun,
  closeGalleryFake,
  controlWithBlackVoice,
  copyByTouch,
  detonateMark,
  giveCollectiveOrder,
  isBomb,
  markMoon,
  markSun,
  stampCopy,
  steerPuppets,
  sunPower,
  triggerBombs,
} from './pipeline'

const PAGES = [
  'sun-and-moon',
  'black-voice',
  'gallery-fake',
  'order-stamp',
  'convert-hands',
] as const
const book = (
  open: (typeof PAGES)[number],
  bookmark: (typeof PAGES)[number] | null = null,
): ChrolloBookState => ({
  pages: [...PAGES],
  page: PAGES.indexOf(open),
  open: true,
  bookmark,
})
const GALLERY = book('gallery-fake', 'sun-and-moon')
const STAMP = book('order-stamp', 'sun-and-moon')

function copies(crowd: CrowdState, count: number, hisokaSees = false): CrowdState {
  let next = crowd
  for (let index = 0; index < count; index += 1)
    next = copyByTouch(next, { sourceId: `s${index}`, book: GALLERY, hisokaSees })
  return next
}

const ids = (crowd: CrowdState) =>
  crowd.spectators
    .filter((spectator) => spectator.nature === 'copy')
    .map((spectator) => spectator.id)

describe('the puppet pipeline', () => {
  it('copies a touched person only while Gallery Fake is active', () => {
    const crowd = createCrowd({ count: 40 })
    expect(
      copyByTouch(crowd, { sourceId: 's0', book: book('order-stamp'), hisokaSees: false }),
    ).toBe(crowd)
    const copied = copies(crowd, 1)
    const copy = copied.spectators.at(-1)!
    expect(copy).toMatchObject({ nature: 'copy', copyOf: 's0', look: crowd.spectators[0].look })
  })

  it('runs copy → Sun → Order Stamp → collective order → bombs', () => {
    let crowd = copies(createCrowd({ count: 80 }), 30, true)
    for (const id of ids(crowd).slice(0, 20)) crowd = markSun(crowd, id, GALLERY)
    crowd = closeGalleryFake(crowd)
    expect(puppetCensus(crowd)).toMatchObject({ copies: 20, sunMarked: 20, vanished: 10 })
    for (const id of ids(crowd)) crowd = stampCopy(crowd, id, STAMP)
    for (const id of ids(crowd).slice(0, 12)) crowd = markMoon(crowd, id, STAMP)
    crowd = giveCollectiveOrder(crowd, 'explode-near-hisoka')
    const census = puppetCensus(crowd)
    expect(census).toMatchObject({ stamped: 20, bombs: 12 })
    expect(
      crowd.spectators.filter(isBomb).every((bomb) => bomb.order === 'explode-near-hisoka'),
    ).toBe(true)
  })

  it('refuses Order Stamp on real people and a third Black Voice antenna', () => {
    const crowd = createCrowd({ count: 10 })
    expect(stampCopy(crowd, 's0', STAMP)).toBe(crowd)
    const voice = book('black-voice')
    let driven = controlWithBlackVoice(crowd, 's0', voice)
    driven = controlWithBlackVoice(driven, 's1', voice)
    expect(controlWithBlackVoice(driven, 's2', voice)).toBe(driven)
    expect(puppetCensus(driven).controlled).toBe(2)
  })

  it('lets a Black Voice carrier take the Moon mark to a remote Sun-marked body', () => {
    const crowd = markMoon(createCrowd({ count: 3 }), 's0', STAMP)
    expect(crowd.spectators[0].marks.moon).toBe(true)
    const sun = crowd.spectators[1].at
    const controlled = controlWithBlackVoice(crowd, 's0', book('black-voice'))
    const commanded = {
      ...controlled,
      spectators: controlled.spectators.map((spectator) =>
        spectator.id === 's0' ? { ...spectator, order: 'touch-sun' as const } : spectator,
      ),
    }
    const driven = steerPuppets(commanded, {
      hisoka: { x: 0, y: 0, z: 0 },
      chrollo: { x: 2, y: 0, z: 0 },
      sun,
    })
    expect(driven.spectators[0].marks.blackVoice).toBe(true)
    expect(driven.spectators[0].goal).toBe(sun)
  })

  it('splits shown copies from the reserve made out of Hisoka’s sight', () => {
    const shown = copies(createCrowd({ count: 80 }), 25, true)
    let reserve = shown
    for (let index = 25; index < 65; index += 1)
      reserve = copyByTouch(reserve, { sourceId: `s${index}`, book: GALLERY, hisokaSees: false })
    expect(puppetCensus(reserve)).toMatchObject({ visible: 25, reserve: 40, copies: 65 })
  })

  it('makes a fully charged mark stronger than an instant one', () => {
    let crowd = copies(createCrowd({ count: 5 }), 2)
    const [first, second] = ids(crowd)
    crowd = markSun(markSun(crowd, first, GALLERY), second, GALLERY)
    crowd = chargeSun(crowd, [second], FULL_SUN_CHARGE)
    const by = (id: string) => crowd.spectators.find((spectator) => spectator.id === id)!
    expect(sunPower(by(first))).toBe(1)
    expect(sunPower(by(second))).toBe(3)
    expect(detonateMark(crowd, second).blast?.power).toBe(3)
  })

  it('sends bombs to Hisoka and detonates them beside him', () => {
    let crowd = copies(createCrowd({ count: 20 }), 3)
    for (const id of ids(crowd))
      crowd = markMoon(stampCopy(markSun(crowd, id, GALLERY), id, STAMP), id, STAMP)
    crowd = giveCollectiveOrder(crowd, 'explode-near-hisoka')
    const hisoka = {
      x: crowd.spectators.at(-1)!.at.x + 0.6,
      y: crowd.spectators.at(-1)!.at.y,
      z: crowd.spectators.at(-1)!.at.z,
    }
    const steered = steerPuppets(crowd, { hisoka, chrollo: { x: 10, y: 0, z: 0 } })
    expect(steered.spectators.filter(isBomb).every((bomb) => bomb.goal === hisoka)).toBe(true)
    const { blasts } = triggerBombs(steered, hisoka)
    expect(blasts.length).toBeGreaterThanOrEqual(1)
  })

  it('never tells the Hisoka player a copy is a copy before he sees one break', () => {
    const crowd = copies(createCrowd({ count: 5 }), 1)
    const copy = crowd.spectators.at(-1)!
    expect(apparentNature(copy)).toBe('unknown')
    expect(apparentNature({ ...copy, revealedToHisoka: true })).toBe('copy')
  })
})
