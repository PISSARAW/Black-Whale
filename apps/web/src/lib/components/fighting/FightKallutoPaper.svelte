<script lang="ts">
  import FightKallutoReceivers from './FightKallutoReceivers.svelte'
  import FightKallutoSupplies from './FightKallutoSupplies.svelte'
  import {
    PAPER_ZONES,
    PAPER_COSTS,
    paperState,
    paperAvailable,
    hasPlantedPaper,
    paperCommandReady,
  } from '$lib/fighting/kallutoPaper'
  import { paperListening } from '$lib/fighting/kallutoListening'
  import type { PaperCommand } from '$lib/fighting/kallutoPaper'
  import type { FightNenZone, FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onZone: (side: FightSide, zone: FightNenZone) => void
  export let onCommand: (side: FightSide, command: PaperCommand) => void
  export let onUse: (side: FightSide, command: PaperCommand) => void
  export let onSpeak: (side: FightSide, words: string) => void
  export let onEditing: () => void
  let voices: Record<FightSide, string> = { player: '', opponent: '' }
  const sides: FightSide[] = ['player', 'opponent']
  const zones = {
    fr: { head: 'Tête', torso: 'Torse', hands: 'Mains', feet: 'Pieds' },
    en: { head: 'Head', torso: 'Torso', hands: 'Hands', feet: 'Feet' },
  }
  const commands: PaperCommand[] = ['plant', 'serpent', 'doll']
  const names = {
    fr: {
      plant: 'Planter le papier',
      serpent: 'Danse de la morsure',
      doll: 'Confectionner la poupée',
    },
    en: { plant: 'Plant paper', serpent: 'Serpent Bite Dance', doll: 'Make paper doll' },
  }
</script>

{#if sides.some((side) => state[side].id === 'kalluto' || state[side].kallutoPaper || paperAvailable(state[side]))}
  <section
    class="paper-panel"
    aria-label={language === 'fr' ? 'Papier de Kalluto' : 'Kalluto paper'}
  >
    {#each sides as side (side)}
      {@const fighter = state[side]}
      {@const memory = paperState(fighter)}
      {@const specialKey = side === 'player' ? 'L' : ','}
      {@const finishKey = side === 'player' ? 'H' : 'B'}
      {@const interactive =
        state.phase === 'fighting' && !paused && (side === 'player' || state.mode !== 'versus-ai')}
      {#if fighter.id === 'kalluto' || fighter.kallutoPaper || paperAvailable(fighter)}
        <div class="paper-user">
          <strong
            >{side === 'player' ? 'P1' : state.mode === 'versus-ai' ? 'CPU' : 'P2'} · {language ===
            'fr'
              ? 'Papier et poupée'
              : 'Paper and doll'}</strong
          >
          <label
            >{language === 'fr' ? 'Zone visée' : 'Target zone'}
            <select
              aria-label={`${side} ${language === 'fr' ? 'zone de papier' : 'paper zone'}`}
              value={memory.zone}
              disabled={!interactive || Boolean(fighter.attack)}
              onchange={(event) => onZone(side, event.currentTarget.value as FightNenZone)}
            >
              {#each PAPER_ZONES as zone (zone)}<option value={zone}>{zones[language][zone]}</option
                >{/each}
            </select>
          </label>
          <span
            >{language === 'fr' ? 'Papiers plantés sur la cible' : 'Paper embedded in the target'} :
            {PAPER_ZONES.filter((zone) => hasPlantedPaper(state, side, zone))
              .map((zone) => zones[language][zone])
              .join(', ') || '—'}
          </span>
          {#if fighter.id === 'kalluto'}
            <div class="paper-actions">
              {#each commands as command (command)}
                <button
                  disabled={!interactive ||
                    Boolean(fighter.attack) ||
                    !paperCommandReady(state, side, command) ||
                    fighter.aura < PAPER_COSTS[command]}
                  onclick={() => onUse(side, command)}>{names[language][command]}</button
                >
              {/each}
            </div>
          {:else}
            <label
              >{language === 'fr' ? 'Usage copié' : 'Copied use'}
              <select
                value={memory.command ?? 'plant'}
                disabled={!interactive || Boolean(fighter.attack)}
                onchange={(event) => onCommand(side, event.currentTarget.value as PaperCommand)}
              >
                {#each commands as command (command)}<option value={command}
                    >{names[language][command]}</option
                  >{/each}
              </select>
            </label>
          {/if}
          <span
            >{language === 'fr' ? 'Poupée' : 'Doll'} : {memory.doll
              ? paperListening(state, side)
                ? language === 'fr'
                  ? 'Écoute active'
                  : 'Listening'
                : language === 'fr'
                  ? 'Écoute interrompue'
                  : 'Listening interrupted'
              : language === 'fr'
                ? 'Non confectionnée'
                : 'Not made'}</span
          >
          <p aria-live="polite">
            {language === 'fr' ? 'Dernière parole entendue' : 'Last words heard'} :
            {memory.heard
              ? `${memory.heard.speaker === 'player' ? 'P1' : 'P2'} · « ${language === 'fr' && memory.heard.text === 'I am here.' ? 'Je suis ici.' : memory.heard.text} »`
              : '—'}
          </p>
          <FightKallutoReceivers {state} {side} {language} />
          <FightKallutoSupplies {state} {side} {language} />
          <small
            >{language === 'fr'
              ? `${specialKey} : planter · ↓ ${specialKey} : pieds · → ${specialKey} / ${finishKey} : serpent vers la zone choisie · ← ${specialKey} : poupée. Un papier suffit à désigner sa zone ; aucune explosion ni exécution automatique.`
              : `${specialKey}: plant · ↓ ${specialKey}: feet · → ${specialKey} / ${finishKey}: stream to the chosen zone · ← ${specialKey}: doll. One fragment designates its zone; no explosion or automatic execution.`}</small
          >
        </div>
      {/if}
    {/each}
    <div class="paper-voices">
      <small
        >{language === 'fr'
          ? 'La poupée relaie les paroles près de la cible marquée. T / V ou Parler émet une phrase ; les pensées et les actions silencieuses restent inconnues.'
          : 'The doll relays speech near the marked subject. T / V or Talk emits a phrase; thoughts and silent actions stay unknown.'}</small
      >
      {#each sides as side (side)}
        <label
          >{side === 'player' ? 'P1' : 'P2'} · {language === 'fr' ? 'Paroles' : 'Words'}
          <input
            bind:value={voices[side]}
            maxlength="160"
            aria-label={`${side} ${language === 'fr' ? 'paroles émises' : 'spoken words'}`}
            placeholder={language === 'fr' ? 'Je suis ici.' : 'I am here.'}
            disabled={paused ||
              state.phase !== 'fighting' ||
              (side === 'opponent' && state.mode === 'versus-ai')}
            onfocus={onEditing}
          />
        </label>
        <button
          disabled={paused ||
            state.phase !== 'fighting' ||
            (side === 'opponent' && state.mode === 'versus-ai')}
          onclick={() =>
            onSpeak(
              side,
              voices[side].trim() || (language === 'fr' ? 'Je suis ici.' : 'I am here.'),
            )}>{side === 'player' ? 'P1' : 'P2'} · {language === 'fr' ? 'Parler' : 'Talk'}</button
        >
      {/each}
      <small
        >{language === 'fr'
          ? 'Zones du corps, dégâts, coûts, animations et rayon des voix : réglages du duel.'
          : 'Body zones, damage, costs, animations and voice radius: duel tuning.'}</small
      >
    </div>
  </section>
{/if}

<style>
  .paper-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    padding: 0.7rem;
    border: 1px solid #5e5962;
    background: #161b22;
    color: #e9dfdb;
    font: 0.8rem/1.5 var(--font-mono);
  }
  .paper-user {
    display: flex;
    flex: 1 1 280px;
    flex-direction: column;
    gap: 0.4rem;
  }
  .paper-voices,
  .paper-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .paper-voices {
    flex-basis: 100%;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  button,
  input,
  select {
    background: #282832;
    color: #f6e5df;
    border: 1px solid #8b7b84;
    padding: 0.35rem 0.5rem;
  }
  button:disabled {
    opacity: 0.45;
  }
  p {
    margin: 0;
  }
  small {
    color: #b6b1bb;
  }
</style>
