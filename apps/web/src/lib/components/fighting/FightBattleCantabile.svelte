<script lang="ts">
  import { battleCanStart } from '$lib/fighting/battleCantabileAction'
  import { battleAppearance } from '$lib/fighting/battleCantabileRules'
  import { BATTLE_MOVES } from '$lib/fighting/battleCantabileTypes'
  import { chrolloHasActivePage } from '$lib/fighting/chrolloBook'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let onTalk: (side: FightSide) => void = () => {}
  export let onBattleAction: (side: FightSide, moveId: string) => void = () => {}

  $: fighter = state[side]
  $: battle = fighter.battleCantabile
  $: model = battleAppearance(state[side === 'player' ? 'opponent' : 'player'])
  $: known = battle?.models[model]
  $: shared = state.player.id === 'bonolenov' || state.opponent.id === 'bonolenov'
  $: controlled = side === 'player' || state.mode === 'versus-local'
  $: copied =
    fighter.id !== 'bonolenov' &&
    (chrolloHasActivePage(fighter, 'bonolenov') || fighter.kurapika?.held?.source === 'bonolenov')
</script>

{#if fighter.id === 'bonolenov'}
  <div class="battle-cantabile" aria-label="Battle Cantabile">
    <strong>Battle Cantabile</strong>
    {#if battle?.preparation}
      <span
        >{language === 'fr' ? 'Danse et mélodie' : 'Dance and melody'} · {battle.preparation.piece} ·
        {Math.ceil(battle.preparation.remaining / 60)} s</span
      >
    {:else if battle?.prologue}
      <span
        >Prologue · {language === 'fr'
          ? 'tenue et lance matérialisées · → + L : frapper'
          : 'conjured attire and spear · → + L: thrust'}</span
      >
    {:else if battle?.form}
      <span
        >Metamorphosen · {fighterDefinition(battle.form.model).name} · {(
          battle.form.remaining / 60
        ).toFixed(1)} s</span
      >
      <span
        >{language === 'fr'
          ? 'Apparence seule · aucun pouvoir copié'
          : 'Appearance only · no copied powers'}</span
      >
    {:else}
      <span
        >{language === 'fr'
          ? 'Danse requise avant chaque pièce'
          : 'Dance required before every piece'}</span
      >
    {/if}
    <span
      >Jupiter · {language === 'fr'
        ? 'poursuite dans la portée du son'
        : 'pursuit within earshot'}</span
    >
    <span
      >{fighterDefinition(model).name} · {language === 'fr' ? 'échange parlé' : 'spoken exchange'} : {known?.spoken
        ? language === 'fr'
          ? 'oui'
          : 'yes'
        : language === 'fr'
          ? 'requis'
          : 'required'} · {language === 'fr' ? 'temps partagé' : 'shared time'} : {(
        (known?.frames ?? 0) / 60
      ).toFixed(1)} s</span
    >
    <small
      >{language === 'fr'
        ? 'Durées de danse, portée et collisions : adaptation au duel. T et V à proximité : parler et répondre.'
        : 'Dance durations, range and collisions: duel adaptation. T and V nearby: speak and reply.'}</small
    >
    {#if controlled}
      <div class="battle-actions">
        {#each [['prologue', 'Prologue'], ['spear', language === 'fr' ? 'Lance' : 'Spear'], ['jupiter', 'Jupiter'], ['metamorphosen', 'Metamorphosen'], ['stop', language === 'fr' ? 'Cesser / revenir' : 'Stop / revert']] as [piece, label] (piece)}
          {@const moveId = BATTLE_MOVES[piece as keyof typeof BATTLE_MOVES]}
          <button
            disabled={state.phase !== 'fighting' || !battleCanStart(state, side, moveId)}
            on:click={() => onBattleAction(side, moveId)}>{label}</button
          >
        {/each}
      </div>
    {/if}
  </div>
{:else if copied}
  <div class="battle-cantabile">
    Battle Cantabile · {language === 'fr'
      ? 'copie sans les orifices corporels requis : musique impossible'
      : 'copy lacks the required body holes: music unavailable'}
  </div>
{/if}
{#if shared && controlled}
  <button class="battle-talk" on:click={() => onTalk(side)}
    >{language === 'fr' ? 'Parler / répondre au modèle' : 'Speak / reply to the model'}</button
  >
{/if}

<style>
  .battle-cantabile {
    display: grid;
    gap: 0.2rem;
    color: #e8ce96;
    overflow-wrap: anywhere;
  }
  .battle-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  button {
    padding: 0.3rem 0.45rem;
    border: 1px solid #867047;
    background: #1a1813;
    color: #e8ce96;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
  }
  small {
    font: inherit;
    opacity: 0.85;
  }
</style>
