import { describe, expect, it } from 'vitest'
import { rememberDiplomacy } from './intrigue'
import { evaluateScenarioObjective } from './scenario'

describe('strategy intrigue', () => {
  it('scores the faction secret objective independently of its public objective', () => {
    const locations = ['one', 'two', 'three', 'four']
    const publicObjective = evaluateScenarioObjective('prince-benjamin', {
      characterLocations: locations,
      confirmedHostiles: 0,
    })
    const secretObjective = evaluateScenarioObjective('prince-benjamin', {
      characterLocations: locations,
      confirmedHostiles: 0,
      visibility: 'SECRET',
    })

    expect(secretObjective.id).not.toBe(publicObjective.id)
    expect(secretObjective.complete).toBe(secretObjective.current >= secretObjective.target)
  })

  it('remembers repeated promises, threats and betrayals by faction', () => {
    const afterPromise = rememberDiplomacy(
      {},
      [{ factionId: 'prince-camilla', action: 'PROPOSE_PACT' }],
      2,
    )
    const afterBetrayal = rememberDiplomacy(
      afterPromise,
      [
        { factionId: 'prince-camilla', action: 'THREATEN' },
        { factionId: 'prince-camilla', action: 'BETRAY' },
      ],
      4,
    )

    expect(afterBetrayal['prince-camilla']).toMatchObject({
      pactsProposed: 1,
      threatsReceived: 1,
      betrayals: 1,
      lastAction: 'BETRAY',
      lastTurn: 4,
    })
  })
})
