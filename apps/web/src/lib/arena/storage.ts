export interface BrowserStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function safeStorageGet(storage: BrowserStorage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function safeStorageSet(storage: BrowserStorage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
