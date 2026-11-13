import type { Component } from 'svelte'
import { ABILITY_PRESENTATIONS } from './abilityPresentations.gen'
import type { AbilityViewModel } from './abilityPresentation'

export type AbilityViewComponent = Component<{ model: AbilityViewModel; variant: string }>
export type AbilityComponentLoader = () => Promise<{ default: AbilityViewComponent }>

const keys = [...new Set(ABILITY_PRESENTATIONS.map(({ componentKey }) => componentKey))]
const composed = () =>
  import('./AbilityCompositeView.svelte') as Promise<{ default: AbilityViewComponent }>

/** Every manifest key resolves lazily to the shared composed visual vocabulary. */
export const ABILITY_COMPONENTS: Readonly<Record<string, AbilityComponentLoader>> = Object.freeze(
  Object.fromEntries(
    keys.map((key) => [
      key,
      key === 'ContagionDashboard'
        ? () =>
            import('./ContagionDashboard.svelte') as unknown as Promise<{
              default: AbilityViewComponent
            }>
        : composed,
    ]),
  ),
)

export function componentFor(
  componentKey: string | null | undefined,
): AbilityComponentLoader | null {
  if (!componentKey) return null
  return ABILITY_COMPONENTS[componentKey] ?? null
}
