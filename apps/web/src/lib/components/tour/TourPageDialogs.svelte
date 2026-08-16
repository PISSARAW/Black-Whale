<script lang="ts">
  import { t } from '$lib/i18n'
  import type { Crossing, Ship, TierPlan } from '$lib/tour/blueprint'
  import { PROVENANCE_CLASS } from '$lib/tour/pagePresentation'
  import type { Naming } from '$lib/tour/search'
  import type { Space, Tier, Vec2 } from '$lib/tour/types'
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
    nameOf: (entity: Space | Tier | undefined) => string
    selectLabel: (room: string) => string
    naming: Naming
    onClosePlan: () => void
    onSelect: (space: Space) => void
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
    naming,
    onClosePlan,
    onSelect,
    onGo,
  }: Props = $props()

  function pick(spaceId: string) {
    const space = ship.spaces.get(spaceId)
    if (!space) return
    onGo(space)
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
  aiming={false}
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
    action: $t.tour.jumpTo,
    level: $t.tour.find.level,
    close: $t.tour.find.close,
    hint: $t.tour.find.hint,
  }}
  provenanceLabel={(provenance) => $t.tour.provenance[provenance]}
  provenanceClass={(provenance) => PROVENANCE_CLASS[provenance]}
  onPick={pick}
/>
