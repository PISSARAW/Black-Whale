import type { SavedFightReplay } from './fightReplayTypes'
import { decodeFightReplay } from './fightReplayCodec'

const DATABASE = 'black-whale-fighting-replays'
const STORE = 'matches'
const MAX_SAVED = 5
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('storage'))
      return
    }
    const request = indexedDB.open(DATABASE, 1)
    let expired = false
    const timer = setTimeout(() => {
      expired = true
      reject(new Error('storage'))
    }, 3000)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onerror = request.onblocked = () => {
      clearTimeout(timer)
      reject(new Error('storage'))
    }
    request.onsuccess = () => {
      clearTimeout(timer)
      if (expired) request.result.close()
      else resolve(request.result)
    }
  })
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = operation(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = tx.onabort = () => reject(new Error('storage'))
    })
  } finally {
    db.close()
  }
}
export async function loadFightReplays(): Promise<SavedFightReplay[]> {
  const entries = (await transaction('readonly', (store) => store.getAll())) as SavedFightReplay[]
  return entries
    .flatMap((entry) => {
      try {
        if (typeof entry.id !== 'string' || !Number.isFinite(entry.createdAt)) return []
        return [
          {
            id: entry.id,
            createdAt: entry.createdAt,
            replay: decodeFightReplay(JSON.stringify(entry.replay)),
          },
        ]
      } catch {
        return []
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_SAVED)
}
export async function saveFightReplay(entry: SavedFightReplay): Promise<void> {
  await transaction('readwrite', (store) => store.put(entry))
  const entries = (await transaction('readonly', (store) => store.getAll())) as SavedFightReplay[]
  const expired = entries.sort((a, b) => b.createdAt - a.createdAt).slice(MAX_SAVED)
  for (const item of expired) await deleteFightReplay(item.id)
}
export async function deleteFightReplay(id: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(id))
}
