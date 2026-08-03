import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'

export const TOUR_NEN_STORAGE_KEY = 'black-whale:tour:nen:v1'

export function loadTourNen(): NenTechniqueState {
  const fallback = createNenTechniqueState()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const saved = JSON.parse(localStorage.getItem(TOUR_NEN_STORAGE_KEY) ?? 'null')
    if (!saved || !['ten', 'ren', 'zetsu'].includes(saved.mode)) return fallback
    return {
      ...fallback,
      ...saved,
      ryu: typeof saved.ryu === 'object' && saved.ryu ? saved.ryu : {},
      shu: Array.isArray(saved.shu)
        ? saved.shu.filter((id: unknown) => typeof id === 'string')
        : [],
    }
  } catch {
    return fallback
  }
}

export function saveTourNen(state: NenTechniqueState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(TOUR_NEN_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private browsing or a full quota must not prevent a technique from firing.
  }
}
