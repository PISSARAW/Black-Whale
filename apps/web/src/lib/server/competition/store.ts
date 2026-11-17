import type { OnlineSnapshot } from '$lib/fighting/online/types'
import type { CompetitionStorage } from './file'
import { CompetitionError } from './error'

export class CompetitionStore {
  data: OnlineSnapshot = { version: 1, series: [], tournaments: [], reports: [] }
  available = true
  constructor(private storage?: CompetitionStorage) {
    try {
      this.data = storage?.load() ?? this.data
    } catch {
      this.available = false
    }
  }
  transact<T>(change: (draft: OnlineSnapshot) => T): T {
    if (!this.available) throw new CompetitionError('COMPETITION_STORAGE')
    const draft = structuredClone(this.data)
    const result = change(draft)
    try {
      this.storage?.save(draft)
    } catch {
      throw new CompetitionError('COMPETITION_STORAGE')
    }
    this.data = draft
    return structuredClone(result)
  }
}
