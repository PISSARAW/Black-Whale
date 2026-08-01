/**
 * The map from an ability's `componentKey` to the thing that draws it.
 *
 * `NenAbilityModule.getUIComponent()` has always returned a key — the modules
 * declare it, `defineAbility` defaults it to `${id}-ui`, and until now nothing
 * in the web app read it. A key nobody resolves is a promise nobody keeps, so
 * this is the other half of it: the one place a capability that needs a view of
 * its own says which view, and the only place a new one has to be registered.
 *
 * It is deliberately small. Most abilities have nothing to show beyond what the
 * "Why?" panel already shows about a plan, and they simply do not appear here —
 * `componentFor` gives back `null` and the caller falls back to the generic
 * rendering rather than to a blank space.
 */
import type { Component } from 'svelte'
import ContagionDashboard from './ContagionDashboard.svelte'

/**
 * Every key with a component behind it.
 *
 * Keyed on the string the ability module publishes, not on the ability id: two
 * capabilities may legitimately want the same view — Salé-salé's smoke is a
 * second contagion engine and `docs/hatsu-potentiel.md` already says the
 * component should be shared — and that is a thing a key can express and an id
 * cannot.
 */
export const ABILITY_COMPONENTS: Record<string, Component<never>> = {
  ContagionDashboard: ContagionDashboard as unknown as Component<never>,
}

/** The component an ability's `componentKey` names, or `null` if it names none. */
export function componentFor(componentKey: string | null | undefined): Component<never> | null {
  if (!componentKey) return null
  return ABILITY_COMPONENTS[componentKey] ?? null
}

export { ContagionDashboard }
