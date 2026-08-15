<script lang="ts">
  import { t } from '$lib/i18n'

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

  /**
   * The way in to the evidence card.
   *
   * A button and not only a key, because the walk has to work on a phone: the
   * audit's whole point about touch is that it is the visitor who has the least
   * and is given the least, and a feature reachable only by keyboard is one the
   * finger does not have. On a mouse it carries its key so that the key is
   * discoverable at all; the label is the caller's, in the caller's language.
   */
  interface ExaminePrompt {
    label: string
    key: string | null
    onOpen: () => void
  }

  interface Props {
    autopilot: boolean
    reticleColor: string | null
    spoken: string
    location: LocationReadout | null
    penalty: string | null
    /**
     * What a technique aimed at a person came to, in one line.
     *
     * Kept apart from `penalty` — which is red, and is the walk telling you
     * that you broke your own vow — because most of what comes back from a body
     * is a refusal with a reason, and a canon condition being honoured is not a
     * punishment. See ADR-004 §2.2.
     */
    note: string | null
    aim: AimReadout | null
    controls: ControlHint[]
    statusHint: string
    linkPrompt: string | null
    examine: ExaminePrompt | null
    /**
     * What time it is aboard, in the words `formatVoyageTime` uses everywhere
     * else: `Day 3 · Tuesday · 01:27`, `≈ Day 5`, `Day 4 – Day 8`.
     *
     * Beside the deck, because it is the provenance card of the light: two
     * windows on this ship show an outside, and this is what says *why* the bay
     * is black, or why it is the drawn noon at a chapter that gives no hour.
     * `null` when nothing is projected.
     */
    hour: string | null
    /**
     * Emperor Time, which is the one technique you look *through* rather than at.
     *
     * A walk in the first person cannot show the visitor their own eyes, and the
     * walk had nothing else for it: the ability turned on, the ship opened, and
     * the screen said nothing — which read, correctly, as a key that had done
     * nothing. What the eyes change is what is seen through them, so what goes
     * over the picture is the colour, deepening with the ledger: `share` is how
     * much of the year has gone, from 0 to 1, and `label` says the same thing as
     * a quantity. Both, because a tint is a feeling and a year is a number, and
     * this is the one ability whose whole argument is the number.
     *
     * The same wash the card table already puts over Morena's office, in the
     * same red the dock publishes the technique in — one ability spending one
     * year, drawn the same way on both surfaces.
     */
    scarlet: { share: number; label: string } | null
    tourist?: {
      available: boolean
      mangaViewLabel?: string
      onJumpToAngle?: () => void
      onTakePhoto: () => void
      onTakePhotoWithHud: () => void
    } | null
    gyo?: {
      active: boolean
      onToggle: () => void
    } | null
  }

  let {
    autopilot,
    reticleColor,
    spoken,
    location,
    penalty,
    note,
    aim,
    controls,
    statusHint,
    linkPrompt,
    examine,
    hour,
    scarlet,
    tourist = null,
    gyo = null,
  }: Props = $props()
</script>

{#if autopilot}<div class="pointer-events-auto absolute inset-0 z-50 bg-black"></div>{/if}

<div class="pointer-events-auto absolute right-3 top-3 z-40 flex flex-col items-end gap-2">
  {#if tourist?.available}
    {#if tourist.onJumpToAngle}
      <button
        type="button"
        onclick={tourist.onJumpToAngle}
        title={tourist.mangaViewLabel}
        aria-label={tourist.mangaViewLabel
          ? `${$t.tour.sceneOverlay.mangaAngle} — ${tourist.mangaViewLabel}`
          : $t.tour.sceneOverlay.mangaAngle}
        class="rounded border border-[#FFD700]/40 bg-[#050505]/80 px-2 py-1 text-xs text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
      >
        {$t.tour.sceneOverlay.mangaAngle}
      </button>
    {/if}
    <div class="flex gap-2">
      <button
        type="button"
        onclick={tourist.onTakePhoto}
        title={$t.tour.sceneOverlay.photoPure}
        class="flex h-8 w-8 items-center justify-center rounded border border-[#FFD700]/40 bg-[#050505]/80 text-[10px] font-bold text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
      >
        IMG
      </button>
      <button
        type="button"
        onclick={tourist.onTakePhotoWithHud}
        title={$t.tour.sceneOverlay.photoWithInterface}
        class="flex h-8 w-8 items-center justify-center rounded border border-[#FFD700]/40 bg-[#050505]/80 text-[10px] font-bold text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
      >
        UI
      </button>
    </div>
  {/if}

  {#if gyo}
    <button
      type="button"
      onclick={gyo.onToggle}
      class="mt-2 flex items-center gap-2 rounded border border-[#FFD700]/40 px-2 py-1 text-xs transition-colors hover:border-[#FFD700]/70 {gyo.active
        ? 'bg-[#FFD700]/20 text-[#FFD700]'
        : 'bg-[#050505]/80 text-[#FFD700]/80'}"
      title={$t.tour.sceneOverlay.gyoTitle}
    >
      <span>{gyo.active ? '[Gyo]' : '[Nen]'}</span>
      {gyo.active ? $t.tour.sceneOverlay.gyoActive : $t.tour.sceneOverlay.gyoActivate}
    </button>
  {/if}
</div>

{#if scarlet}
  <!-- First in the layer, and with no z of its own, so every read-out over the
       scene goes on painting above it: the eyes colour the ship, not the panel
       that describes it. -->
  <div
    class="pointer-events-none absolute inset-0"
    style:background="radial-gradient(ellipse at center, rgba(239,51,64,{scarlet.share * 0.16}) 0%,
    rgba(239,51,64,{0.1 + scarlet.share * 0.6}) 100%)"
    style:mix-blend-mode="screen"
  ></div>
{/if}

<div
  class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
  style:background={reticleColor ?? 'rgb(255 255 240 / 0.6)'}
  style:box-shadow={reticleColor ? `0 0 10px ${reticleColor}` : 'none'}
></div>

<p class="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>

{#if location}
  <div class="pointer-events-none absolute left-3 top-14 max-w-sm">
    <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
      {location.level}{#if hour}<span class="ml-2 text-[#FFFFF0]/40">{hour}</span>{/if}
    </p>
    <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">{location.room}</p>
    {#if location.badge}
      <span
        class="mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {location.badgeClass}"
        >{location.badge}</span
      >
    {/if}
    {#if location.source}<p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">
        {location.source}
      </p>{/if}
  </div>
{/if}

{#if scarlet}
  <!-- The quantity, said as well as shown, and over the scene rather than only
       on the panel: in immersive mode the panel can be shut, and a price nobody
       is being told is not a price. -->
  <p
    class="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded border border-[#ef3340]/60 bg-[#050505]/85 px-3 py-1 text-center text-[11px] uppercase tracking-widest text-[#ef8a90]"
    aria-live="polite"
  >
    {scarlet.label}
  </p>
{/if}

{#if penalty}
  <p
    class="pointer-events-none absolute bottom-20 left-1/2 max-w-md -translate-x-1/2 rounded border border-[#ef3340]/60 bg-[#050505]/90 px-3 py-1.5 text-center text-xs leading-snug text-[#ef8a90]"
    aria-live="polite"
  >
    {penalty}
  </p>
{/if}

{#if note}
  <p
    class="pointer-events-none absolute bottom-32 left-1/2 max-w-md -translate-x-1/2 rounded border border-[#FFD700]/40 bg-[#050505]/90 px-3 py-1.5 text-center text-xs leading-snug text-[#FFFFF0]/80"
    aria-live="polite"
  >
    {note}
  </p>
{/if}

{#if examine}
  <button
    type="button"
    onclick={examine.onOpen}
    class="pointer-events-auto absolute bottom-24 right-3 rounded border border-[#FFD700]/40 bg-[#050505]/80 px-2 py-1 text-[11px] text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
  >
    {#if examine.key}<kbd class="mr-1.5 font-mono text-[10px]">{examine.key}</kbd
      >{/if}{examine.label}
  </button>
{/if}

{#if aim}
  <div class="pointer-events-none absolute bottom-3 right-3 max-w-xs text-right">
    <p
      class="inline-block rounded border bg-[#050505]/80 px-2 py-1 text-[11px]"
      style:border-color="color-mix(in srgb, {aim.color} 55%, transparent)"
      style:color={aim.color}
    >
      {aim.text}
    </p>
    {#if aim.badge}<p class="mt-1">
        <span
          class="inline-block rounded border bg-[#050505]/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider {aim.badgeClass}"
          >{aim.badge}</span
        >
      </p>{/if}
    {#if aim.source}<p
        class="mt-1 rounded bg-[#050505]/80 px-1.5 py-0.5 text-[11px] leading-snug text-[#FFFFF0]/60"
      >
        {aim.source}
      </p>{/if}
  </div>
{/if}

{#if controls.length}
  <ul
    class="pointer-events-none absolute bottom-3 left-3 space-y-0.5 rounded bg-[#050505]/80 px-2 py-1"
  >
    {#each controls as control (control.key)}<li class="flex items-baseline gap-2 text-[11px]">
        <kbd class="shrink-0 font-mono text-[10px]" style:color={control.color}>{control.key}</kbd
        ><span class="text-[#FFFFF0]/70">{control.action}</span>
      </li>{/each}
  </ul>
{/if}

<p
  class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-[#050505]/80 px-3 py-1 text-xs text-[#FFFFF0]/70"
>
  {statusHint}
</p>
{#if linkPrompt}<p
    class="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded border border-[#FFD700]/50 bg-[#050505]/90 px-3 py-1 text-xs text-[#FFD700]"
  >
    {linkPrompt}
  </p>{/if}
