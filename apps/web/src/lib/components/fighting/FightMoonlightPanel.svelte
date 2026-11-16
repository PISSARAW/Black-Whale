<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import { hasMoonlightAuthority, moonlightSigningAvailable } from '$lib/fighting/moonlightContract'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onOffer: (side: FightSide) => void
  export let onRespond: (side: FightSide, accept: boolean) => void

  const sides: FightSide[] = ['player', 'opponent']
  $: fr = language === 'fr'
  $: offer = state.moonlight?.offer
  $: active = state.moonlight?.active
  $: relevant =
    state.player.id === 'longhi' ||
    state.opponent.id === 'longhi' ||
    Boolean(state.moonlight) ||
    sides.some((side) => (state[side].moonlightLoan ?? 0) > 0 || hasMoonlightAuthority(state[side]))
  $: canSign = !paused && moonlightSigningAvailable(state)
  const name = (side: FightSide) => fighterDefinition(state[side].id).name
  const human = (side: FightSide) => side === 'player' || state.mode !== 'versus-ai'

  function outcome(): string {
    const result = state.moonlight?.outcome
    if (!result) return ''
    const who = name(result.side)
    const messages = {
      refused: fr
        ? `${who} refuse. Aucun effet ni sanction.`
        : `${who} declines. No effect or penalty.`,
      expired: fr
        ? 'Proposition expirée. Aucun accord tacite.'
        : 'Offer expired. Silence is not consent.',
      fulfilled: fr
        ? `${who} a respecté le pacte et reçoit un usage de Moonlight Act.`
        : `${who} fulfilled the pact and receives one use of Moonlight Act.`,
      breached: fr
        ? `${who} a rompu la clause : Zetsu jusqu’à la fin du match.`
        : `${who} breached the clause: Zetsu for the rest of the match.`,
    }
    return messages[result.kind]
  }
</script>

{#if relevant}
  <aside class="moonlight-panel" aria-label="Moonlight Act">
    <header>
      <strong>Moonlight Act</strong><span
        >{fr ? 'Pacte de duel · adaptation' : 'Duel pact · adaptation'}</span
      >
    </header>
    <p class="terms">
      {fr
        ? 'Les deux signataires s’engagent à ne lancer aucun coup, projectile ni technique pendant 5 secondes de combat. Déplacements, garde et Nen de base restent libres.'
        : 'Both signatories agree to start no strikes, projectiles or techniques for 5 seconds of combat. Movement, guard and basic Nen remain available.'}
    </p>
    <p class="terms">
      {fr
        ? 'Récompense : le destinataire reçoit un usage de Moonlight Act si le pacte est respecté. Sanction pour chacun : Zetsu en cas de violation — une semaine dans le manga, le reste du match ici.'
        : 'Reward: the recipient receives one use of Moonlight Act on fulfilment. Either signatory incurs Zetsu on breach — one week in the manga, the rest of the match here.'}
    </p>
    {#if offer}
      <p class="status">
        {name(offer.issuer)} → {name(offer.recipient)} · {fr
          ? 'Signature volontaire attendue'
          : 'Awaiting a voluntary signature'} · {Math.ceil(offer.remainingFrames / 60)} s
      </p>
      {#if human(offer.recipient)}
        <div class="actions">
          <button
            type="button"
            disabled={!canSign}
            onclick={() => onRespond(offer.recipient, true)}
          >
            {name(offer.recipient)} · {fr ? 'Signer librement' : 'Sign voluntarily'}
          </button>
          <button
            type="button"
            disabled={paused || state.phase !== 'fighting'}
            onclick={() => onRespond(offer.recipient, false)}
          >
            {fr ? 'Refuser' : 'Decline'}
          </button>
        </div>
      {:else}
        <p>
          {fr
            ? 'L’IA peut accepter pour récupérer de l’aura, ou refuser.'
            : 'The AI may accept to recover aura, or decline.'}
        </p>
      {/if}
      {#if !canSign}<small
          >{fr
            ? 'Pour signer : rapprochez-vous à portée des mains, au sol et hors d’une attaque.'
            : 'To sign: stand within hand reach, grounded and outside an attack.'}</small
        >{/if}
    {:else if active}
      <p class="status">
        {fr ? 'Deux signatures · trêve en cours' : 'Two signatures · truce active'} · {(
          active.remainingFrames / 60
        ).toFixed(1)} s
      </p>
    {:else}
      <p class="status" role="status">
        {outcome() ||
          (fr
            ? 'L propose le pacte. Une touche ne vaut jamais signature.'
            : 'L offers the pact. A hit is never a signature.')}
      </p>
      <div class="actions">
        {#each sides.filter(human) as side (side)}
          {#if hasMoonlightAuthority(state[side])}
            <button
              type="button"
              disabled={!canSign || (state.moonlight?.cooldownFrames ?? 0) > 0}
              onclick={() => onOffer(side)}
            >
              {name(side)} · {fr ? 'Proposer le pacte' : 'Offer the pact'}
              {#if (state[side].moonlightLoan ?? 0) > 0}
                ({state[side].moonlightLoan}){/if}
            </button>
          {/if}
        {/each}
      </div>
    {/if}
    {#if state.player.moonlightZetsu || state.opponent.moonlightZetsu}
      <p class="penalty">
        {sides
          .filter((side) => state[side].moonlightZetsu)
          .map(name)
          .join(' · ')} — {fr
          ? 'Zetsu contractuel : les mouvements et coups physiques restent possibles.'
          : 'Contractual Zetsu: movement and physical strikes remain possible.'}
      </p>
    {/if}
  </aside>
{/if}

<style>
  .moonlight-panel {
    color: #d8dfeb;
    background: #111b26;
    border: 1px solid #65758d;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font: 500 0.78rem/1.45 var(--font-body);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: baseline;
  }
  header strong {
    color: #ecedff;
  }
  header span,
  small {
    color: #aab8cd;
  }
  p {
    margin: 0.4rem 0;
  }
  .status {
    color: #d8c8ff;
  }
  .penalty {
    color: #f7bb9f;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    color: #e8e2ff;
    background: #28324a;
    border: 1px solid #9c92b9;
    border-radius: 0.3rem;
    padding: 0.4rem 0.7rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #d8c8ff;
    outline-offset: 2px;
  }
</style>
