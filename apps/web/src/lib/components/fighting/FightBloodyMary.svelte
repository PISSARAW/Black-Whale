<script lang="ts">
  import {
    maryCommandReady,
    maryOwned,
    maryState,
    type MaryCommand,
  } from '$lib/fighting/bloodyMary'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { maryHasInfusion } from '$lib/fighting/bloodyMaryEquipment'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onCommand: (side: FightSide, command: MaryCommand) => void
  const sides: FightSide[] = ['player', 'opponent']
  const commands: { command: MaryCommand; fr: string; en: string }[] = [
    {
      command: 'bleed',
      fr: 'Ouvrir une plaie · 2 PV + 1 aura',
      en: 'Open a wound · 2 HP + 1 aura',
    },
    {
      command: 'bind',
      fr: 'Déployer la prise · 3 sang + 12 aura',
      en: 'Deploy capture · 3 blood + 12 aura',
    },
    { command: 'slam', fr: 'Plaquer au sol', en: 'Slam to the ground' },
    {
      command: 'scout',
      fr: 'Gouttes-yeux · 3 sang + 8 aura',
      en: 'Eyed scouts · 3 blood + 8 aura',
    },
    { command: 'recall', fr: 'Rappeler le sang', en: 'Recall blood' },
    { command: 'infuse', fr: 'Perfusion · 2 s + 1 aura', en: 'Infusion · 2 s + 1 aura' },
  ]
  $: fr = language === 'fr'
  $: relevant = sides.some(
    (side) =>
      state[side].id === 'zakuro' ||
      maryOwned(state[side]) ||
      state[side].bloodyMary ||
      state[side].maryCapture,
  )
</script>

{#if relevant}
  <aside class="mary-panel" aria-label="Bloody Mary">
    <strong
      >Bloody Mary · {fr ? 'Le sang reste une matière' : 'Blood remains a physical medium'}</strong
    >
    <details>
      <summary>{fr ? 'Conditions et réglages de duel' : 'Conditions and duel tuning'}</summary>
      <p>
        {fr
          ? 'Zakuro contrôle son propre sang, libéré par une plaie, avec sa perfusion réelle (ch. 390). Le sang doit parcourir la distance jusqu’à la cible. Les gouttes-yeux explorent sans attaquer (ch. 391) : aucune lecture d’identité ou de Nen à distance.'
          : 'Zakuro controls his own blood, released through a wound, with his real infusion equipment (ch. 390). Blood must travel to the target. Eyed droplets scout without attacking (ch. 391): no remote identity or Nen reading.'}
      </p>
      <p>
        {fr
          ? 'Réglages de duel : 6 unités de sang, 6 unités en poche. Une perfusion immobile transfère 1 unité en 2 s, sans rendre de PV ; le sang rappelé peut être réutilisé. La prise dure au plus 1,5 s ; attendre 0,5 s avant la projection. Garde, déplacement hors de la trajectoire ou Ren/Ken avec 30 aura peuvent empêcher la capture. Maintenir Ren/Ken 0,4 s permet de se dégager. Le lanceur frappé ou privé de Nen lâche prise ; un coup reçu par la cible la libère aussi.'
          : 'Duel tuning: 6 blood units and 6 bag units. A stationary infusion transfers 1 unit in 2 s without healing HP; recalled blood can be reused. Capture lasts at most 1.5 s; wait 0.5 s before slamming. Guard, evasion or Ren/Ken with 30 aura can prevent capture. Maintain Ren/Ken for 0.4 s to escape. Hitting the user or sealing their Nen breaks the hold; hitting the captive also releases it.'}
      </p>
      <p>
        {fr
          ? 'Les gouttes ont une durée simulée de 30 minutes, dans l’intervalle de 30–40 minutes indiqué au manga. Elles ne révèlent qu’une position vue à proximité. Une goutte écrasée se reforme. Rappeler le sang ne soigne pas. Les copies exigent le sang, la plaie et le matériel du copieur.'
          : 'Scouts last 30 simulated minutes, within the manga’s stated 30–40 minutes. They only report positions they see nearby. A crushed drop reforms. Recalling blood does not heal. Copies require the borrower’s own blood, wound and equipment.'}
      </p>
    </details>
    {#each sides as side (side)}
      {@const fighter = state[side]}
      {#if fighter.id === 'zakuro' || maryOwned(fighter) || fighter.bloodyMary}
        {@const blood = maryState(fighter)}
        <p class="status">
          {fighterDefinition(fighter.id).name} · {fr ? 'Sang' : 'Blood'}
          {blood.available}/6 · {fr ? 'Poche' : 'Bag'}
          {blood.bags}/6 · {(fighter.openWounds ?? 0) > 0
            ? fr
              ? 'Plaie ouverte'
              : 'Open wound'
            : fr
              ? 'Plaie requise'
              : 'Wound required'}
        </p>
        {#if !maryHasInfusion(fighter)}<p class="warning">
            {fr
              ? 'Perfusion réelle manquante : le Hatsu ne fournit pas le matériel.'
              : 'Real infusion equipment missing: the ability does not supply it.'}
          </p>{/if}
        {#if side === 'player' || state.mode !== 'versus-ai'}
          <div class="actions">
            {#each commands as choice (choice.command)}
              <button
                type="button"
                disabled={paused || !maryCommandReady(state, side, choice.command)}
                onclick={() => onCommand(side, choice.command)}>{fr ? choice.fr : choice.en}</button
              >
            {/each}
          </div>
        {/if}
        {#if blood.infusion}<p role="status">
            {fr ? 'Perfusion en cours, restez immobile…' : 'Infusing, remain still…'}
          </p>{/if}
        {#if blood.tendril}<p role="status">
            {fr ? 'Sang déployé' : 'Blood deployed'} · {blood.tendril.phase === 'bound'
              ? fr
                ? 'prise établie'
                : 'captured'
              : blood.tendril.phase === 'returning'
                ? fr
                  ? 'retour'
                  : 'returning'
                : blood.tendril.phase === 'resting'
                  ? fr
                    ? 'au sol'
                    : 'on the ground'
                  : fr
                    ? 'en trajet'
                    : 'travelling'}
          </p>{/if}
        {#if blood.drops.length}<p>
            {blood.drops.length}
            {fr ? 'gouttes en reconnaissance' : 'scouting droplets'}
          </p>{/if}
        {#if blood.lastSeen}<p>
            {fr ? 'Dernière position observée' : 'Last observed position'} : {blood.lastSeen.x.toFixed(
              1,
            )} · {Math.max(0, (state.frame - blood.lastSeen.frame) / 60).toFixed(1)} s
          </p>{/if}
      {/if}
      {#if fighter.maryCapture}<p class="warning" role="status">
          {fighterDefinition(fighter.id).name} · {fr
            ? 'Pris dans le sang. Nen libre : Ren/Ken permet de résister.'
            : 'Held by blood. Nen remains available: Ren/Ken allows resistance.'}
        </p>{/if}
    {/each}
  </aside>
{/if}

<style>
  .mary-panel {
    padding: 0.7rem 1rem;
    color: #f7dfe4;
    background: #25151d;
    border: 1px solid #a65b73;
    border-radius: 0.5rem;
    font: 500 0.78rem/1.45 var(--font-body);
  }
  p {
    margin: 0.4rem 0;
  }
  summary {
    cursor: pointer;
    color: #e4aabb;
    margin-top: 0.3rem;
  }
  .status {
    color: #efb1c2;
  }
  .warning {
    color: #ffc7a8;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  button {
    color: #ffeaf0;
    background: #482837;
    border: 1px solid #bb7990;
    border-radius: 0.3rem;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #f6b7cc;
    outline-offset: 2px;
  }
</style>
