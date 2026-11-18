<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { BEYOND_CURSE } from '$lib/fighting/beyondCurse'
  import { moveById } from '$lib/fighting/movesets'
  import { outsideDuelAbility } from '$lib/fighting/outsideDuelAbility'
  import { dolphinMissingBattleBody } from '$lib/fighting/battleCantabileRules'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false
  $: useKey = side === 'player' ? $bindings.playerSpecial : $bindings.opponentSpecial
  $: fighter = state[side]
  $: chain = fighter.kurapika
  $: held = chain?.held
  $: outsideDuel = outsideDuelAbility(held?.moveId)
  $: missingBody = dolphinMissingBattleBody(fighter)
  $: ability = outsideDuel ?? moveById(held?.moveId)
  $: hourFormat = new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    maximumFractionDigits: 2,
  })
  $: hours = hourFormat.format((chain?.lifespanFrames ?? 0) / 60)
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
        {#if held.source === 'chrollo' && !fighter.chrolloBook}
          <div>
            {language === 'fr'
              ? 'Skill Hunter : livre et conditions d’acquisition requis ; aucun Hatsu gratuit.'
              : 'Skill Hunter requires its book and acquisition conditions; no free Hatsu.'}
          </div>
        {:else if (outsideDuel && (!state.battlefield || outsideDuel.id === BEYOND_CURSE.id)) || missingBody}
          <div>
            {missingBody
              ? language === 'fr'
                ? 'Battle Cantabile : orifices corporels requis absents.'
                : 'Battle Cantabile: required body holes are absent.'
              : language === 'fr'
                ? outsideDuel?.reasonFr
                : outsideDuel?.reasonEn}
            {language === 'fr'
              ? 'Capacité conservée ; sa préparation reste requise.'
              : 'Ability retained; its preparation is still required.'}
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
