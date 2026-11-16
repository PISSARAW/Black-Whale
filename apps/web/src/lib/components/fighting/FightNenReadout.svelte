<script lang="ts">
  import { FIGHT_CATEGORIES, fightCategoryEfficiency } from '$lib/fighting/nenCategories'
  import { FIGHT_NEN_PROFILES } from '$lib/fighting/nenCatalogue.gen'
  import { enContacts, gyoSight } from '$lib/fighting/nenPerception'
  import { auraDistribution } from '$lib/fighting/nen'
  import { shuObject } from '$lib/fighting/nenAdvanced'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false
  $: fighter = state[side]
  $: opponent = state[side === 'player' ? 'opponent' : 'player']
  $: profile = FIGHT_NEN_PROFILES[fighter.id]
  const labels = {
    fr: {
      enhancer: 'Renforcement',
      emitter: 'Émission',
      conjurer: 'Matérialisation',
      transmuter: 'Transformation',
      manipulator: 'Manipulation',
      specialist: 'Spécialisation',
      unknown: 'Affinité inconnue',
    },
    en: {
      enhancer: 'Enhancement',
      emitter: 'Emission',
      conjurer: 'Conjuration',
      transmuter: 'Transmutation',
      manipulator: 'Manipulation',
      specialist: 'Specialization',
      unknown: 'Unknown affinity',
    },
  }
</script>

<div class="nen-readout">
  <span
    >{labels[language][profile?.affinity ?? 'unknown']}{fighter.kurapika?.emperorTime
      ? ' · EMPEROR TIME · 100 %'
      : ''}</span
  >
  {#if fighter.nen.en}<span
      >En · {fighter.nen.en.radius} · {enContacts(state, side)}
      {language === 'fr' ? 'contacts détectés' : 'contacts detected'}</span
    >{/if}
  {#if fighter.nen.shu.length}<span
      >Shu · {shuObject(fighter)} · {language === 'fr'
        ? 'objet renforcé · corps moins protégé'
        : 'reinforced object · thinner body defence'}</span
    >{/if}
  {#if fighter.nen.in}<span
      >In · {language === 'fr'
        ? 'aura dissimulée, corps visible'
        : 'aura concealed, body visible'}</span
    >{/if}
  {#if gyoSight(fighter)}
    <span
      >Gyo · {language === 'fr' ? 'Aura adverse' : 'Opponent aura'} : {opponent.nen.mode === 'zetsu'
        ? 'Zetsu'
        : auraDistribution(opponent)}{opponent.nen.in ? ' · In' : ''}</span
    >
  {/if}
  {#if detailed}
    <div class="efficiencies">
      {#each FIGHT_CATEGORIES as category (category)}
        <span
          >{labels[language][category]}
          {Math.round(fightCategoryEfficiency(fighter, category) * 100)} %</span
        >
      {/each}
    </div>
    <small
      >{language === 'fr'
        ? 'Efficacité des actions apprises · ne confère aucun nouveau Hatsu'
        : 'Efficiency of learned actions · grants no new Hatsu'}</small
    >
  {/if}
</div>

<style>
  .nen-readout {
    display: grid;
    gap: 0.25rem;
    color: #b9d9e5;
  }
  .efficiencies {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.7rem;
  }
  small {
    color: #a9b5bd;
  }
</style>
