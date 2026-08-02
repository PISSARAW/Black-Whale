<script lang="ts">
  import { t } from '$lib/i18n'
  import type { Space, Structure, Tier } from '$lib/tour/types'

  export type TourTargetMode = 'body' | 'solid' | 'relay' | 'space' | 'jump'
  type Named = { name: string; nameFr: string }
  type Sourced = { provenance: Structure['provenance'] }

  interface Props {
    mode: TourTargetMode
    solidGroups: { tier: Tier; solids: Structure[] }[]
    spaceGroups: { tier: Tier; spaces: Space[] }[]
    deckSpaces: Space[]
    currentSpaceId: string | null
    techniqueColor: string | null
    nameOf: (item: Named) => string
    roomName: (solid: Structure) => string
    provenanceLabel: (item: Sourced) => string
    provenanceClass: (item: Sourced) => string
    isSolidActive: (solidId: string) => boolean
    onSolid: (spaceId: string, solidId: string) => void
    onSpace: (space: Space) => void
  }

  let props: Props = $props()
  const activeSpaceStyle = (spaceId: string) =>
    spaceId === props.currentSpaceId && props.techniqueColor
      ? `color-mix(in srgb, ${props.techniqueColor} 18%, transparent)`
      : undefined
</script>

<section>
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {#if props.mode === 'body'}{$t.tour.hatsu.body.noTarget}
    {:else if props.mode === 'solid'}{$t.tour.hatsu.solids.targets} · {$t.tour.hatsu.allDecks}
    {:else if props.mode === 'relay'}{$t.tour.hatsu.solids.relayTargets}
    {:else if props.mode === 'space'}{$t.tour.hatsu.targets} · {$t.tour.hatsu.allDecks}
    {:else}{$t.tour.jumpTo}{/if}
  </p>
  {#if props.mode === 'body'}
    <p class="rounded border border-[#333] px-2.5 py-2 text-xs leading-snug text-[#FFFFF0]/50">{$t.tour.hatsu.body.castHint}</p>
  {:else if props.mode === 'solid'}
    <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
      {#each props.solidGroups as group (group.tier.id)}
        <li class="sticky top-0 bg-[#0b0b0b] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{props.nameOf(group.tier)}</li>
        {#each group.solids as solid (solid.id)}
          <li><button type="button" onclick={() => props.onSolid(solid.spaceId, solid.id)}
            class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-[#FFFFF0]/80 transition-colors hover:text-[#FFFFF0]"
            style:background={props.isSolidActive(solid.id) ? `color-mix(in srgb, ${props.techniqueColor} 18%, transparent)` : undefined}>
            <span class="truncate">{props.nameOf(solid)}</span>
            <span class="flex shrink-0 items-baseline gap-1.5"><span class="truncate text-[9px] text-[#FFFFF0]/40">{props.roomName(solid)}</span><span class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {props.provenanceClass(solid)}">{props.provenanceLabel(solid)}</span></span>
          </button></li>
        {/each}
      {/each}
    </ul>
  {:else if props.mode === 'space' || props.mode === 'relay'}
    <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
      {#each props.spaceGroups as group (group.tier.id)}
        {#if group.spaces.length}
          <li class="sticky top-0 bg-[#0b0b0b] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{props.nameOf(group.tier)}</li>
          {#each group.spaces as space (space.id)}
            <li><button type="button" onclick={() => props.onSpace(space)}
              class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-[#FFFFF0]/80 transition-colors hover:text-[#FFFFF0]" style:background={activeSpaceStyle(space.id)}>
              <span class="truncate">{props.nameOf(space)}</span><span class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {props.provenanceClass(space)}">{props.provenanceLabel(space)}</span>
            </button></li>
          {/each}
        {/if}
      {/each}
    </ul>
  {:else}
    <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
      {#each props.deckSpaces as space (space.id)}
        <li><button type="button" onclick={() => props.onSpace(space)}
          class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#FFD700]/10 {space.id === props.currentSpaceId ? 'bg-[#FFD700]/15 text-[#FFD700]' : 'text-[#FFFFF0]/80'}">
          <span class="truncate">{props.nameOf(space)}</span><span class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {props.provenanceClass(space)}">{props.provenanceLabel(space)}</span>
        </button></li>
      {/each}
    </ul>
  {/if}
</section>
