<script lang="ts">
  /**
   * The principles, seen from inside the body using them.
   *
   * A full-screen layer over the walk that draws what `veil.ts` computed and
   * decides nothing itself. Everything on it is a second reading of something
   * the HUD already says in words, which is the condition the step-3 gate puts
   * on animating anything at all: switch this component off and the game is
   * exactly as playable, only duller.
   *
   * Which is also why `calm` is a real branch and not a courtesy. A visitor who
   * has asked their system for less movement gets the same information as a
   * steady state — the ring does not travel, the vignette does not breathe —
   * and, usefully, that is the same rendering the gate has to be judged on.
   */
  import { cueOf, type Cue } from '$lib/hunt/veil'

  interface Props {
    cues: Cue[]
    /** Reduced motion: hold every cue still rather than moving it. */
    calm?: boolean
  }

  let { cues, calm = false }: Props = $props()

  const strengthOf = (kind: Parameters<typeof cueOf>[1]) => cueOf(cues, kind)?.strength ?? 0

  let cast = $derived(cueOf(cues, 'cast'))
  let swept = $derived(cueOf(cues, 'swept'))
  let gathering = $derived(strengthOf('gathering'))
  let zetsu = $derived(strengthOf('zetsu'))
  let gyo = $derived(strengthOf('gyo'))
  let inHeld = $derived(strengthOf('in'))
  let ken = $derived(strengthOf('ken'))
  let sprung = $derived(strengthOf('sprung'))
  let found = $derived(strengthOf('found'))

  /**
   * A ring's radius, as a percentage of the viewport. Held at its widest under
   * reduced motion so the same event still registers without anything crossing
   * the screen.
   */
  const spread = (cue: Cue | null) => (calm ? 70 : 10 + cue!.travel * 80)

  /** Where a directional cue sits on the rim, as a rotation. */
  const facing = (cue: Cue | null) => ((cue?.bearing ?? 0) * 180) / Math.PI
</script>

<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
  <!-- Zetsu: the aura goes down and the room goes cold with it. -->
  <div
    class="absolute inset-0 hunt-cold"
    class:hunt-still={calm}
    style:opacity={zetsu * 0.85}
  ></div>

  <!-- Ten: barely there. A body holding its aura, and nothing more. -->
  <div class="absolute inset-0 hunt-ten" class:hunt-breathe={!calm} style:opacity={strengthOf('ten') * 0.14}></div>

  <!-- Gyo: the edges close in around what is being looked at. -->
  <div class="absolute inset-0 hunt-gyo" style:opacity={gyo * 0.9}></div>

  <!-- In: the player's own light goes out of their own view. -->
  <div class="absolute inset-0 hunt-in" style:opacity={inHeld * 0.7}></div>

  <!-- Ken: covered everywhere, and it costs six a second to stay that way. -->
  <div
    class="absolute inset-0 hunt-ken"
    class:hunt-pulse={!calm}
    style:opacity={ken * 0.55}
  ></div>

  <!-- A sweep of the player's own, leaving them. -->
  {#if cast}
    <div
      class="hunt-ring hunt-ring-cast"
      style:opacity={cast.strength * 0.8}
      style:width="{spread(cast)}vmax"
      style:height="{spread(cast)}vmax"
    ></div>
  {/if}

  <!-- A sweep that passed over them, arriving from a bearing. -->
  {#if swept}
    <div class="absolute inset-0" style:transform="rotate({facing(swept)}deg)">
      <div class="hunt-pressure" style:opacity={swept.strength}></div>
    </div>
  {/if}

  <!-- The wind-up of a Ko: this one fills rather than fades. -->
  {#if gathering > 0}
    <div class="hunt-gather" style:opacity={0.25 + gathering * 0.6} style:transform="scale({1 + gathering * 0.15})"></div>
  {/if}

  <!-- Something of theirs went off; something of theirs was found. -->
  <div class="absolute inset-0 hunt-sprung" style:opacity={sprung * 0.5}></div>
  <div class="absolute inset-0 hunt-found" style:opacity={found * 0.4}></div>
</div>

<style>
  /* Every rule below is a colour and an opacity driven from the script: no
     keyframe carries information on its own, so a reduced-motion visitor loses
     movement and not meaning. */

  .hunt-cold {
    background: radial-gradient(ellipse at center, transparent 25%, rgb(15 23 42 / 0.95) 100%);
    backdrop-filter: grayscale(0.7) brightness(0.72);
    transition: opacity 400ms ease-out;
  }

  .hunt-ten {
    background: radial-gradient(ellipse at center, transparent 55%, rgb(125 211 252 / 0.5) 100%);
  }

  .hunt-gyo {
    background: radial-gradient(circle at center, transparent 18%, rgb(2 6 23 / 0.9) 78%);
    transition: opacity 220ms ease-out;
  }

  .hunt-in {
    background: radial-gradient(ellipse at center, rgb(88 28 135 / 0.35) 0%, transparent 65%);
    backdrop-filter: saturate(0.55);
    transition: opacity 260ms ease-out;
  }

  .hunt-ken {
    box-shadow: inset 0 0 14vmin rgb(250 204 21 / 0.55);
    transition: opacity 200ms ease-out;
  }

  .hunt-sprung {
    box-shadow: inset 0 0 22vmin rgb(167 139 250 / 0.8);
  }

  .hunt-found {
    box-shadow: inset 0 0 18vmin rgb(148 163 184 / 0.7);
  }

  /* A sweep, as a ring leaving the eye. Sized from the script so the travel is
     the same number the tests assert. */
  .hunt-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    border-radius: 9999px;
    border: 0.4vmin solid rgb(125 211 252 / 0.9);
  }

  .hunt-ring-cast {
    box-shadow: 0 0 6vmin rgb(56 189 248 / 0.5);
  }

  /* An incoming sweep is not a ring — it is a pressure on one side of the head.
     Drawn at the top and rotated to the bearing by the wrapper. */
  .hunt-pressure {
    position: absolute;
    inset-inline: 0;
    top: 0;
    height: 32vmin;
    background: linear-gradient(to bottom, rgb(244 63 94 / 0.55), transparent 85%);
  }

  .hunt-gather {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 26vmin;
    height: 26vmin;
    border-radius: 9999px;
    background: radial-gradient(circle, rgb(56 189 248 / 0.5) 0%, transparent 70%);
  }

  .hunt-breathe {
    animation: hunt-breath 4.5s ease-in-out infinite;
  }

  .hunt-pulse {
    animation: hunt-beat 1.6s ease-in-out infinite;
  }

  /* Held still: the state is shown, the movement is not. */
  .hunt-still {
    transition: none;
  }

  @keyframes hunt-breath {
    0%,
    100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes hunt-beat {
    0%,
    100% {
      opacity: 0.75;
    }
    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hunt-breathe,
    .hunt-pulse {
      animation: none;
    }
    .hunt-cold,
    .hunt-gyo,
    .hunt-in,
    .hunt-ken {
      transition: none;
    }
  }
</style>
