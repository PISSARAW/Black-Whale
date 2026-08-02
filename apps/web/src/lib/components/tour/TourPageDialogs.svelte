<script lang="ts">
  import { t } from '$lib/i18n'
  import type { Crossing, Ship, TierPlan } from '$lib/tour/blueprint'
  import { PROVENANCE_CLASS } from '$lib/tour/pagePresentation'
  import type { Naming } from '$lib/tour/search'
  import type { Space, Vec2 } from '$lib/tour/types'
  import TourFinder from './TourFinder.svelte'
  import TourPlanDialog from './TourPlanDialog.svelte'

  interface Props {
    dialog?: HTMLDialogElement | null
    finderOpen?: boolean
    ship: Ship
    plan: TierPlan
    position: Vec2
    heading: number
    currentSpaceId: string | null
    spoken: string | null
    crossings: Crossing[]
    crossingLabel: (crossing: Crossing) => string
    nameOf: (space: Space) => string
    selectLabel: (room: string) => string
    aiming: boolean
    naming: Naming
    onClosePlan: () => void
    onSelect: (space: Space) => void
    onCast: (spaceId: string) => void
    onGo: (space: Space) => void
  }

  let {
    dialog = $bindable(null),
    finderOpen = $bindable(false),
    ship,
    plan,
    position,
    heading,
    currentSpaceId,
    spoken,
    crossings,
    crossingLabel,
    nameOf,
    selectLabel,
    aiming,
    naming,
    onClosePlan,
    onSelect,
    onCast,
    onGo,
  }: Props = $props()

  function pick(spaceId: string) {
    const space = ship.spaces.get(spaceId)
    if (!space) return
    if (aiming) onCast(space.id)
    else onGo(space)
  }
</script>

<TourPlanDialog
  bind:dialog
  {plan}
  {position}
  {heading}
  {currentSpaceId}
  {spoken}
  {crossings}
  {crossingLabel}
  {nameOf}
  {selectLabel}
  {aiming}
  onClose={onClosePlan}
  {onSelect}
/>

<TourFinder
  {ship}
  bind:open={finderOpen}
  words={naming}
  labels={{
    title: $t.tour.find.title,
    placeholder: $t.tour.find.placeholder,
    showing: $t.tour.find.showing,
    noMatch: $t.tour.find.noMatch,
    action: aiming ? $t.tour.hatsu.targets : $t.tour.jumpTo,
    level: $t.tour.find.level,
    close: $t.tour.find.close,
    hint: $t.tour.find.hint,
  }}
  provenanceLabel={(provenance) => $t.tour.provenance[provenance]}
  provenanceClass={(provenance) => PROVENANCE_CLASS[provenance]}
  onPick={pick}
/>
