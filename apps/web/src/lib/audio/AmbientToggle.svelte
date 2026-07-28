<script lang="ts">
  import { onMount } from 'svelte'
  import {
    ambientMuffled,
    ambientPlaying,
    ambientWasEnabled,
    startAmbient,
    toggleAmbient,
  } from './ambient.js'

  onMount(() => {
    if (!ambientWasEnabled()) return
    // Autoplay is blocked until the visitor interacts, so a returning listener's
    // preference is honoured on their first click or key press, not on load.
    const resume = () => {
      void startAmbient()
      teardown()
    }
    const teardown = () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('pointerdown', resume, { once: true })
    window.addEventListener('keydown', resume, { once: true })
    return teardown
  })

  $: label = $ambientPlaying
    ? $ambientMuffled
      ? 'Voyage theme sealed by Three Monkeys — turn off'
      : 'Turn off the voyage theme'
    : 'Play the voyage theme'
</script>

<button
  type="button"
  class="ambient-toggle"
  class:on={$ambientPlaying}
  class:muffled={$ambientPlaying && $ambientMuffled}
  aria-pressed={$ambientPlaying}
  aria-label={label}
  title={label}
  onclick={toggleAmbient}
>
  <span class="bars" aria-hidden="true">
    <i></i><i></i><i></i>
  </span>
  <span class="text">{$ambientPlaying && $ambientMuffled ? 'Sealed' : 'Theme'}</span>
</button>

<style>
  .ambient-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.45rem;
    border: 0;
    border-radius: 0.3rem;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    text-transform: uppercase;
  }

  .ambient-toggle:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
  }

  .ambient-toggle.on {
    color: var(--accent-gold);
  }

  .ambient-toggle.muffled {
    color: var(--text-faint);
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 0.7rem;
  }

  .bars i {
    width: 2px;
    height: 30%;
    background: currentColor;
    transition: height var(--duration-base) var(--ease-out);
  }

  .ambient-toggle.on .bars i {
    animation: ambient-bar 1.45s ease-in-out infinite;
  }
  .ambient-toggle.on .bars i:nth-child(2) {
    animation-delay: 0.28s;
  }
  .ambient-toggle.on .bars i:nth-child(3) {
    animation-delay: 0.56s;
  }

  /* Sealed hearing flattens the meter the same way it flattens the mix. */
  .ambient-toggle.muffled .bars i {
    height: 22%;
    animation: none;
    opacity: 0.5;
  }

  @keyframes ambient-bar {
    0%,
    100% {
      height: 25%;
    }
    50% {
      height: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ambient-toggle.on .bars i {
      animation: none;
      height: 65%;
    }
  }
</style>
