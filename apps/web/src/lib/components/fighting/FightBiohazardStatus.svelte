<script lang="ts">
  import {
    BIOHAZARD_CAPTURE,
    BIOHAZARD_TRANSFORM,
    biohazardAuthority,
  } from '$lib/fighting/biohazard'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import { HINRIGH_KNIVES } from '$lib/fighting/hinrighKnives'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { hasEquipment } from '$lib/fighting/preparationWorld'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: fighter = state[side]
  const labels = {
    fr: {
      carried: 'En main',
      transforming: 'Transformation',
      flying: 'Pigeon en vol',
      bound: 'Menottes fermées',
      returning: 'Rappel',
      dropped: 'Au sol · à récupérer',
      broken: 'Détruites',
    },
    en: {
      carried: 'In hand',
      transforming: 'Transforming',
      flying: 'Pigeon flying',
      bound: 'Cuffs locked',
      returning: 'Recalling',
      dropped: 'Dropped · recover',
      broken: 'Destroyed',
    },
  }
</script>

{#if fighter.biohazard || biohazardAuthority(fighter)}
  <div class="biohazard-status" aria-label="Biohazard">
    <strong>Biohazard · {language === 'fr' ? 'Objets réels' : 'Physical objects'}</strong>
    {#if fighter.id === 'hinrigh'}
      <span
        >{language === 'fr' ? 'Couteaux restants' : 'Knives remaining'} : {fighter.hinrighKnives ??
          HINRIGH_KNIVES}</span
      >
    {/if}
    <div class="inventory">
      {#each fighter.biohazard?.objects ?? [] as object (object.id)}
        <div class:broken={object.phase === 'broken'}>
          <span>{language === 'fr' ? 'Menottes' : 'Handcuffs'} {object.id + 1}</span>
          <b>{labels[language][object.phase]}</b>
          {#if object.phase === 'transforming'}
            <progress
              max={BIOHAZARD_TRANSFORM}
              value={object.frames}
              aria-label={labels[language].transforming}
            ></progress>
          {/if}
        </div>
      {/each}
      {#each fighter.biohazardDevices ?? [] as device (device.id)}
        <div>
          <span
            >{device.kind === 'camera'
              ? language === 'fr'
                ? 'Caméra-chat'
                : 'Cat camera'
              : device.kind === 'gun'
                ? language === 'fr'
                  ? 'Arme-serpent'
                  : 'Snake gun'
                : language === 'fr'
                  ? 'Émetteur-huître'
                  : 'Oyster transmitter'}</span
          >
          <b
            >{device.phase === 'active'
              ? language === 'fr'
                ? 'Transformé'
                : 'Transformed'
              : device.phase === 'preparing'
                ? labels[language].transforming
                : device.phase === 'dropped'
                  ? language === 'fr'
                    ? 'Objet d’origine'
                    : 'Original object'
                  : device.phase === 'carried'
                    ? labels[language].carried
                    : labels[language].broken}{device.kind === 'gun'
              ? ` · ${device.ammo ?? 0}`
              : ''}</b
          >
        </div>
      {/each}
      {#if !fighter.biohazard?.objects.length}
        <span
          >{language === 'fr'
            ? 'Menottes réelles requises : copier Biohazard ne copie pas son équipement.'
            : 'Real handcuffs required: copying Biohazard does not copy its equipment.'}</span
        >
      {/if}
    </div>
    <small
      >{language === 'fr'
        ? 'L : transformer · ↓+L : rappel / ouverture au contact · U : couteau réel'
        : 'L: transform · ↓+L: recall / unlock at contact · U: real knife'}</small
    >
    <small
      >{language === 'fr'
        ? 'Garde, saut ou frappe pour éviter la capture. Aucun dégât ni Zetsu.'
        : 'Guard, jump or strike to avoid capture. No damage or Zetsu.'}</small
    >
  </div>
{/if}
{#if hasEquipment(fighter, 'tracker-receiver')}
  <small
    >{language === 'fr' ? 'Récepteur en main' : 'Receiver in hand'}{fighter.biohazardSignal
      ? ` · ${language === 'fr' ? 'Position relevée' : 'Last reading'} : ${fighter.biohazardSignal.x.toFixed(1)}, ${fighter.biohazardSignal.y.toFixed(1)} · f${fighter.biohazardSignal.frame}`
      : ''}</small
  >
{/if}
{#if fighter.biohazardFootage}
  <details>
    <summary
      >{language === 'fr' ? 'Enregistrement consulté' : 'Reviewed footage'} · {fighter
        .biohazardFootage.length}</summary
    >
    {#each fighter.biohazardFootage.slice(-8) as sample, index (index)}
      <small
        >f{sample.frame} · {fighterDefinition(sample.appearance).name} · {sample.x.toFixed(1)}, {sample.y.toFixed(
          1,
        )}</small
      >
    {/each}
  </details>
{/if}
{#if !fighter.biohazardRestraint && (fighter.biohazardGraceFrames ?? 0) > 0}
  <small class="grace"
    >{language === 'fr' ? 'Protection contre une nouvelle capture' : 'Protection from recapture'} · {(
      (fighter.biohazardGraceFrames ?? 0) / 60
    ).toFixed(1)} s</small
  >
{/if}
{#if fighter.biohazardRestraint}
  <div class="biohazard-capture" role="status">
    <strong>{language === 'fr' ? 'Pigeon-menottes · Capturé' : 'Handcuff pigeon · Captured'}</strong
    >
    <progress
      max={BIOHAZARD_CAPTURE}
      value={fighter.biohazardRestraint.frames}
      aria-label={language === 'fr' ? 'Temps de capture restant' : 'Remaining capture time'}
    ></progress>
    <small
      >{language === 'fr'
        ? 'Libération sur blessure ou après 0,8 s · Nen conservé'
        : 'Release on injury or after 0.8 s · Nen retained'}</small
    >
  </div>
{/if}

<style>
  .biohazard-status,
  .biohazard-capture {
    display: grid;
    gap: 0.35rem;
    font: 600 0.72rem/1.4 var(--font-mono);
    color: #bdd6c8;
    min-width: 0;
  }
  strong {
    color: #92d7af;
  }
  .inventory {
    display: grid;
    gap: 0.25rem;
  }
  .inventory > div {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.3rem;
    padding: 0.25rem 0.4rem;
    background: #121d20;
    border: 1px solid #355047;
  }
  .broken {
    opacity: 0.55;
  }
  .biohazard-capture {
    padding: 0.4rem;
    border: 1px solid #9dccb0;
  }
  progress {
    width: 100%;
    height: 0.35rem;
    accent-color: #81cfa1;
  }
  small {
    color: #a3b9ae;
    overflow-wrap: anywhere;
  }
  .grace {
    font: 600 0.72rem/1.4 var(--font-mono);
    color: #9ed3b2;
  }
</style>
