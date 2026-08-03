<script lang="ts">
  interface LocationReadout {
    level: string
    room: string
    badge: string | null
    badgeClass: string
    source: string | null
  }

  interface AimReadout {
    text: string
    color: string
    badge: string | null
    badgeClass: string
    source: string | null
  }

  interface ControlHint {
    key: string
    action: string
    color: string | null
  }

  interface Props {
    autopilot: boolean
    reticleColor: string | null
    spoken: string
    location: LocationReadout | null
    penalty: string | null
    aim: AimReadout | null
    controls: ControlHint[]
    statusHint: string
    linkPrompt: string | null
  }

  let { autopilot, reticleColor, spoken, location, penalty, aim, controls, statusHint, linkPrompt }: Props = $props()
</script>

{#if autopilot}<div class="pointer-events-auto absolute inset-0 z-50 bg-black"></div>{/if}

<div class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
  style:background={reticleColor ?? 'rgb(255 255 240 / 0.6)'}
  style:box-shadow={reticleColor ? `0 0 10px ${reticleColor}` : 'none'}></div>

<p class="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>

{#if location}
  <div class="pointer-events-none absolute left-3 top-14 max-w-sm">
    <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">{location.level}</p>
    <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">{location.room}</p>
    {#if location.badge}
      <span class="mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {location.badgeClass}">{location.badge}</span>
    {/if}
    {#if location.source}<p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{location.source}</p>{/if}
  </div>
{/if}

{#if penalty}
  <p class="pointer-events-none absolute bottom-20 left-1/2 max-w-md -translate-x-1/2 rounded border border-[#ef3340]/60 bg-[#050505]/90 px-3 py-1.5 text-center text-xs leading-snug text-[#ef8a90]" aria-live="polite">{penalty}</p>
{/if}

{#if aim}
  <div class="pointer-events-none absolute bottom-3 right-3 max-w-xs text-right">
    <p class="inline-block rounded border bg-[#050505]/80 px-2 py-1 text-[11px]" style:border-color="color-mix(in srgb, {aim.color} 55%, transparent)" style:color={aim.color}>{aim.text}</p>
    {#if aim.badge}<p class="mt-1"><span class="inline-block rounded border bg-[#050505]/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider {aim.badgeClass}">{aim.badge}</span></p>{/if}
    {#if aim.source}<p class="mt-1 rounded bg-[#050505]/80 px-1.5 py-0.5 text-[11px] leading-snug text-[#FFFFF0]/60">{aim.source}</p>{/if}
  </div>
{/if}

{#if controls.length}
  <ul class="pointer-events-none absolute bottom-3 left-3 space-y-0.5 rounded bg-[#050505]/80 px-2 py-1">
    {#each controls as control (control.key)}<li class="flex items-baseline gap-2 text-[11px]"><kbd class="shrink-0 font-mono text-[10px]" style:color={control.color}>{control.key}</kbd><span class="text-[#FFFFF0]/70">{control.action}</span></li>{/each}
  </ul>
{/if}

<p class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-[#050505]/80 px-3 py-1 text-xs text-[#FFFFF0]/70">{statusHint}</p>
{#if linkPrompt}<p class="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded border border-[#FFD700]/50 bg-[#050505]/90 px-3 py-1 text-xs text-[#FFD700]">{linkPrompt}</p>{/if}
