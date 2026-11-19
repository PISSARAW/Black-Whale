import { expect, it } from 'vitest'
import { prepareThrowDemo } from '../../../../ui-tests/fighting-throws/preparation'
import {
  preparedThrowOptions,
  THROW_DEMO_CATALOGUE,
} from '../../../../ui-tests/fighting-throws/preparedOptions'
import { FIGHTING_ROSTER } from '../roster'
import { confirmedThrow } from '../throwCinematic'
import { throwPerformanceFor } from './catalogue'
import { throwCohortReady } from './sixthConditions'
import { throwBloodAvailable } from './bloodGrip'
import { lsdfCanPersist } from '../lsdf'

const cases = FIGHTING_ROSTER.flatMap(({ id }) =>
  (['player', 'opponent'] as const).flatMap((side) =>
    [false, true].map((powered) => ({ id, side, powered })),
  ),
)
it.each(cases)(
  '$id / $side / Aura=$powered prepares the exported throw',
  ({ id, side, powered }) => {
    const tape = prepareThrowDemo(preparedThrowOptions(id, powered, side))
    const victim = side === 'player' ? 'opponent' : 'player'
    expect(tape[0].phase).toBe('fighting')
    expect(tape[0][victim].health, 'preparation must not hurt the demonstration partner').toBe(
      tape[0][victim].maxHealth,
    )
    const contact = tape.find((state) => confirmedThrow(state))
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
    if (options.bird)
      expect(
        contact!.battlefield?.entities.some(
          (entity) =>
            entity.kind === 'bird' &&
            entity.controller?.side === side &&
            entity.controller.source === 'cluck',
        ),
      ).toBe(true)
    if (options.tool) expect(contact![side].padailleTool).toBe(options.tool)
    if (options.animal)
      expect(
        contact!.battlefield?.entities.some(
          (entity) =>
            entity.kind === 'animal' &&
            entity.material === 'real' &&
            entity.controller?.side === side &&
            entity.controller.source === 'sayird',
        ),
      ).toBe(true)
    if (options.relay)
      expect(
        contact!.battlefield?.entities.some(
          (entity) =>
            entity.kind === 'crate' &&
            entity.material === 'real' &&
            entity.id === contact![side].sweetHomeObject,
        ),
      ).toBe(true)
    if (options.door) expect(contact!.voconteDoors?.networks[side]?.active).toBe(true)
    if (options.guards) {
      expect(contact!.lsdf?.[side]).toBeTruthy()
      expect(lsdfCanPersist(contact!, side)).toBe(true)
    }
    if (options.plant)
      expect(
        contact!.battlefield?.entities.some(
          (entity) => entity.kind === 'seed' && entity.owner === side && entity.growth === 1,
        ),
      ).toBe(true)
  },
  30000,
)

it.each(['player', 'opponent'] as const)(
  'keeps the %s throw sealed throughout the displayed film',
  (side) => {
    const tape = prepareThrowDemo({ id: 'shizuku', side, sealed: true })
    const contacts = tape.filter((state) => confirmedThrow(state))
    expect(contacts.length).toBeGreaterThan(0)
    expect(contacts.every((state) => state[side].hatsuEffects.hatsuStolen > 0)).toBe(true)
    expect(contacts.every((state) => !confirmedThrow(state)?.performance)).toBe(true)
  },
)
it.each(['player', 'opponent'] as const)(
  'preserves miss and tech requests after %s preparation',
  (side) => {
    const miss = prepareThrowDemo({ id: 'bill', side, plant: true, miss: true })
    expect(miss.some((state) => confirmedThrow(state))).toBe(false)
    const tech = prepareThrowDemo({ id: 'halkenburg', side, cohort: true, tech: true })
    expect(tech.some((state) => state.throwTech)).toBe(true)
    expect(tech.some((state) => confirmedThrow(state))).toBe(false)
  },
)

it('publishes every signature in the actual production catalogue', () => {
  expect(THROW_DEMO_CATALOGUE).toHaveLength(FIGHTING_ROSTER.length)
  expect(new Set(THROW_DEMO_CATALOGUE.map(([id]) => id)).size).toBe(FIGHTING_ROSTER.length)
})
it.each(['player', 'opponent'] as const)(
  'starts the %s prepared KO at the throw, after the cohort charge',
  (side) => {
    const tape = prepareThrowDemo({ ...preparedThrowOptions('halkenburg', true, side), ko: true })
    const victim = side === 'player' ? 'opponent' : 'player'
    expect(tape[0].phase).toBe('fighting')
    expect(tape[0][victim].health).toBe(1)
    expect(throwCohortReady(tape[0], side)).toBe(true)
    const contact = tape.find((state) => confirmedThrow(state))!
    expect(contact.phase).toBe('finished')
    expect(contact.winner).toBe(side)
    expect(contact[victim].health).toBe(0)
  },
)
