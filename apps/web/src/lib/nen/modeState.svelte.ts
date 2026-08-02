import {
  transitionNen,
  type NenTechniqueAction,
  type NenTechniqueState,
} from '@black-whale/nen-engine'
import { loadTourNen, saveTourNen } from './persistence'

/** Mode-owned standard state; TourScene renders it but never becomes its authority. */
export class ModeNenState {
  value = $state<NenTechniqueState>(loadTourNen())

  use = (action: NenTechniqueAction) => {
    const transition = transitionNen(this.value, action)
    if (transition.accepted) {
      this.value = transition.state
      saveTourNen(this.value)
    }
    return transition
  }
}
