<script lang="ts">
  import { nenStatus } from '$lib/fighting/nen'
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let onAura: (active: boolean) => void

  $: technique = nenStatus(fighter).join(' · ')
</script>

<div class="nen-controls" aria-label={language === 'fr' ? 'Contrôle de l’aura' : 'Aura control'}>
  <button
    type="button"
    class:active={fighter.nen.mode !== 'ten' || fighter.nen.gyo || fighter.nen.ko !== null}
    aria-label={language === 'fr' ? 'Maintenir Aura' : 'Hold Aura'}
    onpointerdown={(event) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      onAura(true)
    }}
    onpointerup={() => onAura(false)}
    onpointercancel={() => onAura(false)}
  >
    <kbd>ESPACE</kbd>
    <strong>AURA</strong>
    <span>{technique}</span>
  </button>
  <p>
    {language === 'fr'
      ? 'Maintenir : Ren · + garde : Ken · + bas : Zetsu · + haut : Gyo · relâcher sur un coup : Ko'
      : 'Hold: Ren · + guard: Ken · + down: Zetsu · + up: Gyo · release on a strike: Ko'}
  </p>
</div>

<style>
  .nen-controls {
    position: absolute;
    z-index: 28;
    top: 5.8rem;
    left: 50%;
    display: grid;
    justify-items: center;
    transform: translateX(-50%);
  }
  button {
    display: grid;
    min-width: 148px;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: center;
    gap: 0.2rem 0.65rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid rgb(116 171 195 / 45%);
    border-radius: 3px;
    background: rgb(4 10 15 / 82%);
    color: #dce9ef;
    backdrop-filter: blur(6px);
    touch-action: none;
  }
  button:hover,
  button.active,
  button:active {
    border-color: #72d9ff;
    background: rgb(21 73 94 / 90%);
    box-shadow: 0 0 18px rgb(75 193 238 / 34%);
  }
  kbd {
    color: #d5b85c;
    font: 700 0.55rem/1 var(--font-mono);
  }
  strong {
    font: 800 0.78rem/1 var(--font-display);
    letter-spacing: 0.14em;
  }
  button span {
    grid-column: 1 / -1;
    color: #87dcff;
    font: 700 0.55rem/1 var(--font-mono);
    text-transform: uppercase;
  }
  p {
    max-width: min(82vw, 620px);
    margin: 0.35rem 0 0;
    color: #a9bbc5;
    font: 600 0.52rem/1.25 var(--font-mono);
    text-align: center;
    text-shadow: 0 1px 5px #000;
  }
  @media (max-width: 760px) {
    .nen-controls {
      top: 4.6rem;
    }
    p {
      display: none;
    }
  }
</style>
