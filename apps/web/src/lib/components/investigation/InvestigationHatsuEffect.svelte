<script lang="ts">
  import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
  import { investigationHatsuPresentation } from '$lib/investigation/hatsuPresentation'

  let {
    kind,
    sequence,
    target,
    forbidden = false,
  }: {
    kind: HatsuInteractionKind | null
    sequence: number
    target: string
    forbidden?: boolean
  } = $props()

  const presentation = $derived(kind ? investigationHatsuPresentation(kind) : null)
</script>

{#if presentation && kind}
  {#key sequence}
    <div
      class="hatsu-cinematic {presentation.animation}"
      class:forbidden
      style:--hatsu-colour={presentation.colour}
      style:--hatsu-duration={`${presentation.durationMs}ms`}
      aria-hidden="true"
    >
      <div class="veil"></div>
      <div class="target-ring"><span>{presentation.glyph}</span><small>{target}</small></div>

      {#if presentation.animation === 'dowsing-chain'}
        <div class="chain"><i></i><i></i><i></i><i></i><b>◇</b></div>
      {:else if presentation.animation === 'scarlet-eyes'}
        <div class="eyes"><i></i><i></i></div>
        <div class="aura-wave"></div>
      {:else if presentation.animation === 'little-eye'}
        <div class="insect"><i></i><b></b><b></b></div>
        <div class="scan"></div>
      {:else if presentation.animation === 'secret-window'}
        <div class="owl"><i>◉</i><i>◉</i><b>♧</b></div>
        <div class="recording"></div>
      {:else if presentation.animation === 'truth-punch'}
        <div class="fist">拳</div>
        <div class="impact"></div>
        <div class="procedure">×</div>
      {:else if presentation.animation === 'silent-majority'}
        <div class="doll">●</div>
        <div class="serpent s1">∿</div>
        <div class="serpent s2">∿</div>
        <div class="serpent s3">∿</div>
        <div class="serpent s4">∿</div>
      {:else}
        <div class="aura-wave"></div>
      {/if}
    </div>
  {/key}
{/if}

<style>
  .hatsu-cinematic {
    position: absolute;
    inset: 0;
    z-index: 58;
    overflow: hidden;
    pointer-events: none;
    animation: depart var(--hatsu-duration) both;
  }
  .veil {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 48%,
      color-mix(in srgb, var(--hatsu-colour) 22%, transparent),
      rgba(2, 5, 8, 0.72)
    );
    animation: veil var(--hatsu-duration) both;
  }
  .target-ring {
    position: absolute;
    left: 50%;
    top: 48%;
    display: grid;
    width: 9rem;
    height: 9rem;
    translate: -50% -50%;
    place-items: center;
    border: 1px solid var(--hatsu-colour);
    border-radius: 50%;
    color: var(--hatsu-colour);
    box-shadow: 0 0 35px color-mix(in srgb, var(--hatsu-colour) 55%, transparent);
    animation: ring var(--hatsu-duration) both;
  }
  .target-ring span {
    font-size: 2.2rem;
    text-shadow: 0 0 15px currentColor;
  }
  .target-ring small {
    position: absolute;
    top: 105%;
    width: 16rem;
    text-align: center;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: white;
  }
  .chain {
    position: absolute;
    left: 8%;
    top: 5%;
    width: 42%;
    height: 44%;
    transform-origin: top left;
    animation: swing var(--hatsu-duration) ease-in-out both;
  }
  .chain i {
    position: absolute;
    left: 48%;
    width: 0.5rem;
    height: 1.9rem;
    border: 1px solid #d8e5ef;
    border-radius: 50%;
    transform: translateY(calc(var(--link, 0) * 1.55rem));
  }
  .chain i:nth-child(1) {
    --link: 0;
  }
  .chain i:nth-child(2) {
    --link: 1;
  }
  .chain i:nth-child(3) {
    --link: 2;
  }
  .chain i:nth-child(4) {
    --link: 3;
  }
  .chain b {
    position: absolute;
    left: 43%;
    top: 6.2rem;
    font-size: 2rem;
    color: #d8e5ef;
  }
  .eyes {
    position: absolute;
    inset: 32% 30% auto;
    display: flex;
    justify-content: space-between;
  }
  .eyes i {
    width: 5rem;
    height: 2.2rem;
    border-radius: 60% 10%;
    background: #e3202c;
    box-shadow: 0 0 35px #ef3340;
    animation: eye var(--hatsu-duration) both;
  }
  .aura-wave,
  .impact,
  .scan,
  .recording {
    position: absolute;
    left: 50%;
    top: 48%;
    width: 8rem;
    height: 8rem;
    translate: -50% -50%;
    border: 2px solid var(--hatsu-colour);
    border-radius: 50%;
    animation: expand var(--hatsu-duration) ease-out both;
  }
  .insect {
    position: absolute;
    left: 15%;
    top: 64%;
    width: 2rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--hatsu-colour);
    box-shadow: 0 0 18px var(--hatsu-colour);
    animation: fly var(--hatsu-duration) cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .insect b {
    position: absolute;
    top: -0.45rem;
    width: 1.3rem;
    height: 0.8rem;
    border: 1px solid var(--hatsu-colour);
    border-radius: 50%;
  }
  .insect b:first-of-type {
    left: -0.8rem;
    rotate: 25deg;
  }
  .insect b:last-child {
    right: -0.8rem;
    rotate: -25deg;
  }
  .owl {
    position: absolute;
    left: 50%;
    top: 46%;
    translate: -50% -50%;
    width: 9rem;
    height: 7rem;
    border-radius: 50% 50% 35% 35%;
    background: #142534;
    border: 1px solid var(--hatsu-colour);
    text-align: center;
    animation: perch var(--hatsu-duration) both;
  }
  .owl i {
    display: inline-block;
    margin: 1.8rem 0.55rem 0;
    color: #dff3ff;
    text-shadow: 0 0 12px var(--hatsu-colour);
  }
  .owl b {
    display: block;
    color: var(--hatsu-colour);
  }
  .fist {
    position: absolute;
    left: 50%;
    top: 95%;
    translate: -50% 0;
    font-size: 6rem;
    color: var(--hatsu-colour);
    filter: drop-shadow(0 0 18px var(--hatsu-colour));
    animation: punch var(--hatsu-duration) both;
  }
  .procedure {
    position: absolute;
    left: 50%;
    top: 48%;
    translate: -50% -50%;
    font-size: 9rem;
    color: #ef4444;
    opacity: 0;
    animation: block var(--hatsu-duration) both;
  }
  .doll {
    position: absolute;
    left: 50%;
    top: 28%;
    translate: -50%;
    font-size: 5rem;
    color: #09090b;
    filter: drop-shadow(0 0 16px var(--hatsu-colour));
    animation: perch var(--hatsu-duration) both;
  }
  .serpent {
    position: absolute;
    left: 50%;
    top: 48%;
    font-size: 5rem;
    color: #f4f2ff;
    text-shadow: 0 0 14px var(--hatsu-colour);
    transform-origin: 0 0;
    animation: coil var(--hatsu-duration) both;
  }
  .s1 {
    --angle: 20deg;
  }
  .s2 {
    --angle: 110deg;
  }
  .s3 {
    --angle: 200deg;
  }
  .s4 {
    --angle: 290deg;
  }
  .forbidden .veil {
    background: rgba(20, 0, 0, 0.72);
  }
  @keyframes depart {
    0%,
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes veil {
    0% {
      opacity: 0;
    }
    18%,
    72% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes ring {
    0% {
      scale: 0.2;
      opacity: 0;
    }
    25%,
    70% {
      scale: 1;
      opacity: 1;
    }
    100% {
      scale: 1.5;
      opacity: 0;
    }
  }
  @keyframes expand {
    0% {
      scale: 0.1;
      opacity: 0;
    }
    30% {
      opacity: 0.9;
    }
    100% {
      scale: 7;
      opacity: 0;
    }
  }
  @keyframes swing {
    0% {
      rotate: -35deg;
      opacity: 0;
    }
    35% {
      rotate: 12deg;
      opacity: 1;
    }
    70% {
      rotate: -5deg;
    }
    100% {
      rotate: 0;
      opacity: 0;
    }
  }
  @keyframes eye {
    0% {
      scale: 0 1;
    }
    25%,
    75% {
      scale: 1;
    }
    100% {
      scale: 1.2;
      opacity: 0;
    }
  }
  @keyframes fly {
    0% {
      translate: 0 0;
      scale: 0.2;
    }
    45% {
      translate: 34vw -32vh;
      scale: 1;
    }
    75% {
      translate: 58vw -18vh;
      scale: 0.75;
    }
    100% {
      translate: 75vw -48vh;
      opacity: 0;
    }
  }
  @keyframes perch {
    0% {
      scale: 0.3;
      opacity: 0;
      translate: -50% -70%;
    }
    30%,
    75% {
      scale: 1;
      opacity: 1;
      translate: -50% -50%;
    }
    100% {
      scale: 1.2;
      opacity: 0;
      translate: -50% -50%;
    }
  }
  @keyframes punch {
    0% {
      translate: -50% 0;
    }
    45% {
      translate: -50% -55vh;
    }
    65%,
    100% {
      translate: -50% -48vh;
      opacity: 0;
    }
  }
  @keyframes block {
    0%,
    40% {
      opacity: 0;
      scale: 0.3;
    }
    55%,
    85% {
      opacity: 1;
      scale: 1;
    }
    100% {
      opacity: 0;
      scale: 1.2;
    }
  }
  @keyframes coil {
    0% {
      translate: -50% -50%;
      rotate: var(--angle);
      scale: 0.1;
    }
    55% {
      translate: -50% -50%;
      rotate: var(--angle);
      scale: 1.2;
    }
    100% {
      translate: calc(-50% + 28vw) -50%;
      rotate: calc(var(--angle) + 160deg);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hatsu-cinematic * {
      animation-duration: 0.2s !important;
    }
    .hatsu-cinematic {
      animation-duration: 0.35s !important;
    }
  }
</style>
