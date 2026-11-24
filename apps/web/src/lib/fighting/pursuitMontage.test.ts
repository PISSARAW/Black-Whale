import { expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import {
  cornerRecovery,
  rosterPursuit,
  rosterPursuitIds,
} from '../../../ui-tests/fighting-pursuit-review/rosterScenarios'

it('couvre une seule fois les 40 combattants du roster', () => {
  expect([...rosterPursuitIds].sort()).toEqual(FIGHTING_ROSTER.map(({ id }) => id).sort())
})

it.each(rosterPursuitIds)('enregistre une conversion confirmée de %s pour le montage', (id) => {
  const track = rosterPursuit(id)
  expect(track.opening).toBe(-1)
  expect(track.hits).toBeGreaterThanOrEqual(4)
  expect(track.winner).toBe('player')
  expect(track.moveId).toBeTruthy()
})

it('enregistre au coin une vraie reprise de commandes avant la touche', () => {
  const route = cornerRecovery()
  expect(route.opening).toBeLessThan(route.contact)
  expect(route.winner).toBe('opponent')
})
