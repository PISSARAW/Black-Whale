<script lang="ts">
  import {
    BASHO_POEMS,
    bashoCanWrite,
    recognizedBashoPoem,
    hasBashoPoem,
  } from '$lib/fighting/bashoPoem'
  import { chrolloHasActivePage } from '$lib/fighting/chrolloBook'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onCompose: (side: FightSide, text: string) => void
  export let onEditing: () => void = () => {}
  let drafts: Partial<Record<FightSide, string>> = {}
  const sides: FightSide[] = ['player', 'opponent']
  $: fr = language === 'fr'
  $: relevant = sides.some((side) => poet(state, side))
  const name = (side: FightSide) => fighterDefinition(state[side].id).name
  const human = (side: FightSide) => side === 'player' || state.mode !== 'versus-ai'
  const draft = (
    side: FightSide,
    values: Partial<Record<FightSide, string>>,
    locale: 'fr' | 'en',
  ) => values[side] ?? BASHO_POEMS[locale]
  function poet(current: FightState, side: FightSide) {
    const fighter = current[side]
    return (
      fighter.id === 'basho' ||
      hasBashoPoem(fighter) ||
      chrolloHasActivePage(fighter, 'basho') ||
      Boolean(fighter.bashoPoem || fighter.bashoBurn)
    )
  }
</script>

{#if relevant}
  <aside class="poem-panel" aria-label="Great Hiker">
    <strong>Great Hiker · {fr ? 'Le poème fait effet' : 'The poem takes effect'}</strong>
    <details open={!sides.some((side) => state[side].bashoPoem?.ready)}>
      <summary
        >{fr
          ? 'Composer le poème et lire les conditions'
          : 'Compose the poem and read its conditions'}</summary
      >
      <p>
        {fr
          ? 'Composition prise en charge : le haïku du chapitre 68 qui enflamme ce que frappe le poing. Les trois lignes ci-dessous en sont une traduction de sens. Les autres poèmes ne sont pas interprétés par ce duel.'
          : 'Supported composition: the chapter 68 haiku that ignites what the fist strikes. The three lines below translate its meaning. Other poems are not interpreted by this duel.'}
      </p>
      <p>
        {fr
          ? 'Condition : finir d’écrire, puis toucher avec un coup de poing. Échec, parade, coup de pied, projection et projectile ne déclenchent rien. Un contact sur garde peut enflammer.'
          : 'Condition: finish writing, then connect with a fist strike. Misses, parries, kicks, throws and projectiles do nothing. A guarded fist contact can ignite.'}
      </p>
      <small
        >{fr
          ? 'Réglages de duel : écriture 1 s · 25 aura · brûlure 1,5 s, 2 dégâts toutes les 0,5 s avant défense Nen. Bouger, garder ou être frappé interrompt l’écriture. Aucun bonus général. La qualité compte dans le manga ; aucune note littéraire automatique n’est inventée ici.'
          : 'Duel tuning: 1 s writing · 25 aura · 1.5 s burn, 2 damage every 0.5 s before Nen defence. Moving, guarding or being hit interrupts writing. No general boost. Quality matters in the manga; no automatic literary score is invented here.'}</small
      >
      {#each sides.filter((side) => poet(state, side)) as side (side)}
        {#if human(side) && (state[side].id === 'basho' || hasBashoPoem(state[side]))}
          <label for={`haiku-${side}`}
            >{name(side)} · {fr ? 'Écrire les trois vers' : 'Write the three lines'}</label
          >
          <textarea
            id={`haiku-${side}`}
            rows="3"
            maxlength="240"
            value={draft(side, drafts, language)}
            onfocus={onEditing}
            oninput={(event) => (drafts = { ...drafts, [side]: event.currentTarget.value })}
            disabled={paused || (state[side].bashoPoem?.writingFrames ?? 0) > 0}
            spellcheck="false"></textarea>
          {#if !recognizedBashoPoem(draft(side, drafts, language))}
            <p class="warning" role="status">
              {fr
                ? 'Poème non pris en charge : aucun effet ni dépense. Recopiez la composition attestée pour l’activer.'
                : 'Unsupported poem: no effect or cost. Copy the attested composition to activate it.'}
            </p>
          {/if}
          <div class="actions">
            <button
              type="button"
              onclick={() => (drafts = { ...drafts, [side]: BASHO_POEMS[language] })}
            >
              {fr ? 'Recopier le poème attesté' : 'Copy the attested poem'}
            </button>
            <button
              type="button"
              disabled={paused ||
                !recognizedBashoPoem(draft(side, drafts, language)) ||
                !bashoCanWrite(state, side)}
              onclick={() => onCompose(side, draft(side, drafts, language))}
            >
              {fr ? 'Écrire sur le papier · 25 aura' : 'Write on paper · 25 aura'}
            </button>
          </div>
        {/if}
      {/each}
    </details>
    {#each sides.filter((side) => poet(state, side)) as side (side)}
      {#if state[side].bashoPoem}
        <p class="status" role="status">
          {name(side)} · {state[side].bashoPoem?.ready
            ? fr
              ? 'Poème écrit : le prochain contact du poing peut enflammer.'
              : 'Poem written: a connecting fist can ignite.'
            : fr
              ? 'Écriture en cours… Restez immobile et exposé.'
              : 'Writing… Remain still and exposed.'}
        </p>
        <blockquote>{state[side].bashoPoem?.text}</blockquote>
      {/if}
      {#if state[side].bashoBurn}
        <p class="warning" role="status">
          {name(side)} · {fr ? 'En feu' : 'Burning'} · {(
            (state[side].bashoBurn?.remainingFrames ?? 0) / 60
          ).toFixed(1)} s
        </p>
      {/if}
    {/each}
  </aside>
{/if}

<style>
  .poem-panel {
    padding: 0.8rem 1rem;
    background: #221b13;
    border: 1px solid #b39664;
    border-radius: 0.5rem;
    color: #f2e4c6;
    font: 500 0.8rem/1.5 var(--font-body);
  }
  summary {
    cursor: pointer;
    color: #efcf88;
    margin-top: 0.25rem;
  }
  p {
    margin: 0.45rem 0;
  }
  small {
    color: #d4c3a4;
    display: block;
  }
  label {
    display: block;
    margin-top: 0.8rem;
  }
  textarea {
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: 35rem;
    padding: 0.5rem;
    background: #f4e9d0;
    color: #251b10;
    border: 1px solid #b39664;
    border-radius: 0.25rem;
    font: inherit;
    resize: vertical;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  button {
    padding: 0.4rem 0.6rem;
    color: #f5e7ca;
    background: #3d3020;
    border: 1px solid #b39664;
    border-radius: 0.3rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible,
  textarea:focus-visible {
    outline: 2px solid #f3c875;
    outline-offset: 2px;
  }
  .warning {
    color: #ffbb81;
  }
  .status {
    color: #efcf88;
  }
  blockquote {
    white-space: pre-line;
    margin: 0.5rem 0;
    border-left: 2px solid #b39664;
    padding-left: 0.8rem;
  }
</style>
