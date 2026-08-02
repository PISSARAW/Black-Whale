<script lang="ts">
  /**
   * Where a duelist's aura is, drawn as four zones and a halo.
   *
   * This is the component step 3 exists to test. If sixty seconds of
   * distributing aura cannot be read off simple shapes and a glow, the project
   * costs far more than it looks like it does, and the right time to find that
   * out is before anything has been animated. So: no rig, no motion beyond a
   * width and an opacity, and every state the resolution actually reads has a
   * distinct look —
   *
   *   covered   a lit outline. `coveredZones` decides this, so what is drawn is
   *             exactly what a Ko is tested against; the picture cannot drift
   *             from the rule.
   *   gathered  one zone filled and lifted: a Ko, and three open zones.
   *   Ken       all four lit, and nothing gathered anywhere.
   *   unreadable  a body with no halo at all — In, seen from the other side.
   *   open      held, spent or in Zetsu: nothing lit, which is the whole story.
   */
  import { coveredZones } from '$lib/hunt/duel/ryu'
  import { BODY_ZONES, type BodyZone, type DuelistState } from '$lib/hunt/duel/state'
  import { readAura } from '$lib/hunt/duel/gyo'
  import { KO_WINDUP } from '$lib/hunt/duel/ko'

  interface Props {
    duelist: DuelistState
    /** The one looking. Omitted for your own body, which you always read. */
    seenBy?: DuelistState | null
    labels: {
      name: string
      zone: Record<BodyZone, string>
      hidden: string
      held: string
      broken: string
    }
  }

  let { duelist, seenBy = null, labels }: Props = $props()

  /** Your own aura is always legible; Gyo reveals even aura concealed with In. */
  let reading = $derived(seenBy ? readAura(seenBy, duelist) : null)
  let legible = $derived(!seenBy || (reading !== null && !reading.hidden && reading.guard !== null))

  let lit = $derived(legible ? coveredZones(duelist) : [])
  let gathered = $derived(legible ? duelist.ko : null)

  /**
   * How far through the wind-up a gathered Ko is, 0 to 1. This is the one thing
   * on the panel that has to be watched rather than read: under a second to see
   * it coming and decide whether to raise Ken or move the guard, and a zone that
   * simply switched on would give no sense of how long is left.
   */
  let charging = $derived(gathered ? Math.min(1, duelist.gathering / KO_WINDUP) : 0)

  const shape: Record<BodyZone, string> = {
    head: 'h-10 w-10 rounded-full',
    torso: 'h-20 w-16 rounded-xl',
    arms: 'h-14 w-24 rounded-lg',
    legs: 'h-16 w-14 rounded-lg',
  }

  function look(zone: BodyZone): string {
    if (gathered === zone) return 'hunt-gathered text-sky-50 border'
    if (lit.includes(zone)) return 'hunt-lit border border-sky-300 text-sky-100'
    // Under Ko, the three zones that are not the point are not merely unlit —
    // they are open, and they should look it.
    if (gathered) return 'hunt-open border border-rose-400/40 text-rose-200/40'
    return 'border border-white/10 text-white/25'
  }
</script>

<figure class="flex w-40 flex-col items-center gap-1">
  <figcaption class="mb-1 text-xs uppercase tracking-widest text-white/50">
    {labels.name}
  </figcaption>

  {#each BODY_ZONES as zone (zone)}
    <div
      class="relative flex items-center justify-center text-[0.6rem] uppercase tracking-wide transition-all duration-200 {shape[
        zone
      ]} {look(zone)}"
      class:hunt-breathing={duelist.ken && lit.includes(zone)}
      class:hunt-dissolving={duelist.in && !seenBy}
      style:--hunt-charge={gathered === zone ? charging : 0}
    >
      {labels.zone[zone]}
      {#if gathered === zone}
        <!-- The wind-up, drawn on the zone it is gathering into. -->
        <span class="hunt-winding"></span>
      {/if}
    </div>
  {/each}

  <p class="mt-2 h-4 text-[0.65rem] uppercase tracking-widest">
    {#if duelist.held > 0}
      <span class="text-violet-300">{labels.held}</span>
    {:else if duelist.broken}
      <span class="text-rose-300">{labels.broken}</span>
    {:else if !legible}
      <span class="text-white/40">{labels.hidden}</span>
    {/if}
  </p>
</figure>

<style>
  .hunt-lit {
    box-shadow: 0 0 12px rgb(125 211 252 / 0.45);
  }

  /* Every zone that is not the gathered point. Ko is total exposure elsewhere,
     and "elsewhere" is three quarters of the body. */
  .hunt-open {
    box-shadow: inset 0 0 10px rgb(244 63 94 / 0.25);
  }

  /* Ken: covered everywhere and paying for it, second by second. */
  .hunt-breathing {
    animation: hunt-ken-breath 1.6s ease-in-out infinite;
  }

  /* In: the concentration is still there, it simply cannot be read off you. */
  .hunt-dissolving {
    animation: hunt-in-blur 2.4s ease-in-out infinite;
  }

  /* The wind-up itself: a ring closing on the point over KO_WINDUP seconds. The
     fraction comes from the script, so what is drawn is the number `resolve.ts`
     will act on rather than a guess at it. */
  .hunt-winding {
    position: absolute;
    inset: -0.35rem;
    border-radius: inherit;
    border: 2px solid rgb(191 219 254 / 0.9);
    clip-path: inset(calc((1 - var(--hunt-charge)) * 100%) 0 0 0);
    box-shadow: 0 0 12px rgb(125 211 252 / 0.7);
  }
  /* A gathered Ko is the one thing that reads as mass rather than outline. */
  .hunt-gathered {
    border-color: rgb(191 219 254);
    background: rgb(56 189 248 / 0.35);
    box-shadow: 0 0 26px rgb(125 211 252 / 0.85);
    transform: scale(1.12);
  }
</style>
