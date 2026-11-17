<script lang="ts">
  import FightNenPerception from './FightNenPerception.svelte'
  import { enDescription } from '$lib/fighting/en/presentation'
  import { activeEnRadius } from '$lib/fighting/en/access'
  import { MAX_EN_CONTACTS } from '$lib/fighting/en/contacts'
  import { FIGHT_CATEGORIES, fightCategoryEfficiency } from '$lib/fighting/nenCategories'
  import { FIGHT_NEN_PROFILES } from '$lib/fighting/nenCatalogue.gen'
  import { enContacts, gyoSight } from '$lib/fighting/nenPerception'
  import { shuObject } from '$lib/fighting/nenAdvanced'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false
  export let viewer: FightSide = 'player'
  $: own = side === viewer && !state.spectatorView
  $: inspect = own || (!state.spectatorView && gyoSight(state[viewer]))
  $: fighter = state[side]
  $: enText = enDescription(fighter, language)
  $: radius = activeEnRadius(fighter)
  $: contacts = enContacts(state, side)
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
    >{labels[language][profile?.affinity ?? 'unknown']}{inspect && fighter.kurapika?.emperorTime
      ? ' · EMPEROR TIME · 100 %'
      : ''}</span
  >
  <small>{enText}</small>
  {#if inspect}
    {#if radius}<span
        >En · {radius} · {contacts}{contacts === MAX_EN_CONTACTS ? '+' : ''}
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
  {:else}<small
      >{language === 'fr'
        ? 'Aura non inspectée · Gyo pour lire sa répartition'
        : 'Aura not inspected · Gyo reads its allocation'}</small
    >{/if}
  {#if own}<FightNenPerception {state} {side} {language} />{/if}
  {#if detailed && inspect}
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
