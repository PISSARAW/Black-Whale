<script lang="ts">
  import { moveById } from '$lib/fighting/movesets'
  import { outsideDuelAbility } from '$lib/fighting/outsideDuelAbility'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false
  $: useKey = side === 'opponent' && state.mode === 'versus-local' ? ',' : 'L'
  $: fighter = state[side]
  $: chain = fighter.kurapika
  $: held = chain?.held
  $: outsideDuel = outsideDuelAbility(held?.moveId)
  $: ability = outsideDuel ?? moveById(held?.moveId)
  $: hours = ((chain?.lifespanFrames ?? 0) / 60).toLocaleString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { maximumFractionDigits: 2 },
  )
</script>

{#if chain || fighter.chainJail || fighter.judgmentChain || fighter.stolenChainAbility || fighter.drainingChain}
  <div
    class="chain-status"
    class:scarlet={chain?.emperorTime}
    class:danger={Boolean(fighter.judgmentChain || fighter.chainJail)}
  >
    {#if chain}
      {#if detailed || chain.emperorTime || chain.lifespanFrames > 0}<div>
          Emperor Time · {chain.emperorTime ? 'ON' : 'OFF'} · {language === 'fr'
            ? 'vie perdue'
            : 'lifespan lost'} : {hours} h
        </div>{/if}
      {#if chain.blackoutFrames > 0}
        <div>
          {language === 'fr' ? 'INCONSCIENT' : 'UNCONSCIOUS'} · {Math.ceil(
            chain.blackoutFrames / 3600,
          )} min
        </div>
      {/if}
      {#if held}
        <div>
          {language === 'fr' ? ability?.nameFr : ability?.nameEn} · {held.loaded
            ? 'Stealth Dolphin'
            : 'Steal Chain'}
        </div>
        {#if outsideDuel}
          <div>
            {language === 'fr'
              ? 'Hors duel : aucun petit animal réel à contrôler. Capacité conservée dans Steal Chain.'
              : 'Outside the duel: no real small animal to control. Ability retained in Steal Chain.'}
          </div>
        {:else}
          <div>
            {language === 'fr'
              ? held.used
                ? `← + ${useKey} : terminer l’effet · Emperor Time verrouillé`
                : held.loaded
                  ? `← + ${useKey} : usage unique · Emperor Time verrouillé`
                  : `Activer Emperor Time, puis ← + ${useKey} pour charger`
              : held.used
                ? `← + ${useKey}: end effect · Emperor Time locked`
                : held.loaded
                  ? `← + ${useKey}: single use · Emperor Time locked`
                  : `Activate Emperor Time, then ← + ${useKey} to load`}
          </div>
        {/if}
      {/if}
    {/if}
    {#if fighter.chainJail}<div>
        Chain Jail · {language === 'fr' ? 'IMMOBILISÉ · ZETSU FORCÉ' : 'RESTRAINED · FORCED ZETSU'}
      </div>{/if}
    {#if fighter.drainingChain}<div>
        Steal Chain · {language === 'fr' ? 'drainage d’aura' : 'aura draining'}
      </div>{/if}
    {#if fighter.stolenChainAbility}<div>
        {language === 'fr' ? 'Capacité retenue dans Steal Chain' : 'Ability held in Steal Chain'}
      </div>{/if}
    {#if fighter.judgmentChain}
      <div>
        Judgment Chain · {language === 'fr' ? 'RÈGLE : RESTE EN ZETSU' : 'RULE: REMAIN IN ZETSU'}
      </div>
      <div>
        {language === 'fr'
          ? 'Aura / Hatsu / tir Nen → mort · coups physiques autorisés'
          : 'Aura / Hatsu / Nen shot → death · physical strikes allowed'}
      </div>
    {/if}
  </div>
{/if}

<style>
  .chain-status {
    margin-top: 0.3rem;
    color: #e6d99c;
    font: 600 0.55rem/1.35 var(--font-mono);
    text-shadow: 0 1px 4px #000;
  }
  .scarlet {
    color: #ff8989;
  }
  .danger {
    color: #ffbd7b;
  }
</style>
