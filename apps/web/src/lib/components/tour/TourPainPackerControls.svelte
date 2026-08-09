<script lang="ts">
  import { t } from '$lib/i18n'
  import {
    injuryPace,
    MAX_TOUR_INJURY,
    TOUR_INJURY_DAMAGE,
    type TourInjurySeverity,
  } from '$lib/tour/hatsu'
  import type { TourBody } from '$lib/tour/hatsu'

  interface Props {
    body: TourBody
    canInjure: boolean
    onInjure: (severity: TourInjurySeverity) => void
  }

  let { body, canInjure, onInjure }: Props = $props()
  const choices: TourInjurySeverity[] = ['light', 'medium', 'severe']
  const pace = $derived(Math.round(injuryPace(body) * 100))
</script>

<div class="mt-3 rounded border border-[#b4603c]/40 bg-[#b4603c]/5 p-2">
  <p class="text-[10px] uppercase tracking-widest text-[#b4603c]">{$t.tour.hatsu.pain.title}</p>
  <p class="mt-1 text-[10px] leading-snug text-[#FFFFF0]/45">
    {$t.tour.hatsu.pain.extrapolation}
  </p>
  <p class="mt-1 text-[11px] text-[#FFFFF0]/75">
    {$t.tour.hatsu.pain.injuries(body.injuries, MAX_TOUR_INJURY, pace)}
  </p>
  <p class="text-[11px] text-[#FFFFF0]/60">
    {body.packed === null
      ? $t.tour.hatsu.pain.available(body.availablePain)
      : $t.tour.hatsu.pain.packed(body.packed)}
  </p>

  {#if canInjure}
    <div class="mt-2 grid grid-cols-3 gap-1">
      {#each choices as severity (severity)}
        <button
          type="button"
          onclick={() => onInjure(severity)}
          disabled={body.injuries + TOUR_INJURY_DAMAGE[severity] > MAX_TOUR_INJURY}
          class="rounded border border-[#555] px-1 py-1 text-[10px] text-[#FFFFF0]/75 transition-colors hover:border-[#b4603c] hover:text-[#FFFFF0] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {$t.tour.hatsu.pain[severity]} · {TOUR_INJURY_DAMAGE[severity]}
        </button>
      {/each}
    </div>
  {/if}
</div>
