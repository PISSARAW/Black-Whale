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
  }: Props = $props()

  let forward = $derived(duel.player.attack >= STRIKE_THRESHOLD)
</script>

<div
  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
>
  <h2 class="mb-8 text-xs uppercase tracking-[0.4em] text-rose-300">{labels.title}</h2>

  <div class="flex items-start gap-10 sm:gap-20">
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
  <div class="mt-6 w-64">
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

  <p class="mt-4 h-4 text-xs uppercase tracking-widest text-violet-300">
    {duel.breaking > 0 ? labels.state.breaking : ''}
  </p>

  <section
    class="pointer-events-auto mt-4 w-[min(94vw,38rem)] rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-md"
    aria-label={labels.title}
  >
    <div class="grid grid-cols-4 gap-1.5" aria-label={labels.action.guard}>
      {#each BODY_ZONES as zone, index (zone)}
        <button
          class="duel-action"
          class:active={duel.player.guard === zone}
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
      <button class="duel-action" class:active={duel.player.gyo} onclick={onGyo}>
        <kbd>G</kbd>{labels.action.observe}
      </button>
      <button class="duel-action" class:active={duel.player.in} onclick={onIn}>
        <kbd>I</kbd>{labels.action.conceal}
      </button>
      <button class="duel-action" class:active={duel.player.ken} onclick={onKen}>
        <kbd>K</kbd>{labels.action.endure}
      </button>
      <button class="duel-action danger" disabled={!canCharge(duel.player)} onclick={onKo}>
        <kbd>␣</kbd>{labels.action.strike}
      </button>
    </div>

    <div class="mt-1.5 grid grid-cols-2 gap-1.5">
      <button class="duel-action warning" class:active={duel.player.zetsu} onclick={onBreakAway}>
        <kbd>X</kbd>{labels.action.breakAway}
      </button>
      {#if canRecover}
        <button class="duel-action active" onclick={onRecover}>
          <kbd>R</kbd>{labels.action.recover}
        </button>
      {/if}
    </div>
  </section>
</div>

<style>
  .duel-action {
    display: flex;
    min-height: 2.35rem;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 0.5rem;
    background: rgb(255 255 255 / 0.04);
    color: rgb(255 255 255 / 0.6);
    font-size: 0.68rem;
    transition: 120ms ease;
  }
  .duel-action:hover:not(:disabled),
  .duel-action.active {
    border-color: rgb(125 211 252 / 0.65);
    background: rgb(125 211 252 / 0.1);
    color: white;
  }
  .duel-action.warning {
    border-color: rgb(196 181 253 / 0.3);
  }
  .duel-action.danger {
    border-color: rgb(251 113 133 / 0.35);
  }
  .duel-action:disabled {
    opacity: 0.25;
  }
  kbd {
    color: rgb(125 211 252);
    font: inherit;
    font-weight: 700;
  }
  .ryu-range {
    accent-color: rgb(125 211 252);
    width: 100%;
  }
  @media (pointer: coarse) {
    kbd {
      display: none;
    }
  }
</style>
