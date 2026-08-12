<script lang="ts">
  import { audioLevels, BUSES, setAudioLevel, type Bus } from '$lib/audio/output'
  import { stepsPlaying, toggleSteps } from '$lib/audio/steps'
  import { t } from '$lib/i18n'

  /**
   * The walk's voice, and how loud each part of it is.
   *
   * The button is the one the scene has always had, lifted out of it whole: the
   * walk has a voice — its footsteps, and the room answering them — and needs a
   * way to be quietened without leaving the page. What is new is beside it. A
   * visitor who keeps the walk open for half an hour has, until now, been able
   * to say only "sound" or "no sound" about three quite different things: the
   * voyage theme, the ship itself, and the techniques. Three faders say the
   * thing the two buttons could not — keep the ship, drop the soundtrack — and
   * they are remembered between visits.
   */
  interface Props {
    labels: { silence: string; restore: string }
  }

  let { labels }: Props = $props()

  let open = $state(false)

  const LABEL: Record<Bus, () => string> = {
    ambient: () => $t.tour.sound.ambient,
    walk: () => $t.tour.sound.walk,
    effects: () => $t.tour.sound.effects,
  }
</script>

<div class="absolute left-3 top-3 flex items-start gap-2">
  <button
    type="button"
    onclick={() => toggleSteps()}
    aria-pressed={$stepsPlaying}
    title={$stepsPlaying ? labels.silence : labels.restore}
    class="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFD700]/40 bg-[#050505]/80 text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/80 hover:text-[#FFD700]"
  >
    <span class="sr-only">{$stepsPlaying ? labels.silence : labels.restore}</span>
    <!-- A speaker, with the waves struck through when the walk is silent. -->
    <svg
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M4 9.5h3L11 6v12l-4-3.5H4z" stroke-linejoin="round" />
      {#if $stepsPlaying}
        <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke-linecap="round" />
      {:else}
        <path d="M15 9.5l5 5M20 9.5l-5 5" stroke-linecap="round" />
      {/if}
    </svg>
  </button>

  <button
    type="button"
    onclick={() => (open = !open)}
    aria-expanded={open}
    title={$t.tour.sound.levels}
    class="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFD700]/40 bg-[#050505]/80 text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/80 hover:text-[#FFD700]"
  >
    <span class="sr-only">{$t.tour.sound.levels}</span>
    <!-- Three faders, at three heights. -->
    <svg
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M6 4v16M12 4v16M18 4v16" stroke-linecap="round" />
      <path d="M3.5 9h5M9.5 14h5M15.5 7h5" stroke-linecap="round" />
    </svg>
  </button>

  {#if open}
    <div class="w-52 rounded border border-[#333] bg-[#050505]/95 p-3 text-[#FFFFF0] backdrop-blur">
      <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
        {$t.tour.sound.levels}
      </p>
      {#each BUSES as bus (bus)}
        <label class="mb-2 block text-xs last:mb-0">
          <span class="mb-1 flex justify-between text-[#FFFFF0]/70">
            <span>{LABEL[bus]()}</span>
            <span class="tabular-nums">{Math.round($audioLevels[bus] * 100)}</span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={$audioLevels[bus]}
            oninput={(event) => setAudioLevel(bus, Number(event.currentTarget.value))}
            class="w-full accent-[#FFD700]"
          />
        </label>
      {/each}
    </div>
  {/if}
</div>
