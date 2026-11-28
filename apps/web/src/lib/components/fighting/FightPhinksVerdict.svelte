<script lang="ts">
  import { VICTORY_TITLES } from '$lib/fighting/victory/catalogue'
  import { PHINKS_VERDICT } from '$lib/fighting/victory/phinksTiming'

  export let elapsed: number
  export let language: 'fr' | 'en'
</script>

{#if elapsed >= PHINKS_VERDICT / 60}
  <div class="phinks-verdict" data-phinks-verdict>
    <strong>FATALITY</strong>
    <span>{VICTORY_TITLES.phinks[language === 'fr' ? 0 : 1]}</span>
  </div>
{/if}

<style>
  .phinks-verdict {
    position: absolute;
    top: 42%;
    left: 6%;
    z-index: 3;
    display: grid;
    gap: 0.58em;
    pointer-events: none;
    text-shadow:
      0 4px 26px #07090e,
      0 3px 7px #07090e;
    font-size: clamp(1rem, 2.6vw, 3rem);
  }
  strong {
    color: #ffc989;
    font:
      900 1.95em/0.96 Georgia,
      serif;
    letter-spacing: 0.075em;
  }
  span {
    color: #f4e2d2;
    font:
      700 0.39em/1.3 Arial,
      sans-serif;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }
  @media (max-width: 600px) {
    .phinks-verdict {
      top: auto;
      bottom: 14%;
    }
  }
</style>
