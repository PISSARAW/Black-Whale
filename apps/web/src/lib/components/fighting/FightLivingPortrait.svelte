<script lang="ts">
  import { onMount } from 'svelte'
  import { fightLivingPortraits, type LivingPortraitSet } from '$lib/fighting/fightIdentityPortrait'
  import type { LivingPortraitMood } from '$lib/fighting/perception/opponentHudView'
  import type { FighterId } from '$lib/fighting/types'

  export let id: FighterId
  export let mood: LivingPortraitMood = 'calm'
  export let textureMasked = false
  export let auraSeeping = false
  export let adrenalineAlert = false
  export let blinded = false

  let portraits: LivingPortraitSet = { calm: null, strained: null, critical: null }

  onMount(() => {
    let active = true
    void fightLivingPortraits(id).then((value) => {
      if (active) portraits = value
    })
    return () => {
      active = false
    }
  })

  $: image = portraits[mood] ?? portraits.calm
</script>

<span
  class="fight-living-portrait mood-{mood}"
  class:texture-masked={textureMasked}
  class:aura-seeping={auraSeeping}
  class:adrenaline={adrenalineAlert}
  class:blinded
  data-portrait-mood={mood}
  aria-hidden="true"
>
  {#if image}<img src={image} alt="" width="56" height="56" decoding="async" />{/if}
</span>

<style>
  .fight-living-portrait {
    position: relative;
    display: block;
    flex: 0 0 auto;
    width: 56px;
    height: 56px;
    align-self: start;
    border: 1px solid #d8bc9299;
    border-radius: 5px;
    background: linear-gradient(135deg, #4c334a, #17111f);
    overflow: hidden;
    transition:
      border-color 220ms ease,
      box-shadow 220ms ease,
      filter 220ms ease;
  }
  .fight-living-portrait.mood-strained {
    border-color: #e6a95c;
    box-shadow: inset 0 0 10px #a35a1d55;
  }
  .fight-living-portrait.mood-critical {
    border-color: #e05a5c;
    box-shadow:
      0 0 10px #bd434566,
      inset 0 0 14px #8f1d2488;
    animation: critical-breath 1.6s ease-in-out infinite;
  }
  .fight-living-portrait.texture-masked.aura-seeping {
    border-color: #f38bc2;
    box-shadow:
      0 0 12px #f38bc288,
      inset 0 0 8px #f38bc255;
  }
  .fight-living-portrait.adrenaline {
    box-shadow:
      0 0 14px #ff7b6b99,
      inset 0 0 10px #ff9b8d55;
  }
  .fight-living-portrait.blinded img {
    filter: brightness(0.15) blur(3px);
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  @keyframes critical-breath {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.03);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fight-living-portrait,
    .fight-living-portrait.mood-critical {
      animation: none;
      transition: none;
    }
  }
  @media (max-width: 600px), (max-height: 600px) {
    .fight-living-portrait {
      width: 40px;
      height: 40px;
    }
  }
</style>
