import { get, writable } from 'svelte/store'
import { browserCareerStorage, cleanCareerName, readCareer } from './storage'
import { addCareerMatch, emptyTotals } from './totals'
import {
  CAREER_STORAGE,
  emptyCareer,
  type CareerAppearance,
  type CareerMatch,
  type CareerProfile,
  type RematchVowKind,
} from './types'
import type { FighterId } from '../types'
import { FIGHTING_ROSTER } from '../roster'

export function createCareerProfile(
  storage: () => Pick<Storage, 'getItem' | 'setItem'> | undefined = browserCareerStorage,
) {
  const store = writable(emptyCareer())
  function write(profile: CareerProfile) {
    store.set(profile)
    try {
      storage()?.setItem(CAREER_STORAGE, JSON.stringify(profile))
    } catch {
      /* session still works */
    }
  }
  return {
    subscribe: store.subscribe,
    load() {
      store.set(readCareer(storage()))
    },
    configure(name: string, appearance: CareerAppearance) {
      const current = get(store),
        saved = readCareer(storage())
      const base = saved.revision > current.revision ? saved : current
      write({
        ...base,
        revision: base.revision + 1,
        name: cleanCareerName(name),
        appearance: { ...appearance },
      })
    },
    record(match: CareerMatch) {
      const current = get(store),
        saved = readCareer(storage())
      const base = saved.revision > current.revision ? saved : current
      if (base.seen.includes(match.id)) {
        store.set(base)
        return
      }
      write(addCareerMatch(base, match))
    },
    consumeMorale(matchId: string) {
      const current = get(store),
        saved = readCareer(storage())
      const base = saved.revision > current.revision ? saved : current
      if (base.moraleSeen.includes(matchId)) {
        store.set(base)
        return
      }
      write({
        ...base,
        revision: base.revision + 1,
        moraleSeen: [...base.moraleSeen, matchId].slice(-2000),
      })
    },
    pledgeRematch(matchId: string, kind: RematchVowKind) {
      const current = get(store),
        saved = readCareer(storage())
      const base = saved.revision > current.revision ? saved : current
      const match = base.history.find((entry) => entry.id === matchId)
      if (!match || match.winner !== 'opponent') return
      write({
        ...base,
        revision: base.revision + 1,
        rematchVows: {
          ...base.rematchVows,
          [match.opponent]: { kind, opponent: match.opponent, sourceMatchId: match.id },
        },
      })
    },
    clear() {
      write({
        ...emptyCareer(),
        revision: Math.max(get(store).revision, readCareer(storage()).revision) + 1,
      })
    },
  }
}
export function fighterMastery(profile: CareerProfile, id: FighterId) {
  const total = profile.totals[id] ?? emptyTotals()
  return {
    ...total,
    losses: total.matches - total.wins,
    level: Math.min(20, Math.floor(Math.sqrt(total.points / 50))),
  }
}
export const clashCareer = createCareerProfile()
export function careerFighters(profile: CareerProfile) {
  return FIGHTING_ROSTER.map((fighter) => ({
    ...fighter,
    ...fighterMastery(profile, fighter.id),
  })).filter((entry) => entry.matches > 0)
}
