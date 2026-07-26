import { writable } from 'svelte/store'
import type { HatsuProfile } from './hatsuRegistry.js'

export const activeHatsu = writable<HatsuProfile | null>(null)
export const hatsuPanelOpen = writable(false)

export function activateHatsu(profile: HatsuProfile) {
  activeHatsu.set(profile)
  hatsuPanelOpen.set(false)
  if (typeof localStorage !== 'undefined') localStorage.setItem('black-whale:hatsu', profile.id)
}

export function deactivateHatsu() {
  activeHatsu.set(null)
  if (typeof localStorage !== 'undefined') localStorage.removeItem('black-whale:hatsu')
}
