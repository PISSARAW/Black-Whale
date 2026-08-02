<script lang="ts">
  /**
   * Everything the hunt tells the player, in one corner.
   *
   * The bearings are the point. A sweep felt and a sound heard are drawn as
   * arrows relative to where the player is facing, not as marks on a plan:
   * "he is somewhere over there and he just looked" is the sentence the whole
   * of step 1 is trying to produce, and a minimap would answer it instead.
   */
  import AuraGauge from './AuraGauge.svelte'
  import type { AuraPool } from '$lib/hunt/aura'
  import type { HuntFeedback } from '$lib/hunt/feedback'
  import type { NenState } from '$lib/hunt/nen/states'
  import type { Vec2 } from '$lib/tour/types'

  interface Props {
    pool: AuraPool
    feedback: HuntFeedback
    reading: {
      nen: NenState
      roomName: string
      targetName: string
      entraves: number
      heading: number
    }
    labels: {
      hud: {
        room: string
        nowhere: string
        target: string
        aura: string
        available: string
        committed: string
        ten: string
        zetsu: string
        entraves: string
      }
      feel: { swept: string; footsteps: string; muffled: string; sprung: string; found: string }
    }
  }

  let { pool, feedback, reading, labels }: Props = $props()

  /**
   * A world bearing turned into one relative to the way the player is looking,
   * so the arrow means "to your left" and not "north".
   */
  function degreesTo(bearing: Vec2 | null): number {
    if (!bearing) return 0
    return ((Math.atan2(bearing[0], -bearing[1]) - reading.heading) * 180) / Math.PI
  }

  let footstepBearing = $derived(degreesTo(feedback.footsteps?.bearing ?? null))
  let sweepBearing = $derived(degreesTo(feedback.sweptFrom))
</script>

<div
  class="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-72"
>
  <div class="rounded-lg bg-black/65 p-4 text-sm text-white/85 backdrop-blur">
    <p class="text-xs uppercase tracking-widest text-white/45">
      {reading.roomName ? labels.hud.room : labels.hud.nowhere}
    </p>
    <p class="mb-3 font-medium">{reading.roomName || '—'}</p>

    <AuraGauge {pool} zetsu={reading.nen === 'zetsu'} labels={labels.hud} />

    <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/60">
      <dt>{labels.hud.entraves}</dt>
      <dd class="text-right tabular-nums text-white/85">{reading.entraves}</dd>
      <dt>{labels.hud.target}</dt>
      <dd class="truncate text-right text-white/85">{reading.targetName}</dd>
    </dl>

    <p
      class="mt-2 text-xs uppercase tracking-widest"
      class:text-slate-400={reading.nen === 'zetsu'}
    >
      {reading.nen === 'zetsu' ? labels.hud.zetsu : labels.hud.ten}
    </p>

    <div class="mt-3 min-h-[3.25rem] space-y-1 text-xs">
      {#if feedback.sweptFrom}
        <p class="flex items-center gap-2 text-rose-300">
          <span class="inline-block" style:transform="rotate({sweepBearing}deg)">↑</span>
          {labels.feel.swept}
        </p>
      {/if}
      {#if feedback.footsteps}
        <p
          class="flex items-center gap-2 text-amber-200"
          style:opacity={0.4 + feedback.footsteps.nearness * 0.6}
        >
          <span class="inline-block" style:transform="rotate({footstepBearing}deg)">↑</span>
          {feedback.footsteps.nearness < 0.4 ? labels.feel.muffled : labels.feel.footsteps}
        </p>
      {/if}
      {#if feedback.entraveSprung}
        <p class="text-violet-300">{labels.feel.sprung}</p>
      {/if}
      {#if feedback.entraveFound}
        <p class="text-white/50">{labels.feel.found}</p>
      {/if}
    </div>
  </div>
</div>
