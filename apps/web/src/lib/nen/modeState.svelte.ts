import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
  type NenTechniqueState,
} from '@black-whale/nen-engine'

/** Mode-owned standard state; TourScene renders it but never becomes its authority. */
export class ModeNenState {
  value = $state<NenTechniqueState>(createNenTechniqueState())

  use = (action: NenTechniqueAction) => {
    const transition = transitionNen(this.value, action)
    if (transition.accepted) this.value = transition.state
    return transition
  }
}
