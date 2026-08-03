<script lang="ts">
  /**
   * The reservoir, at a glance and without a number on it.
   *
   * Three bands on one bar, because there is one reservoir (I2). Solid is what
   * is in the body and spendable now. Hatched is what has been laid down and is
   * standing on a floor somewhere — it is drawn *inside* the bar rather than
   * beside it, because the thing the player has to feel is that laying an
   * entrave did not spend aura, it shortened the bar. The dark remainder is
   * what regeneration is allowed to climb back into, and the hatched band is
   * exactly the reason it cannot climb further.
   *
   * No digits: a player reading "62" is doing arithmetic, and the arbitration
   * step 2 is trying to provoke is meant to be felt in the width of a bar.
   */
  import type { AuraPool } from '$lib/hunt/aura'
  import { MAX_AURA } from '$lib/hunt/aura'

  interface Props {
    pool: AuraPool
    /** Dropped aura reads differently from spent aura: the bar goes quiet. */
    zetsu?: boolean
    labels: { aura: string; available: string; committed: string }
  }

  let { pool, zetsu = false, labels }: Props = $props()

  /**
   * The ghost of where the bar was a moment ago, left behind so a spend is a
   * thing you watch happen rather than a number that was already different when
   * you looked. Fifteen points leaving for a sweep and twenty-five for an
   * entrave should not cost the same amount of attention, and they do not: the
   * gap the ghost leaves is the size of what was spent.
   */
  let ghost = $state(0)

  $effect(() => {
    const now = pool.available
    // Rising — or the very first read, which starts at zero and so catches up
    // silently rather than drawing a spend that never happened.
    if (now >= ghost) {
      ghost = now
      return
    }
    // Falling: let the ghost catch up slowly, so the drop is legible.
    const timer = setTimeout(() => {
      ghost = now
    }, 420)
    return () => clearTimeout(timer)
  })

  const percent = (value: number) => `${Math.max(0, Math.min(100, (value / MAX_AURA) * 100))}%`

  let inHand = $derived(percent(pool.available))
  let laidDown = $derived(percent(pool.committed))
  let justSpent = $derived(percent(Math.max(0, ghost - pool.available)))
</script>

<div class="w-full" aria-label={labels.aura}>
  <div
    class="relative h-3 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15"
    role="meter"
    aria-valuemin="0"
    aria-valuemax={MAX_AURA}
    aria-valuenow={Math.round(pool.available)}
    aria-valuetext="{labels.available}: {Math.round(
      pool.available,
    )} — {labels.committed}: {Math.round(pool.committed)}"
  >
    <!-- What has just left the body, still glowing where it was. -->
    <div class="absolute inset-y-0 hunt-spent" style:left={inHand} style:width={justSpent}></div>
    <div
      class="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
      class:bg-sky-300={!zetsu}
      class:bg-slate-500={zetsu}
      class:hunt-quiet={zetsu}
      style:width={inHand}
    ></div>
    <!-- The laid-down band sits at the far end, against the ceiling it is holding down. -->
    <div class="absolute inset-y-0 right-0 hunt-laid" style:width={laidDown}></div>
  </div>

  <div class="mt-1 flex justify-between text-[0.65rem] uppercase tracking-wider text-white/45">
    <span>{labels.available}</span>
    {#if pool.committed > 0}
      <span class="text-violet-300">{labels.committed}</span>
    {/if}
  </div>
</div>

<style>
  /* The trail a spend leaves. It is the only thing on the gauge that moves, and
     it moves because it is the only thing on it that is an event. */
  .hunt-spent {
    background: rgb(248 113 113 / 0.75);
    transition:
      left 300ms ease-out,
      width 300ms ease-out;
  }

  /* Zetsu: the aura is down, so the bar stops looking like it is holding any. */
  .hunt-quiet {
    animation: hunt-gauge-quiet 3s ease-in-out infinite;
  }

  @keyframes hunt-gauge-quiet {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 0.8;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hunt-spent,
    .hunt-quiet {
      transition: none;
      animation: none;
    }
  }

  /* Hatching rather than a flat colour: it reads as "elsewhere", not as "more". */
  .hunt-laid {
    background-image: repeating-linear-gradient(
      -45deg,
      rgb(167 139 250 / 0.85) 0 3px,
      rgb(167 139 250 / 0.25) 3px 6px
    );
    transition: width 150ms;
  }
</style>
