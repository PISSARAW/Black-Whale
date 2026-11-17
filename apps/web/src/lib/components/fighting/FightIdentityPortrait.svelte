<script lang="ts">
  import { onMount } from 'svelte'
  import { fightIdentityPortrait } from '$lib/fighting/fightIdentityPortrait'
  import type { FighterId } from '$lib/fighting/types'
  export let id: FighterId
  let image: string | null = null
  onMount(() => {
    let active = true
    void fightIdentityPortrait(id).then((value) => {
      if (active) image = value
    })
    return () => {
      active = false
    }
  })
</script>

<span class="fight-identity-portrait" aria-hidden="true">
  {#if image}<img src={image} alt="" width="56" height="56" decoding="async" />{/if}
</span>

<style>
  .fight-identity-portrait {
    display: block;
    flex: 0 0 auto;
    width: 56px;
    height: 56px;
    align-self: start;
    border: 1px solid #d8bc9299;
    border-radius: 5px;
    background: linear-gradient(135deg, #4c334a, #17111f);
    overflow: hidden;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  @media (max-width: 600px), (max-height: 600px) {
    .fight-identity-portrait {
      width: 40px;
      height: 40px;
    }
  }
</style>
