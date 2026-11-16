<script lang="ts">
  import type { FightMode, FighterId } from '$lib/fighting/types'
  import FightMoveList from './FightMoveList.svelte'

  export let language: 'fr' | 'en'
  export let fighterId: FighterId
  export let mode: FightMode
  export let title: string
  export let movement: string
  export let jump: string
  export let attacks: string
  export let aura: string
</script>

<aside class="control-manual">
  <h2>{title}</h2>
  <p>{movement}</p>
  <p>{jump}</p>
  <p>{attacks}</p>
  <p>{aura}</p>
  <p>
    {language === 'fr'
      ? 'T : interpeller le corps endormi de Hanzo à proximité pour interrompre sa projection.'
      : 'T: call to Hanzo’s nearby sleeping body to interrupt his projection.'}
  </p>
  {#if mode !== 'versus-ai'}
    <p>
      <strong>P2</strong> · {language === 'fr'
        ? 'Flèches : déplacement · Entrée : garde · Alt : aura · N/M/,/. : attaques · / : projection · V : interpeller'
        : 'Arrows: movement · Enter: guard · Alt: aura · N/M/,/.: attacks · /: throw · V: call out'}
    </p>
  {/if}
  <FightMoveList {fighterId} {language} />
</aside>
