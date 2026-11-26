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
  import '$lib/components/game/mode-hud.css'
  import { HUNT_PAGE_KEYS } from '$lib/hunt/manualControls'
  import AuraOverlay from './AuraOverlay.svelte'
  import { BODY_ZONES, type BodyZone, type DuelState } from '$lib/hunt/duel/state'
  import { STRIKE_THRESHOLD } from '$lib/hunt/duel/ryu'
  import { canCharge } from '$lib/hunt/duel/ko'

  interface Props {
    duel: DuelState
    labels: {
      title: string
      you: string
      hunter: string
      zone: Record<BodyZone, string>
      controls: Record<string, string>
      action: {
        guard: string
        reserve: string
        press: string
        observe: string
        conceal: string
        endure: string
        strike: string
        breakAway: string
        recover: string
      }
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
    canRecover: boolean
    onGuard: (zone: BodyZone) => void
    onRyu: (attack: number) => void
    onGyo: () => void
    onIn: () => void
    onKen: () => void
    onKo: () => void
    onBreakAway: () => void
    onRecover: () => void
    arenaLabel: string
    onArena: () => void
  }

  let {
    duel,
    labels,
    canRecover,
    onGuard,
    onRyu,
    onGyo,
    onIn,
    onKen,
    onKo,
    onBreakAway,
    onRecover,
    arenaLabel,
    onArena,
  }: Props = $props()

  let forward = $derived(duel.player.attack >= STRIKE_THRESHOLD)
</script>

<div class="mode-hud pointer-events-none absolute inset-0 overflow-hidden" data-tone="rose">
  <!-- The room remains the arena. These edge gradients frame it without
       replacing it, so doors, the hunter and every prepared object stay part
       of the player's reading during contact. -->
  <div class="duel-vignette absolute inset-0"></div>

  <h2 class="mode-hud-label duel-title absolute left-1/2 top-4 -translate-x-1/2 text-center">
    {labels.title}
  </h2>

  <div class="duel-bodies absolute inset-x-3 top-14 flex items-start justify-between sm:inset-x-8">
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
  <div class="absolute left-1/2 top-14 w-52 -translate-x-1/2 sm:w-64">
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

  <p
    class="absolute inset-x-0 top-24 h-4 text-center text-xs uppercase tracking-widest text-violet-300"
  >
    {duel.breaking > 0 ? labels.state.breaking : ''}
  </p>

  <section
    class="mode-hud-surface duel-console pointer-events-auto absolute inset-x-3 bottom-3 mx-auto max-w-[38rem] overflow-y-auto p-2 sm:bottom-6 sm:p-3 mb-[env(safe-area-inset-bottom)]"
    aria-label={labels.title}
  >
    <div class="grid grid-cols-4 gap-1.5" aria-label={labels.action.guard}>
      {#each BODY_ZONES as zone, index (zone)}
        <button
          class="mode-hud-button"
          aria-pressed={duel.player.guard === zone}
          aria-keyshortcuts={String(index + 1)}
          onclick={() => onGuard(zone)}
        >
          <kbd>{index + 1}</kbd>{labels.zone[zone]}
        </button>
      {/each}
    </div>

    <label
      class="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[0.65rem] uppercase tracking-widest text-white/45"
    >
      <span>{labels.action.reserve}</span>
      <input
        class="ryu-range"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={duel.player.attack}
        aria-label={labels.action.press}
        oninput={(event) => onRyu(Number(event.currentTarget.value))}
      />
      <span>{labels.action.press}</span>
    </label>

    <div class="mt-3 grid grid-cols-4 gap-1.5">
      <button class="mode-hud-button" aria-pressed={duel.player.gyo} onclick={onGyo}>
        <kbd>G</kbd>{labels.action.observe}
      </button>
      <button class="mode-hud-button" aria-pressed={duel.player.in} onclick={onIn}>
        <kbd>I</kbd>{labels.action.conceal}
      </button>
      <button class="mode-hud-button" aria-pressed={duel.player.ken} onclick={onKen}>
        <kbd>K</kbd>{labels.action.endure}
      </button>
      <button
        class="mode-hud-button mode-command"
        data-primary
        aria-keyshortcuts="J Space C F"
        disabled={!canCharge(duel.player)}
        onclick={onKo}
      >
        <kbd>J</kbd>{labels.action.strike}
      </button>
    </div>

    <div class="mt-1.5 grid grid-cols-2 gap-1.5">
      <button class="mode-hud-button" aria-pressed={duel.player.zetsu} onclick={onBreakAway}>
        <kbd>X</kbd>{labels.action.breakAway}
      </button>
      {#if canRecover}
        <button
          class="mode-hud-button"
          data-primary
          aria-keyshortcuts={HUNT_PAGE_KEYS.take.slice(3)}
          onclick={onRecover}
        >
          <kbd>{HUNT_PAGE_KEYS.take.slice(3)}</kbd>{labels.action.recover}
        </button>
      {/if}
    </div>
    <button class="mode-hud-button arena mt-1.5 w-full" onclick={onArena}>
      {arenaLabel}
    </button>
  </section>
</div>

<style>
  .duel-title {
    color: var(--mode-accent);
  }
  .duel-console {
    max-height: 48%;
    container-type: inline-size;
  }
  .duel-console button {
    min-height: 2.5rem;
    padding-inline: 0.3rem;
  }
  .arena {
    color: #efce88;
  }
  @media (pointer: coarse) {
    .duel-console button {
      min-height: 2.75rem;
    }
  }
  .ryu-range:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
  @container (max-width: 24rem) {
    .duel-console button {
      font-size: 0.72rem;
    }
  }
  .ryu-range {
    accent-color: rgb(125 211 252);
    width: 100%;
  }
  .duel-vignette {
    background:
      linear-gradient(
        to bottom,
        rgb(0 0 0 / 0.58),
        transparent 25%,
        transparent 62%,
        rgb(0 0 0 / 0.55)
      ),
      linear-gradient(
        to right,
        rgb(0 0 0 / 0.42),
        transparent 22%,
        transparent 78%,
        rgb(0 0 0 / 0.42)
      );
    box-shadow: inset 0 0 6rem rgb(127 29 29 / 0.12);
  }
  .duel-bodies :global(figure) {
    transform: scale(0.72);
    transform-origin: top center;
  }
  @media (max-height: 720px) {
    .duel-bodies :global(figure) {
      transform: scale(0.55);
    }
  }
</style>
