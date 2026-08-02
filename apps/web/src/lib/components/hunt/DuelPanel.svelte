<script lang="ts">
  /**
   * The duel, as two bodies and a dial.
   *
   * Your own aura is drawn in full; his is drawn through your Gyo, which means
   * the panel is dark until you pay the five a second. Gyo also pierces In,
   * which otherwise conceals the distribution. The component takes both
   * duelists and lets `AuraOverlay` decide what is legible rather than deciding
   * it here.
   */
  import AuraOverlay from './AuraOverlay.svelte'
  import type { BodyZone, DuelState } from '$lib/hunt/duel/state'
  import { STRIKE_THRESHOLD } from '$lib/hunt/duel/ryu'

  interface Props {
    duel: DuelState
    labels: {
      title: string
      you: string
      hunter: string
      zone: Record<BodyZone, string>
      controls: Record<string, string>
      state: {
        held: string
        broken: string
        breaking: string
        hidden: string
        covered: string
        forward: string
        back: string
      }
    }
  }

  let { duel, labels }: Props = $props()

  let forward = $derived(duel.player.attack >= STRIKE_THRESHOLD)
</script>

<div
  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
>
  <h2 class="mb-8 text-xs uppercase tracking-[0.4em] text-rose-300">{labels.title}</h2>

  <div class="flex items-start gap-10 sm:gap-20">
    <AuraOverlay
      duelist={duel.player}
      labels={{ name: labels.you, zone: labels.zone, ...labels.state }}
    />
    <AuraOverlay
      duelist={duel.hunter}
      seenBy={duel.player}
      labels={{ name: labels.hunter, zone: labels.zone, ...labels.state }}
    />
  </div>

  <!-- Ryu, as the one continuous thing on screen: where the aura sits, right now. -->
  <div class="mt-8 w-64">
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        class="h-full bg-sky-300 transition-[width] duration-150"
        style:width="{duel.player.attack * 100}%"
      ></div>
    </div>
    <p class="mt-1 flex justify-between text-[0.65rem] uppercase tracking-widest text-white/45">
      <span>{labels.state.back}</span>
      <span class:text-sky-200={forward}>{labels.state.forward}</span>
    </p>
  </div>

  <p class="mt-4 h-4 text-xs uppercase tracking-widest text-violet-300">
    {duel.breaking > 0 ? labels.state.breaking : ''}
  </p>

  <ul class="mt-6 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[0.65rem] text-white/40">
    {#each Object.values(labels.controls) as control (control)}
      <li>{control}</li>
    {/each}
  </ul>
</div>
