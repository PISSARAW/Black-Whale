<script lang="ts">
  import { t } from '$lib/i18n'
  import type { Crossing, TierPlan } from '$lib/tour/blueprint'
  import type { Space, Vec2 } from '$lib/tour/types'
  import TourMinimap from './TourMinimap.svelte'

  interface Props {
    dialog?: HTMLDialogElement | null
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
    onClose: () => void
    onSelect: (space: Space) => void
  }

  let {
    dialog = $bindable(null), plan, position, heading, currentSpaceId, spoken,
    crossings, crossingLabel, nameOf, selectLabel, aiming, onClose, onSelect,
  }: Props = $props()

  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === dialog) onClose()
  }

  function select(space: Space) {
    onSelect(space)
    onClose()
  }
</script>

<dialog bind:this={dialog} aria-label={$t.tour.minimap(nameOf(plan.tier))} onclose={onClose}
  onclick={closeOnBackdrop}
  class="mx-auto my-[4vh] h-[92vh] w-[96vw] max-w-none border-0 bg-transparent p-0 backdrop:bg-[#050505]/85">
  <div class="flex h-full flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#FFFFF0]/60">
        <span class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">{$t.tour.plan.legend}</span>
        <span><span class="text-[#FFD700]">—</span> {$t.tour.plan.doorway}</span>
        <span><span class="text-[#FFD700]">▲</span> {$t.tour.plan.up}</span>
        <span><span class="text-[#FFD700]">▼</span> {$t.tour.plan.down}</span>
        <span><span class="text-[#FFD700]">◈</span> {$t.tour.plan.across}</span>
      </p>
      <button type="button" onclick={onClose}
        class="rounded border border-[#FFD700]/50 px-2.5 py-1 text-xs text-[#FFD700] transition-colors hover:bg-[#FFD700]/10">
        {$t.tour.plan.close}
      </button>
    </div>
    {#if spoken}<p class="text-xs leading-snug text-[#FFFFF0]/70">{spoken}</p>{/if}
    <div class="min-h-0 flex-1">
      <TourMinimap {plan} {position} {heading} {crossings} {crossingLabel} fill
        {currentSpaceId} label={$t.tour.minimap(nameOf(plan.tier))} {nameOf}
        onSelect={select} {selectLabel} {aiming} />
    </div>
  </div>
</dialog>
