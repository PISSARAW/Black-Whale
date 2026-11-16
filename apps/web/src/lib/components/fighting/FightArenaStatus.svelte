<script lang="ts">
  import { arenaTechnique } from '$lib/fighting/arenaTechnique'
  import { arenaObjects } from '$lib/fighting/arenaActions'
  import type { FightState, FightSide, FightInput } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void = () => {}
  $: technique = arenaTechnique(state[side].id)
  $: locale = language === 'fr' ? 0 : 1
  $: objects = arenaObjects(state)
  $: local = side === 'player' || state.mode === 'versus-local'
</script>

{#if state.arena && technique}
  <div class="arena-status">
    <strong>{technique.name[locale]}</strong>
    <span>{technique.effect[locale]}</span>
    <small>{technique.condition[locale]}</small>
    {#if state.arena.tether[side]}
      <span
        >{language === 'fr'
          ? 'Lien actif · O/P : tirer puis lâcher l’ancrage, ou libérer le fil.'
          : 'Active tether · O/P: pull then release the anchor, or release the thread.'}</span
      >
    {/if}
    <span
      >{language === 'fr' ? 'Couverts restants' : 'Remaining cover'} : {objects.length}
      {#if state.arena.stored[side]}
        · {language === 'fr'
          ? 'Caisse aspirée · réactiver pour la rejeter'
          : 'Crate stored · activate to eject'}{/if}
      {#if state.arena.pending[side]}
        · {language === 'fr' ? 'Préparation…' : 'Preparing…'}{/if}
    </span>
    {#if local}
      <button
        type="button"
        disabled={state.phase !== 'fighting'}
        aria-busy={Boolean(state[side].arenaRecovery)}
        onpointerdown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          onControl('arena', true)
        }}
        onpointerup={() => onControl('arena', false)}
        onpointercancel={() => onControl('arena', false)}
        onlostpointercapture={() => onControl('arena', false)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onControl('arena', true)
          }
        }}
        onkeyup={(event) => {
          event.stopPropagation()
          onControl('arena', false)
        }}
        onblur={() => onControl('arena', false)}
        ><kbd>{side === 'player' ? 'O' : 'P'}</kbd>
        {language === 'fr' ? 'Action d’arène' : 'Arena action'}</button
      >
    {/if}
  </div>
{/if}

<style>
  .arena-status {
    display: grid;
    gap: 0.25rem;
    padding-top: 0.5rem;
    border-top: 1px solid #455361;
    overflow-wrap: anywhere;
  }
  strong,
  kbd {
    color: #f1d36d;
  }
  small {
    color: #a5b9c5;
  }
  button {
    min-height: 44px;
    padding: 0.4rem 0.7rem;
    background: #172b32;
    border: 1px solid #66818c;
    color: #ecf5fa;
    font: inherit;
    touch-action: none;
  }
  button:disabled {
    opacity: 0.5;
  }
</style>
