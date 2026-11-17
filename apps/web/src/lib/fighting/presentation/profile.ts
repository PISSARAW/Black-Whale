import { get, writable } from 'svelte/store'
import { browserCareerStorage } from '../career/storage'
import { loadSoloSave } from '../solo/storage'
import { defaultPreferences, validatePreferences, type PresentationPreferences } from './collection'
import type { SoloRouteId } from '../solo/types'
export const PRESENTATION_STORAGE = 'black-whale:clash:presentation:1'
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | undefined
export function createPresentationProfile(storage: StorageAccess = browserCareerStorage) {
  const store = writable({
    preferences: defaultPreferences(),
    routes: [] as SoloRouteId[],
    persisted: true,
  })
  let loaded = false
  function read() {
    let target: ReturnType<StorageAccess>
    try {
      target = storage()
    } catch {
      /* unavailable storage: retain session preferences */
    }
    const routes = loadSoloSave(target).save.routes
    const current = get(store)
    let value: unknown = current.preferences
    try {
      const text = target?.getItem(PRESENTATION_STORAGE)
      if (text) value = JSON.parse(text)
      else if (target && current.persisted) value = defaultPreferences()
    } catch {
      /* invalid or denied storage: validate session data */
    }
    return { target, routes, preferences: validatePreferences(value, routes) }
  }
  return {
    subscribe: store.subscribe,
    load() {
      const { target, routes, preferences } = read()
      loaded = true
      store.set({ preferences, routes, persisted: Boolean(target) })
    },
    ensureLoaded() {
      if (!loaded) this.load()
    },
    configure(patch: Partial<Omit<PresentationPreferences, 'version'>>) {
      const { target, routes, preferences } = read()
      const next = validatePreferences({ ...preferences, ...patch }, routes)
      let persisted = false
      try {
        target?.setItem(PRESENTATION_STORAGE, JSON.stringify(next))
        persisted = Boolean(target)
      } catch {
        /* session selection remains usable */
      }
      loaded = true
      store.set({ preferences: next, routes, persisted })
    },
  }
}
export const clashPresentation = createPresentationProfile()
