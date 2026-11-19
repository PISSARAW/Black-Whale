<script lang="ts">
  import { throwPerformanceFor } from '$lib/fighting/throws/catalogue'
  import { SUPER_THROW_COST } from '$lib/fighting/superThrow'
  import type { FighterId } from '$lib/fighting/types'
  export let fighterId: FighterId
  export let language: 'fr' | 'en'
  $: normal = throwPerformanceFor(fighterId, false)
  $: powered = throwPerformanceFor(fighterId, true)
</script>

<aside class="throw-guide">
  <p>
    <strong>{language === 'fr' ? 'Projection' : 'Throw'}</strong> · {normal?.name ??
      (language === 'fr' ? 'Prise normale' : 'Normal grab')}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Aura + Projection' : 'Aura + Throw'}</strong> · {powered?.name ??
      (language === 'fr' ? 'Super projection' : 'Super throw')} · {SUPER_THROW_COST} Nen
  </p>
  <p>
    {language === 'fr'
      ? 'Maintenez Aura en lançant la projection : dégâts de base +50 %, récupération plus longue. Le Nen est dépensé au départ, même en cas de raté ou de déprojection.'
      : 'Hold Aura when starting the throw: +50% base damage and longer recovery. Nen is spent on commitment, including a miss or throw tech.'}
  </p>
  {#if fighterId === 'chrollo'}<p>
      {language === 'fr'
        ? 'Un pantin déjà contrôlé et proche peut participer à la super projection.'
        : 'A nearby puppet already under your control can assist the super throw.'}
    </p>{/if}
  {#if fighterId === 'tserriednich'}<p>
      {language === 'fr'
        ? 'La super révèle le futur manqué si une prévision est déjà en phase de divergence.'
        : 'The super reveals the missed future when an existing forecast is diverging.'}
    </p>{/if}
  {#if fighterId === 'bonolenov'}<p>
      {language === 'fr'
        ? 'La lance participe à la super si Prologue est déjà préparé. Sinon, Bonolenov exécute Le dernier accord à mains nues.'
        : 'The spear assists the super when Prologue is already prepared. Otherwise Bonolenov performs The final chord barehanded.'}
    </p>{/if}
  {#if fighterId === 'hinrigh'}<p>
      {language === 'fr'
        ? 'Un pigeon Biohazard déjà transformé et proche peut accompagner la super projection.'
        : 'A nearby Biohazard pigeon already transformed can assist the super throw.'}
    </p>{/if}
  {#if fighterId === 'zakuro'}<p>
      {language === 'fr'
        ? 'Une plaie ouverte et trois unités de sang disponibles permettent à Bloody Mary d’accompagner la prise.'
        : 'An open wound and three available blood units let Bloody Mary assist the grab.'}
    </p>{/if}
  {#if fighterId === 'basho'}<p>
      {language === 'fr'
        ? 'Basho conserve son haïku préparé pour les coups de poing suivants.'
        : 'Basho keeps his prepared haiku for the following punches.'}
    </p>{/if}
</aside>

<style>
  .throw-guide {
    margin: 0.6rem 0;
    padding: 0.6rem;
    border-left: 2px solid #b69bd0;
  }
  p {
    margin: 0.25rem 0;
    font-size: 0.78rem;
  }
</style>
