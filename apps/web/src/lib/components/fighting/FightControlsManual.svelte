<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import {
    CONTROL_KEYS,
    CONTROL_LABELS,
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
          >{$bindings[command] === ' '
            ? language === 'fr'
              ? 'Espace'
              : 'Space'
            : $bindings[command]}</kbd
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
      ? `${$bindings.playerLight}+${$bindings.playerHeavy} : projection. ${$bindings.playerGuard}+${$bindings.playerSpecial} : projectile. ${$bindings.playerHeavy}+${$bindings.playerSpecial} : ultime. Garde + ${$bindings.playerLight}+${$bindings.playerHeavy} (ou ${$bindings.playerBurst}) : Burst. ${$bindings.playerContext} : action contextuelle (plaies, oreilles, objet, arène, parler).`
      : `${$bindings.playerLight}+${$bindings.playerHeavy}: throw. ${$bindings.playerGuard}+${$bindings.playerSpecial}: projectile. ${$bindings.playerHeavy}+${$bindings.playerSpecial}: finisher. Guard + ${$bindings.playerLight}+${$bindings.playerHeavy} (or ${$bindings.playerBurst}): Burst. ${$bindings.playerContext}: context action (wounds, ears, object, arena, speak).`}
  </p>
  <p>
    {language === 'fr'
      ? 'Aura (modificateur) : seul = Ren ; + Bas = Zetsu maintenu ; + Haut = Gyo ; + Arrière = In ; + Garde = Ken (+ direction = Ko défensif) ; + Hatsu = On. R = En, F = Shu, X = In, G = Gyo et G + 1/2/3/4 cible tête/torse/mains/jambes. Shu est automatique en Ren avec une arme.'
      : 'Aura (modifier): alone = Ren; + Down = sustained Zetsu; + Up = Gyo; + Back = In; + Guard = Ken (+ direction = defensive Ko); + Hatsu = On. R = En, F = Shu, X = In, G = Gyo, and G + 1/2/3/4 targets head/torso/hands/legs. Shu is automatic during Ren with a weapon.'}
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
