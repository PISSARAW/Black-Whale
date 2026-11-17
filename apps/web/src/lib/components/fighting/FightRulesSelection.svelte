<script lang="ts">
  import { fightStage } from '$lib/fighting/stages'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FightFormatId } from '$lib/fighting/formats'
  import type { FightMode, FighterId } from '$lib/fighting/types'
  import { link } from '$lib/i18n'
  import FightPortrait from './FightPortrait.svelte'
  import FightFormatPicker from './FightFormatPicker.svelte'
  import FightPreparationSetup from './FightPreparationSetup.svelte'
  import FightArenaSetup from './FightArenaSetup.svelte'
  import FightIllumiEquipment from './FightIllumiEquipment.svelte'
  import FightInputSettings from './FightInputSettings.svelte'
  import FightSetupFooter from './FightSetupFooter.svelte'
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let environment: FightEnvironment
  export let format: FightFormatId
  export let mode: FightMode
  export let controls: FightControls
  export let onEnvironment: (next: FightEnvironment) => void
  export let onFormat: (id: FightFormatId) => void
  export let onLaunch: () => void
  $: fr = language === 'fr'
  $: stage = fightStage(environment.stageId)
  $: modeLabel = {
    'versus-ai': fr ? 'Contre l’IA' : 'Versus AI',
    'versus-local': fr ? 'Versus local' : 'Local versus',
    training: fr ? 'Entraînement' : 'Training',
  }[mode]
</script>

<section class="clash-page" aria-labelledby="rules-title">
  <p class="clash-kicker">BATTLE SETTINGS</p>
  <h1 class="clash-title" id="rules-title">
    {fr ? 'Prêt pour le face-à-face ?' : 'Ready for the face-off?'}
  </h1>
  <p class="clash-subtitle">
    {fr
      ? 'Un dernier réglage. Puis place au combat.'
      : 'One final touch. Then let the fight begin.'}
  </p>
  <div class="rules-layout">
    <div class="rules-main">
      <FightFormatPicker selected={format} {language} onSelect={onFormat} />
      <div class="arena-option">
        <FightArenaSetup {environment} {language} {onEnvironment} />
        <p>
          {fr
            ? 'Les couverts peuvent être détruits et les capacités de terrain sont disponibles.'
            : 'Enable destructible cover and terrain abilities.'}
        </p>
      </div>
      <details class="clash-advanced">
        <summary
          >{fr ? 'Options avancées & équipement' : 'Advanced options & equipment'}<span
            >{fr ? 'Facultatif' : 'Optional'}</span
          ></summary
        >
        <div class="advanced-content">
          <FightIllumiEquipment
            {environment}
            {player}
            {opponent}
            {language}
            {onEnvironment}
          /><FightPreparationSetup
            {environment}
            {player}
            {opponent}
            {language}
            onChange={onEnvironment}
          />
        </div>
      </details>
      <div class="rules-controls">
        <span
          ><strong>{fr ? 'Clavier & manettes' : 'Keyboard & controllers'}</strong><small
            >{fr
              ? 'Personnalise tes touches avant de jouer.'
              : 'Customize your controls before playing.'}</small
          ></span
        ><FightInputSettings {controls} {language} />
      </div>
    </div>
    <aside class="match-ticket" aria-label={fr ? 'Récapitulatif du combat' : 'Fight summary'}>
      <div class="ticket-head"><span>MATCH / 001</span><span>{modeLabel}</span></div>
      <div class="ticket-fighters">
        <div><FightPortrait id={player} /></div>
        <b aria-hidden="true"></b>
        <div><FightPortrait id={opponent} reverse /></div>
      </div>
      <div class="ticket-names">
        <strong>{fighterDefinition(player).name}</strong><strong
          >{fighterDefinition(opponent).name}</strong
        >
      </div>
      <div class="ticket-stage">
        <small>{fr ? 'TERRAIN' : 'STAGE'}</small><strong>{fr ? stage.nameFr : stage.nameEn}</strong
        ><a href={$link('/fighting/stage')}>{fr ? 'Modifier' : 'Edit'} ↗</a>
      </div>
      <p class="ticket-tip">
        {fr
          ? 'Tes choix sont conservés lorsque tu reviens en arrière.'
          : 'Your selections stay with you when you go back.'}
      </p>
    </aside>
  </div>
  <FightSetupFooter
    {language}
    {player}
    {opponent}
    back="/fighting/stage"
    nextLabel={fr ? 'Entrer dans l’arène' : 'Enter the arena'}
    onNext={onLaunch}
  />
</section>

<style>
  .rules-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.8fr);
    gap: 2rem;
  }
  .rules-main :global(.format-picker) {
    margin-top: 0;
  }
  .rules-main :global(.format-label span) {
    display: none;
  }
  .rules-main :global(.format-label) {
    font-size: 0.7rem;
    color: #e6d7ee;
  }
  .rules-main :global(.format-grid button) {
    border-color: #514158;
    background: #19131f;
    border-radius: 0;
    min-height: 170px;
  }
  .rules-main :global(.format-grid button.selected) {
    border-color: var(--clash-orange);
    box-shadow: inset 0 0 0 1px var(--clash-orange);
    background: #ff864b0b;
  }
  .rules-main :global(.format-grid strong) {
    font-family: Arial, sans-serif;
    font-style: italic;
    font-weight: 900;
    font-size: 1rem;
  }
  .rules-main :global(.format-grid small) {
    color: #b3a3bf;
  }
  .rules-main :global(.format-grid b) {
    color: var(--clash-orange);
  }
  .arena-option {
    padding: 1.2rem;
    margin: 1rem 0;
    border: 1px solid #514158;
    background: #17121d;
    font-size: 0.8rem;
  }
  .arena-option :global(label) {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    line-height: 1.5;
  }
  .arena-option :global(input) {
    accent-color: #ff864b;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  .arena-option p {
    margin: 0.6rem 0 0 1.8rem;
    color: #a99ab5;
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .clash-advanced {
    border: 1px solid #514158;
    margin: 1rem 0;
  }
  .clash-advanced > summary {
    padding: 1rem;
    min-height: 44px;
    cursor: pointer;
    color: #d2c4de;
    font: 600 0.72rem/1.5 var(--font-mono);
  }
  .clash-advanced > summary span {
    float: right;
    color: #94839f;
    font-size: 0.6rem;
  }
  .advanced-content {
    padding: 0 1rem 1rem;
  }
  .rules-controls {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #514158;
  }
  .rules-controls strong {
    display: block;
    color: #d9cce4;
    font-size: 0.8rem;
  }
  .rules-controls small {
    display: block;
    color: #a99ab5;
    font-size: 0.7rem;
    margin-top: 0.3rem;
  }
  .match-ticket {
    align-self: start;
    overflow: hidden;
    border: 1px solid #654876;
    background: radial-gradient(ellipse at 50% 20%, #49225145, #16101d 70%);
  }
  .ticket-head {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #ffffff18;
    color: #bdaacb;
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.05em;
  }
  .ticket-fighters {
    display: grid;
    position: relative;
    grid-template-columns: 1fr 1fr;
    height: 220px;
  }
  .ticket-fighters > div {
    min-width: 0;
  }
  .ticket-fighters b {
    position: absolute;
    left: 42%;
    top: 45%;
    z-index: 3;
    color: #ff9a64;
    font:
      italic 900 2rem Arial,
      sans-serif;
  }
  .ticket-fighters b::before {
    content: 'VS';
  }
  .ticket-names {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem 1.2rem;
    color: #f7eefe;
    text-transform: uppercase;
    font:
      italic 800 0.9rem Arial,
      sans-serif;
  }
  .ticket-names strong:last-child {
    text-align: right;
  }
  .ticket-stage {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #ffffff18;
    border-bottom: 1px dashed #654876;
  }
  .ticket-stage small {
    grid-column: 1 / -1;
    color: #af90c7;
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.12em;
  }
  .ticket-stage strong {
    font-size: 0.8rem;
  }
  .ticket-stage a {
    color: #ff9a64;
    font: 0.6rem var(--font-mono);
  }
  .ticket-tip {
    padding: 0.5rem 1rem;
    color: #a492b2;
    font: 0.6rem/1.6 var(--font-mono);
  }
  @media (max-width: 850px) {
    .rules-layout {
      grid-template-columns: 1fr;
    }
    .match-ticket {
      display: block;
      order: -1;
    }
    .ticket-fighters,
    .ticket-tip {
      display: none;
    }
    .rules-main :global(.format-grid button) {
      min-height: 0;
    }
  }
  @media (max-width: 450px) {
    .rules-controls {
      flex-direction: column;
      align-items: stretch;
    }
    .clash-advanced > summary span {
      display: none;
    }
  }
</style>
