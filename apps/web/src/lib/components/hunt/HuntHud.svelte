<script lang="ts">
  /**
   * Everything the hunt tells the player, in one corner.
   *
   * The bearings are the point. A sweep felt and a sound heard are drawn as
   * arrows relative to where the player is facing, not as marks on a plan:
   * "he is somewhere over there and he just looked" is the sentence the whole
   * of step 1 is trying to produce, and a minimap would answer it instead.
   */
  import '$lib/components/game/mode-hud.css'
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
      hatsu: { label: string; detail: string; bearing?: Vec2 | null } | null
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
  let hatsuBearing = $derived(degreesTo(reading.hatsu?.bearing ?? null))
</script>

<aside class="mode-hud mode-hud-surface grid gap-2 p-3" aria-label={labels.hud.aura}>
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0">
      <p class="mode-hud-label">{reading.roomName ? labels.hud.room : labels.hud.nowhere}</p>
      <p class="mode-hud-title mt-1">{reading.roomName || '—'}</p>
    </div>
    <span class="mode-hud-label nen-state" class:quiet={reading.nen === 'zetsu'}>
      {reading.nen === 'zetsu' ? labels.hud.zetsu : labels.hud.ten}
    </span>
  </div>

  <AuraGauge {pool} zetsu={reading.nen === 'zetsu'} labels={labels.hud} />

  <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 text-xs">
    <dt class="mode-hud-label">{labels.hud.target}</dt>
    <dd class="break-words text-right">{reading.targetName}</dd>
    <dt class="mode-hud-label">{labels.hud.entraves}</dt>
    <dd class="mode-hud-value text-right">{reading.entraves}</dd>
  </dl>

  {#if reading.hatsu || feedback.sweptFrom || feedback.footsteps || feedback.entraveSprung || feedback.entraveFound}
    <div class="space-y-1 border-t border-white/15 pt-2 text-xs">
      {#if reading.hatsu}
        <p class="flex items-center gap-2 text-violet-200">
          {#if reading.hatsu.bearing}
            <span class="inline-block" style:transform="rotate({hatsuBearing}deg)">↑</span>
          {/if}
          <span
            ><strong class="font-medium">{reading.hatsu.label}</strong> — {reading.hatsu
              .detail}</span
          >
        </p>
      {/if}
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
  {/if}
</aside>

<style>
  .nen-state {
    padding: 0.25rem 0.35rem;
    border: 1px solid var(--mode-edge);
    color: var(--mode-accent);
    white-space: nowrap;
  }
  .nen-state.quiet {
    color: #c7b3e2;
  }
</style>
