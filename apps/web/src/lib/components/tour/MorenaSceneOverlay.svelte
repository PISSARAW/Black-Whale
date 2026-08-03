<script lang="ts">
  import { locale, t } from '$lib/i18n'
  import { emperorTimeLifeHours } from '$lib/nen/hatsuState'

  interface CastHint {
    id: string
    effect: string
    usedUp: boolean
  }

  interface Props {
    tierName: string
    officeName: string
    engaged: boolean
    tableActive: boolean
    scarletActive: boolean
    scorch: number
    pointedLabel: string | null
    phaseOver: boolean
    castable: boolean
    castHints: CastHint[]
    auraColor: string | null
    immersive: boolean
    onFullscreen: () => void
  }

  let {
    tierName,
    officeName,
    engaged,
    tableActive,
    scarletActive,
    scorch,
    pointedLabel,
    phaseOver,
    castable,
    castHints,
    auraColor,
    immersive,
    onFullscreen,
  }: Props = $props()
  const copy = $derived($t.tour.morena)
</script>

<div class="pointer-events-none absolute left-3 top-3 max-w-sm">
  <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">{tierName}</p>
  <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">{officeName}</p>
  <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{copy.seat}</p>
</div>

{#if engaged}
  <p
    class="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded bg-[#050505]/80 px-3 py-1 text-center text-xs text-[#FFFFF0]/70"
  >
    {$t.tour.engaged}
  </p>
{/if}

{#if tableActive && scarletActive}
  <div
    class="pointer-events-none absolute inset-0 z-10"
    style:background="radial-gradient(ellipse at center, rgba(239,51,64,{scorch * 0.16}) 0%,
    rgba(239,51,64,{0.1 + scorch * 0.6}) 100%)"
    style:mix-blend-mode="screen"
  ></div>
  <p
    class="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded border border-[#ef3340]/60 bg-[#050505]/85 px-3 py-1 text-center text-[11px] uppercase tracking-widest text-[#ef8a90]"
  >
    {$t.nen.lifeConsumed($emperorTimeLifeHours.toLocaleString($locale))}
    <span class="ml-2 text-[#FFFFF0]/45">{copy.scarlet.watching}</span>
  </p>
{/if}

{#if tableActive && engaged}
  <span
    class="pointer-events-none absolute left-1/2 top-1/2 z-20 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#050505]/70 bg-[#FFFFF0]/80"
  ></span>
{/if}

{#if tableActive}
  <div
    class="pointer-events-none absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1"
  >
    {#if pointedLabel}
      <p
        class="rounded border border-[#FFD700]/50 bg-[#050505]/85 px-3 py-1 text-center text-xs text-[#FFD700]"
      >
        {pointedLabel}
      </p>
    {:else if !phaseOver}
      <p class="rounded bg-[#050505]/70 px-3 py-1 text-center text-xs text-[#FFFFF0]/55">
        {copy.reach.hint}
      </p>
    {/if}
    {#if castable}
      {#each castHints as hint, index (hint.id)}
        {#if !hint.usedUp}
          <p
            class="rounded bg-[#050505]/70 px-3 py-1 text-center text-xs"
            style:color={auraColor ?? '#FFFFF0'}
          >
            {index === 0 ? copy.reach.cast(hint.effect) : copy.reach.castSecond(hint.effect)}
          </p>
        {/if}
      {/each}
    {/if}
  </div>
{/if}

<button
  type="button"
  onclick={onFullscreen}
  aria-pressed={immersive}
  class="absolute right-3 top-3 z-20 rounded border px-2.5 py-1 text-xs transition-colors {immersive
    ? 'border-[#FFD700] bg-[#050505]/80 text-[#FFD700]'
    : 'border-[#333] bg-[#050505]/80 text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
>
  {immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
  <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd>
</button>
