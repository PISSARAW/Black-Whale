<script lang="ts">
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: vision = elapsed >= 1.1 && elapsed < 4.77
  $: divergence = elapsed >= 4.77 && elapsed < 7.2
  $: reality = elapsed >= 7.2 && elapsed < 8
  $: seconds = Math.max(0, 10 - Math.floor(((elapsed - 1.1) / 3.67) * 10))
</script>

{#if vision}
  <div class="future-vision-screen" aria-hidden="true"></div>
{/if}
{#if vision || divergence || reality}
  <div class="future-verdict-phase" class:reality class:divergence>
    <span
      >{vision
        ? fr
          ? 'VISION DU FUTUR'
          : 'FUTURE VISION'
        : divergence
          ? fr
            ? 'VISION ET RÉALITÉ'
            : 'VISION AND REALITY'
          : fr
            ? 'LA RÉALITÉ'
            : 'REALITY'}</span
    >
    <strong
      >{vision
        ? `+${seconds.toString().padStart(2, '0')}.00`
        : divergence
          ? 'DIVERGENCE'
          : fr
            ? 'TROP TARD'
            : 'TOO LATE'}</strong
    >
    <i style={`--forecast:${vision ? 1 - seconds / 10 : 1}`}></i>
  </div>
{/if}

<style>
  .future-vision-screen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    backdrop-filter: saturate(0.12) contrast(1.35);
    background:
      repeating-linear-gradient(
        0deg,
        #090c1a18 0px,
        #090c1a18 1px,
        transparent 1px,
        transparent 4px
      ),
      radial-gradient(ellipse at 50% 48%, transparent 24%, #04142d55 68%, #02050ed9 100%);
    box-shadow: inset 0 0 80px #abc5e42b;
  }
  .future-verdict-phase {
    position: absolute;
    top: 12%;
    left: 4%;
    display: grid;
    gap: 0.45rem;
    width: min(17rem, 36%);
    color: #85d4ee;
    text-shadow: 0 2px 8px #05090d;
    font-family: var(--font-mono, monospace);
  }
  span {
    font-size: clamp(8px, 1vw, 12px);
    letter-spacing: 0.15em;
  }
  strong {
    font-size: clamp(18px, 2.7vw, 36px);
    letter-spacing: 0.05em;
  }
  i {
    height: 2px;
    background: currentColor;
    transform: scaleX(var(--forecast));
    transform-origin: left;
  }
  .divergence {
    color: #dbbd78;
  }
  .reality {
    color: #e98b7c;
  }
</style>
