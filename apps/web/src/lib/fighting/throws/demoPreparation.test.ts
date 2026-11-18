import { expect, it } from 'vitest'
import { prepareThrowDemo } from '../../../../ui-tests/fighting-throws/preparation'
import { preparedThrowOptions } from '../../../../ui-tests/fighting-throws/preparedOptions'
import { FIGHTING_ROSTER } from '../roster'
import { confirmedThrow } from '../throwCinematic'
import { throwPerformanceFor } from './catalogue'
import { throwCohortReady } from './sixthConditions'
import { throwBloodAvailable } from './bloodGrip'

const cases = FIGHTING_ROSTER.flatMap(({ id }) => (['player', 'opponent'] as const)
  .flatMap(side => [false, true].map(powered => ({ id, side, powered }))))
it.each(cases)('$id / $side / Aura=$powered prepares the exported throw', ({ id, side, powered }) => {
  const tape = prepareThrowDemo(preparedThrowOptions(id, powered, side))
  const contact = tape.find(state => confirmedThrow(state))
  expect(contact, 'a real confirmed throw must exist').toBeDefined()
  const frame = confirmedThrow(contact!)!
  expect(frame.attacker).toBe(side)
  expect(frame.powered).toBe(powered)
  expect(frame.performance).toBe(throwPerformanceFor(id, powered)?.id)
  expect(contact![side].id).toBe(id)
  expect(contact!.phase).toBe('fighting')
  expect(tape.at(-1)![side].attack).toBeNull()
  const options = preparedThrowOptions(id, powered, side)
  if (options.trueForm) expect(contact![side].biscuitTrueForm).toBe(true)
  if (options.prologue) expect(contact![side].battleCantabile?.prologue).toBe(true)
  if (options.poem) expect(contact![side].bashoPoem?.ready).toBe(true)
  if (options.cohort) expect(throwCohortReady(contact!, side)).toBe(true)
  if (options.bleed) expect(throwBloodAvailable(contact![side])).toBe(true)
  if (options.console) expect(contact![side].comboMaster).toBeTruthy()
  if (options.owl) expect(contact![side].secretWindow?.mode).toBe('listening')
  if (options.offer) {
    expect(contact!.moonlight?.offer?.issuer).toBe(side)
    expect(contact!.moonlight?.active).toBeUndefined()
  }
  if (options.bird) expect(contact!.battlefield?.entities.some(entity => entity.kind === 'bird' && entity.controller?.side === side && entity.controller.source === 'cluck')).toBe(true)
  if (options.plant) expect(contact!.battlefield?.entities.some(entity => entity.kind === 'seed' && entity.owner === side && entity.growth === 1)).toBe(true)
}, 30000)

it.each(['player', 'opponent'] as const)('keeps the %s throw sealed throughout the displayed film', side => {
  const tape = prepareThrowDemo({ id: 'shizuku', side, sealed: true })
  const contacts = tape.filter(state => confirmedThrow(state))
  expect(contacts.length).toBeGreaterThan(0)
  expect(contacts.every(state => state[side].hatsuEffects.hatsuStolen > 0)).toBe(true)
  expect(contacts.every(state => !confirmedThrow(state)?.performance)).toBe(true)
})
it.each(['player', 'opponent'] as const)('preserves miss and tech requests after %s preparation', side => {
  const miss = prepareThrowDemo({ id: 'bill', side, plant: true, miss: true })
  expect(miss.some(state => confirmedThrow(state))).toBe(false)
  const tech = prepareThrowDemo({ id: 'halkenburg', side, cohort: true, tech: true })
  expect(tech.some(state => state.throwTech)).toBe(true)
  expect(tech.some(state => confirmedThrow(state))).toBe(false)
})
