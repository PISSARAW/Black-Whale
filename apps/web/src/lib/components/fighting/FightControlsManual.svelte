<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import {
    CONTROL_KEYS,
    CONTROL_LABELS,
    controlKeyLabel,
    type ControlCommand,
  } from '$lib/fighting/fightInputBindings'
  const bindings = useFightBindings()
  import type { FightMode, FighterId } from '$lib/fighting/types'
  import FightMoveList from './FightMoveList.svelte'

  export let language: 'fr' | 'en'
  export let fighterId: FighterId
  export let mode: FightMode
  export let title: string
  $: commands = (Object.keys(CONTROL_KEYS) as ControlCommand[]).filter(
    (command) => mode !== 'versus-ai' || !command.startsWith('opponent'),
  )
</script>

<aside class="control-manual">
  <h2>{title}</h2>
  <div class="input-reference">
    {#each commands as command (command)}
      <div>
        <span>{CONTROL_LABELS[command][language === 'fr' ? 0 : 1]}</span><kbd
          >{controlKeyLabel($bindings[command], language)}</kbd
        >
      </div>
    {/each}
  </div>
  <p>
    {language === 'fr'
      ? 'Double appui : dash. Direction + coup : variante. Les routes et conditions des techniques sont propres au combattant.'
      : 'Double tap: dash. Direction + attack: variant. Routes and technique conditions are fighter-specific.'}
  </p>
  <p>
    {language === 'fr'
      ? 'Easter Eggs : F2 (P2 : F4), touches configurables dans « Gestes et secrets ». Seule : geste 1 ; avec avant : 2 ; arrière : 3 ; bas : secret. Les boutons fonctionnent aussi au tactile.'
      : 'Easter Eggs: F2 (P2: F4), configurable in “Gestures and secrets”. Alone: gesture 1; with forward: 2; back: 3; down: secret. Buttons also work on touchscreens.'}
  </p>
  <p>
    {language === 'fr'
      ? 'Aura + Projection engage la super-projection. Le mode Classique utilise ↓ ↘ → + Hatsu pour les supers à motion. Le Kaméo prend la direction du déplacement au moment de l’appel.'
      : 'Aura + Throw commits to a super throw. Classic uses ↓ ↘ → + Hatsu for motion supers. The Kameo uses the movement direction at the time of the call.'}
  </p>
  <p>
    {language === 'fr'
      ? 'Maintiens la touche Nen avant le second appui : Léger / Lourd / Hatsu / Ultime donnent En / In / Shu / Gyo. Kaméo / Projectile / Projection / Burst ciblent tête / torse / mains / jambes. Aura donne Ren, Aura + Garde donne Ken. Une zone sous Aura donne Ryu et une zone sous Garde demande le Ko défensif.'
      : 'Hold Nen before the second press: Light / Heavy / Hatsu / Finisher select En / In / Shu / Gyo. Kameo / Projectile / Throw / Burst target head / torso / hands / legs. Aura gives Ren, Aura + Guard gives Ken. Use a zone with Aura for Ryu or with Guard for defensive Ko.'}
  </p>
  <p>
    {language === 'fr'
      ? 'Nen + Aura : Zetsu. Nen + On : Gyo faible. Pour un Seiyaku directionnel, maintiens d’abord la direction, puis Nen + Contexte. Nen + gauche / droite / haut / bas : parler / interagir / couvrir les oreilles / boucher les plaies.'
      : 'Nen + Aura: Zetsu. Nen + On: low Gyo. For a directional Seiyaku, hold the direction first, then Nen + Context. Nen + Left / Right / Up / Down: speak / interact / cover ears / plug wounds.'}
  </p>
  <FightMoveList {fighterId} {language} />
</aside>

<style>
  .input-reference {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.4rem 1.5rem;
    width: 100%;
    font-size: 0.8rem;
  }
  .input-reference > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
  }
  kbd {
    padding: 0.2rem 0.4rem;
    border: 1px solid #526573;
    color: #e8d18c;
    overflow-wrap: anywhere;
  }
</style>
