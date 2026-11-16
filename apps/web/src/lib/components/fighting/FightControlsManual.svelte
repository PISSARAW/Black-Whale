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
  <p>{language === 'fr'
    ? 'Easter Eggs : F2 (P2 : F4), touches configurables dans « Gestes et secrets ». Seule : geste 1 ; avec avant : 2 ; arrière : 3 ; bas : secret. Les boutons fonctionnent aussi au tactile.'
    : 'Easter Eggs: F2 (P2: F4), configurable in “Gestures and secrets”. Alone: gesture 1; with forward: 2; back: 3; down: secret. Buttons also work on touchscreens.'}</p>
  <p>
    {language === 'fr'
      ? 'E maintenu (P2 : C) : se couvrir les oreilles, sans garde ni attaque.'
      : 'Hold E (P2: C): cover your ears, without guarding or attacking.'}
  </p>
  <p>
    {language === 'fr'
      ? 'T : interpeller Hanzo ou parler à proximité de Bonolenov. En local, V permet à P2 de répondre ; les deux voix sont requises pour apprendre le modèle de Metamorphosen.'
      : 'T: call to Hanzo or speak near Bonolenov. In local play, V lets P2 reply; both voices are required to learn a Metamorphosen model.'}
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
