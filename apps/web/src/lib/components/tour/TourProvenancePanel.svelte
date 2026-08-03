<script lang="ts">
  import { t } from '$lib/i18n'

  interface Props {
    reveal: boolean
    blindWalls: [string, number][]
    handPlacedDoors: [string, number][]
    sourcesHref: string
  }

  let { reveal, blindWalls, handPlacedDoors, sourcesHref }: Props = $props()
</script>

<section class="rounded border border-[#333] p-3">
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {$t.tour.provenance.title}
  </p>
  <ul class="space-y-1.5 text-xs text-[#FFFFF0]/60">
    <li>
      <span class="rounded border border-[#FFD700]/60 bg-[#FFD700]/10 px-1 text-[#FFD700]"
        >{$t.tour.provenance.panel}</span
      ><span class="ml-1">{$t.tour.provenance.panelHelp}</span>
    </li>
    <li>
      <span class="rounded border border-[#FFFFF0]/30 bg-[#FFFFF0]/5 px-1 text-[#FFFFF0]/80"
        >{$t.tour.provenance.plan}</span
      ><span class="ml-1">{$t.tour.provenance.planHelp}</span>
    </li>
    <li>
      <span class="rounded border border-[#5f8f6a] bg-[#5f8f6a]/20 px-1 text-[#8fd0a0]"
        >{$t.tour.provenance.map}</span
      ><span class="ml-1">{$t.tour.provenance.mapHelp}</span>
    </li>
    <li>
      <span class="rounded border border-[#2b3a4a] bg-[#2b3a4a]/30 px-1 text-[#9dc4e0]"
        >{$t.tour.provenance.inferred}</span
      ><span class="ml-1">{$t.tour.provenance.inferredHelp}</span>
    </li>
    {#if reveal}
      <li class="border-t border-[#333] pt-1.5">
        <span class="rounded border border-[#ef3340]/70 bg-[#ef3340]/15 px-1 text-[#ef8a90]"
          >{$t.tour.reveal.blind}</span
        ><span class="ml-1">{$t.tour.reveal.blindHelp}</span>
        <ul class="mt-1 space-y-1 text-[#FFFFF0]/50">
          {#each blindWalls as [reason, count] (reason)}<li>
              {reason} <span class="text-[#FFFFF0]/35">· {count}</span>
            </li>{/each}
          {#if !blindWalls.length}<li class="text-[#FFFFF0]/35">{$t.tour.reveal.none}</li>{/if}
        </ul>
      </li>
      <li class="pt-1">
        <span class="rounded border border-[#7095d6]/70 bg-[#7095d6]/15 px-1 text-[#a8c2ea]"
          >{$t.tour.reveal.declared}</span
        ><span class="ml-1">{$t.tour.reveal.declaredHelp}</span>
        <ul class="mt-1 space-y-1 text-[#FFFFF0]/50">
          {#each handPlacedDoors as [reason, count] (reason)}<li>
              {reason} <span class="text-[#FFFFF0]/35">· {count}</span>
            </li>{/each}
          {#if !handPlacedDoors.length}<li class="text-[#FFFFF0]/35">{$t.tour.reveal.none}</li>{/if}
        </ul>
      </li>
    {/if}
    <li class="border-t border-[#333] pt-1.5 text-[#FFFFF0]/50">{$t.tour.provenance.scaleHelp}</li>
    <li class="pt-0.5">
      <a
        href={sourcesHref}
        class="text-[#FFD700]/80 underline underline-offset-2 transition-colors hover:text-[#FFD700]"
        >{$t.tour.sourcesLink} →</a
      >
    </li>
  </ul>
</section>
