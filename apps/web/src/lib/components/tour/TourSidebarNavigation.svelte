<script lang="ts">
  import { t } from '$lib/i18n'
  import type { Crossing, TierPlan } from '$lib/tour/blueprint'
  import type { Space, Vec2 } from '$lib/tour/types'
  import TourMinimap from './TourMinimap.svelte'

  interface DeckOption {
    id: string
    label: string
    active: boolean
  }
  interface Props {
    immersive: boolean
    reveal: boolean
    copied: 'idle' | 'done' | 'failed'
    decks: DeckOption[]
    plan: TierPlan
    position: Vec2
    heading: number
    crossings: Crossing[]
    currentSpaceId: string | null
    planLabel: string
    nameOf: (space: Space | { name: string; nameFr: string } | undefined) => string
    crossingLabel: (crossing: Crossing) => string
    onSelectPlan: (space: Space) => void
    selectLabel: (room: string) => string
    aiming: boolean
    onHide: () => void
    onFullscreen: () => void
    onSelectDeck: (id: string) => void
    onOpenPlan: () => void
    onOpenFinder: () => void
    onToggleReveal: () => void
    onCopy: () => void
  }

  let props: Props = $props()
</script>

{#if props.immersive}
  <div class="sticky top-0 z-10 -m-3 mb-0 flex gap-1.5 bg-[#050505] p-3">
    <button
      type="button"
      onclick={props.onHide}
      aria-expanded="true"
      class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
      >{$t.tour.fullscreen.hidePanel}</button
    >
    <button
      type="button"
      onclick={props.onFullscreen}
      class="rounded border border-[#FFD700]/50 px-2.5 py-1 text-xs text-[#FFD700] transition-colors hover:bg-[#FFD700]/10"
      >{$t.tour.fullscreen.exit} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd></button
    >
  </div>
{/if}

<nav aria-label={$t.tour.decks}>
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">{$t.tour.decks}</p>
  <div class="flex flex-wrap gap-1.5">
    {#each props.decks as deck (deck.id)}
      <button
        type="button"
        onclick={() => props.onSelectDeck(deck.id)}
        aria-current={deck.active ? 'true' : undefined}
        class="rounded border px-2.5 py-1 text-xs transition-colors {deck.active
          ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
          : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
        >{deck.label}</button
      >
    {/each}
  </div>
</nav>

<TourMinimap
  plan={props.plan}
  position={props.position}
  heading={props.heading}
  crossings={props.crossings}
  crossingLabel={props.crossingLabel}
  currentSpaceId={props.currentSpaceId}
  label={props.planLabel}
  nameOf={props.nameOf}
  onSelect={props.onSelectPlan}
  selectLabel={props.selectLabel}
  aiming={props.aiming}
/>

<div class="flex flex-wrap gap-1.5">
  <button
    type="button"
    onclick={props.onOpenPlan}
    class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
    >{$t.tour.plan.open} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">M</kbd></button
  >
  <button
    type="button"
    onclick={props.onOpenFinder}
    class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
    >{$t.tour.find.open} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">⌘K</kbd></button
  >
  <button
    type="button"
    onclick={props.onToggleReveal}
    aria-pressed={props.reveal}
    title={$t.tour.reveal.help}
    class="rounded border px-2.5 py-1 text-xs transition-colors {props.reveal
      ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
      : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
    >{$t.tour.reveal.toggle} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">L</kbd></button
  >
  <button
    type="button"
    onclick={props.onFullscreen}
    aria-pressed={props.immersive}
    class="rounded border px-2.5 py-1 text-xs transition-colors {props.immersive
      ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
      : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
    >{props.immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
    <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd></button
  >
  <button
    type="button"
    onclick={props.onCopy}
    class="rounded border px-2.5 py-1 text-xs transition-colors {props.copied === 'done'
      ? 'border-[#FFD700] text-[#FFD700]'
      : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
  >
    {props.copied === 'done'
      ? $t.tour.viewpoint.copied
      : props.copied === 'failed'
        ? $t.tour.viewpoint.failed
        : $t.tour.viewpoint.copy}
  </button>
</div>
